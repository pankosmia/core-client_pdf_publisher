import { PDFDocument } from "pdf-lib";
import { constants, toTemp } from "./helpers";
// import { fontKit } from "fontkit";
import templates from "./HTML";
import { getCssFromLookUp, pdfToTemp } from "./helpers/PankosmiaUtils";
/**
 * Generates HTML for page numbers and converts it to a PDF.
 * Does this 100 pages at a time because of weird Puppeteer 180-page limit
 * @param {Object} params - Parameters for generating page numbers.
 *   - options: Object - Configuration options including paths and verbose flag.
 *   - numPages: number - Total number of pages.
 * @returns {Promise<string>} - Path to the generated page numbers PDF.
 */
const doPageNumber = async ({ options, numPages, Css }) => {
  const masterTemplate = templates["page_number_master"];
  const pageNumTemplate = templates["page_number_page"];
  const server = window.location.origin;
  let srcPolyfill = `${server}/api/app-resources/pdf/paged.polyfill.js`;
  // All pages
  let pageNumbersHtmls = [...Array(numPages).keys()].map((pageNum) =>
    pageNumTemplate.replace("%%PAGENUM%%", pageNum + 1),
  );
  const pageNumbersPaths = [];
  // Make PDFs of slices of page numbers
  while (pageNumbersHtmls.length > 0) {
    let html = masterTemplate
      .replace(
        "%%CSS%%",
        await getCssFromLookUp(options.cssLookUp, "page_number_master_styles"),
      )
      .replace("%%CONTENT%%", pageNumbersHtmls.slice(0, 100).join(""))
      .replace("%%POLYFY%%", srcPolyfill);
    let uuid = await toTemp(html);
    const pdfPath = await window.api.generatePdf(uuid);
    pageNumbersPaths.push(pdfPath);
    pageNumbersHtmls = pageNumbersHtmls.slice(100);
  }
  // Assemble slice PDFs
  const res = await fetch(`/api/temp/bytes/${pageNumbersPaths[0]}`);
  const bytes1 = await res.arrayBuffer();
  const pnPdf = await PDFDocument.load(bytes1);
  for (const mergeablePath of pageNumbersPaths.slice(1)) {
    const res2 = await fetch(`/api/temp/bytes/${mergeablePath}`);
    const bytes2 = await res2.arrayBuffer();
    const mergeablePDF = await PDFDocument.load(bytes2);
    const copiedPages = await pnPdf.copyPages(
      mergeablePDF,
      mergeablePDF.getPageIndices(),
    );
    copiedPages.forEach((page) => pnPdf.addPage(page));
  }
  const formData = new FormData();
  const bytes = await pnPdf.save();

  const blob = new Blob([bytes], {
    type: "application/pdf",
  });

  formData.append("file", blob, "document.pdf");

  // Upload PDF to temp endpoint
  const uploadResponse = await fetch(`/api/temp/bytes`, {
    method: "POST",
    body: formData,
  });
  const uploadResult = await uploadResponse.json();
  return uploadResult.uuid;
};

/**
 * Adds page numbers to the given PDF document.
 * @param {Object} params - Parameters for adding page numbers.
 *   - options: Object - Configuration options.
 *   - pdfDoc: PDFDocument - The PDF document to modify.
 *   - showPageNumbersArray: boolean[] - Array indicating which pages to number.
 *   - numPages: number - Total number of pages.
 * @returns {Promise<PDFDocument>} - The modified PDF document with page numbers.
 */
const makePageNumber = async ({
  options,
  pdfDoc,
  showPageNumbersArray,
  numPages,
}) => {
  const pageNumbersPdfPath = await doPageNumber({
    options,
    numPages,
  });
  const res = await fetch(`/api/temp/bytes/${pageNumbersPdfPath}`, {
    method: "GET",
  });

  const arrayBuffer = await res.arrayBuffer();

  const pageNumbersPdf = await PDFDocument.load(arrayBuffer);
  for (let i = 0; i < numPages; i++) {
    if (!showPageNumbersArray[i]) {
      continue;
    }
    const numbersPage = pageNumbersPdf.getPage(i);
    const contentPage = pdfDoc.getPage(i);
    const preamble = await pdfDoc.embedPage(numbersPage);
    contentPage.drawPage(preamble, {
      xScale: 1,
      yScale: 1,
      x: contentPage.getWidth() / 2 - numbersPage.getWidth() / 2,
      y: contentPage.getHeight() / 2 - numbersPage.getHeight() / 2,
    });
  }
  await pdfDoc.save();
  return pdfDoc;
};

