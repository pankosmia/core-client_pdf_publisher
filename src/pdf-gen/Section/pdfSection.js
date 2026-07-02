import { pdfToTemp } from "../helpers/PankosmiaUtils";
import { Section } from "./section";

export class pdfSection extends Section {
  requiresWrapper() {
    return [];
  }

  signature() {
    return {
      sectionType: "pdf",
      requiresWrapper: this.requiresWrapper(),
      fields: [
        {
          id: "startOn",
          label: {
            en: "First page on",
            fr: "Côté pour première page",
          },
          typeEnum: [
            {
              id: "recto",
              label: {
                en: "Recto",
                fr: "Recto",
              },
            },
            {
              id: "verso",
              label: {
                en: "Verso",
                fr: "Verso",
              },
            },
            {
              id: "either",
              label: {
                en: "Next Page",
                fr: "Page suivante",
              },
            },
          ],
          nValues: [1, 1],
          suggestedDefault: "recto",
        },
        {
          id: "showPageNumber",
          label: {
            en: "Show page numbers",
            fr: "Afficher numéro de page",
          },
          typeName: "boolean",
          nValues: [1, 1],
          suggestedDefault: true,
        },
        {
          id: "pdf",
          label: {
            en: "External PDF source",
            fr: "Source pour PDF externe",
          },
          typeName: "pdf",
          nValues: [1, 1],
        },
      ],
    };
  }

  async doSection({ section, templates, manifest, options }) {
    let response = await fetch(
      `/api/burrito/ingredient/bytes${section.content.pdf.src}?ipath=${section.content.pdf.name}`,
      {
        method: "GET",
      },
    );
    const pdfBlob = await response.blob();

    const uuidPdf = await pdfToTemp(pdfBlob);

    // section.doPdfCallback && section.doPdfCallback({
    //     type: "pdfImport",
    //     level: 3,
    //     msg: `Importing PDF ${path.join(options.pdfPath, `${section.id}.pdf}`)}'`,
    //     args: [`${path.join(options.pdfPath, `${section.id}.pdf`)}`]
    // });
    manifest.push({
      id: uuidPdf,
      type: section.type,
      startOn: section.content.startOn,
      showPageNumber: section.content.showPageNumber,
      makeFromDouble: false,
    });
  }
}