/**
 * Creates a PDF from double pages of the source PDF.
 * @param {JSON} manifestStep - Information about the PDF processing step.
 * @param {Array<number>} pageSize - The size of the page to create.
 * @param {Uint8Array} fontBytes - The font data for the PDF.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const makeFromDouble = async function (manifestStep, pageSize) {
  const pdfDoc = await PDFDocument.create();
  //   pdfDoc.registerFontkit(fontKit);
  // await pdfDoc.embedFont(fontBytes);
  for (let i = 0; i < manifestStep.numPages; i++) {
    const pdfPageToCopy = manifestStep.pdf.getPage(i);

    // Embed the second page and clip the preamble
    const preamble = await pdfDoc.embedPage(pdfPageToCopy);
    const page1 = pdfDoc.addPage(pageSize);
    const page2 = pdfDoc.addPage(pageSize);
    page1.drawPage(preamble, {
      xScale: 1,
      yScale: 1,
      x: -(constants.PAGE_SIZES.A3P.pageSize[1] - pageSize[0] * 2) / 2,
      y: page1.getHeight() / 2 - pdfPageToCopy.getHeight() / 2,
    });
    page2.drawPage(preamble, {
      xScale: 1,
      yScale: 1,
      x: -(
        (constants.PAGE_SIZES.A3P.pageSize[1] - pageSize[0] * 2) / 2 +
        pageSize[0]
      ),
      y: page2.getHeight() / 2 - pdfPageToCopy.getHeight() / 2,
    });
  }
  await pdfDoc.save();
  manifestStep.numPages *= 2;
  manifestStep.pdf = pdfDoc;
};

/**
 * Creates a PDF from single pages of the source PDF.
 * @param {Object} manifestStep - Information about the PDF processing step.
 * @param {Array<number>} pageSize - The size of the page to create.
 * @param {Uint8Array} fontBytes - The font data for the PDF.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const makeFromSingle = async function (manifestStep, pageSize) {
  const pdfDoc = await PDFDocument.create();
  //   pdfDoc.registerFontkit(fontKit);
  // await pdfDoc.embedFont(fontBytes);
  for (let i = 0; i < manifestStep.numPages; i++) {
    const pdfPageToCopy = manifestStep.pdf.getPage(i);

    // Embed the page and clip the preamble
    const preamble = await pdfDoc.embedPage(pdfPageToCopy);
    const page = pdfDoc.addPage(pageSize);
    page.drawPage(preamble, {
      xScale: 1,
      yScale: 1,
      x: page.getWidth() / 2 - pdfPageToCopy.getWidth() / 2,
      y: page.getHeight() / 2 - pdfPageToCopy.getHeight() / 2,
    });
  }
  await pdfDoc.save();
  manifestStep.pdf = pdfDoc;
};

/**
 * Superimposes content from one PDF onto another.
 * @param {JSON} manifestStep - Information about the source PDF.
 * @param {PDFDocument} superimposePdf - The PDF document to superimpose.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const makeSuperimposed = async function (manifestStep, superimposePdf) {
  let startOn = manifestStep.startOn;
  for (let i = 1; i < manifestStep.numPages; i++) {
    const currentPage = manifestStep.pdf.getPage(i);
    startOn = startOn === "recto" ? "verso" : "recto";
    const preamble = await manifestStep.pdf.embedPage(
      superimposePdf.getPages()[startOn === "recto" ? 0 : 1],
    );
    currentPage.drawPage(preamble);
  }
  manifestStep.pdf.save();
};

/**
 * Assembles a single PDF from multiple sources based on a manifest file.
 * The final PDF is saved to the specified output location.
 *
 * @param {object} options - Configuration for assembling PDFs.
 *   Includes:
 *   - workingDir: Directory path for temporary files.
 *   - pdfPath: Path where source PDFs are located.
 *   - output: Output file path for the assembled PDF.
 *   - pageFormat: Format specification for pages in the PDF.
 *   - verbose: Boolean to enable verbose logging.
 */
export const assemblePdfs = async function (options, doPdfCallback, manifest) {
  // const fontBytes = fse.readFileSync(path.resolve(path.join(__dirname, '..', 'fonts/GentiumBookPlus-Regular.ttf')));
  const pdfDoc = await PDFDocument.create();
  //   pdfDoc.registerFontkit(fontKit);
  // await pdfDoc.embedFont(fontBytes);
  // const manifest = fse.readJsonSync(path.join(options.workingDir, 'manifest.json'));
  let showPageNumbersArray = [];
  // Store original PDFs in manifest dictionary
  options.verbose && console.log(`      Augment manifest`);
  for (const manifestStep of manifest) {
    // const currentPath = path.join(options.pdfPath, `${manifestStep.id}.pdf`)

    const res = await fetch(`/api/temp/bytes/${manifestStep.id}`);
    const currentPdfBytes = await res.arrayBuffer();
    const currentPdf = await PDFDocument.load(currentPdfBytes);
    manifestStep.pdf = currentPdf;
    manifestStep.numPages = currentPdf.getPageCount();
  }

  let numPages = 0;
  options.verbose && console.log(`      Manifest steps`);
  for (const [n, manifestStep] of manifest.entries()) {
    doPdfCallback &&
      doPdfCallback({
        type: "manifest",
        level: 1,
        msg: `Assembling PDF ${n + 1} of ${manifest.length}`,
        args: [n, manifest.length, manifestStep.id],
      });
    // Loop over non-superimpose steps
    if (manifestStep.type === "superimpose") {
      continue;
    }
    options.verbose &&
      console.log(
        `         ${manifestStep.id} - ${manifestStep.makeFromDouble ? manifestStep.numPages * 2 : manifestStep.numPages} originated page(s)`,
      );

    // if we need to superimposes
    const superimposeStep = manifest.filter(
      (s) => s.for === manifestStep.id,
    )[0];
    if (superimposeStep) {
      options.verbose && console.log(`            Superimpose`);
      await makeSuperimposed(manifestStep, superimposeStep.pdf);
    }

    // Chop up single or double pages
    if (manifestStep.makeFromDouble) {
      options.verbose && console.log(`            Double Pages`);
      await makeFromDouble(manifestStep, options.pageFormat.pageSize);
    } else {
      options.verbose && console.log(`            Single Pages`);
      await makeFromSingle(manifestStep, options.pageFormat.pageSize);
    }

    // Add blank pages to the documents to respect start side
    const nextPageSide = numPages % 2 === 0 ? "recto" : "verso";
    if (
      manifestStep.startOn !== "either" &&
      nextPageSide !== manifestStep.startOn
    ) {
      options.verbose &&
        console.log(`            Add blank page to start on ${nextPageSide}`);
      pdfDoc.addPage(options.pageFormat.pageSize);
      numPages += 1;
      showPageNumbersArray.push(false);
    }

    for (let i = 0; i < manifestStep.numPages; i++) {
      const pdfPageToCopy = manifestStep.pdf.getPage(i);

      // Embed the content and clip the preamble
      const preamble = await pdfDoc.embedPage(pdfPageToCopy);
      const page = pdfDoc.addPage(options.pageFormat.pageSize);
      page.drawPage(preamble);
      numPages += 1;
      showPageNumbersArray.push(manifestStep.showPageNumber);
    }
  }

  // Generate page numbers PDF and merge with content PDF
  options.verbose && console.log(`   Add page numbers`);
  doPdfCallback &&
    doPdfCallback({
      type: "pageNumbers",
      level: 1,
      msg: `Generate Page Numbers As Needed`,
      args: [],
    });
  const pdfDocWithPageNum = await makePageNumber({
    options,
    pdfDoc,
    showPageNumbersArray,
    numPages,
  });

  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBuffer = await pdfDocWithPageNum.save();

  let pdfUuid = await pdfToTemp(pdfBuffer);
  await window.api.generatePdfToFile(pdfUuid);

  options.verbose &&
    console.log(
      `   Assembled PDF (with ${pdfDocWithPageNum.getPageCount()} pages, ${Math.floor(pdfBuffer.length / (1024 * 1024))} Mb) written to ${options.output}`,
    );
  doPdfCallback &&
    doPdfCallback({
      type: "writeOutput",
      level: 0,
      msg: `Writing out assembled PDF to ${options.output} (${pdfDocWithPageNum.getPageCount()}) page(s)`,
      args: [options.output, pdfDocWithPageNum.getPageCount()],
    });
  // Cleanup
};
