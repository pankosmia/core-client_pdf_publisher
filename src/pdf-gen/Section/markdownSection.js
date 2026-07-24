import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";
import { Section } from "./section";
import { getCssFromLookUp, toTemp } from "../helpers/PankosmiaUtils";
import { getText } from "pankosmia-lib/http";
import { enqueueSnackbar } from "notistack";
import { doI18n } from "pankosmia-lib/i18n";
export class markdownSection extends Section {
  requiresWrapper() {
    return [];
  }

  signature() {
    return {
      sectionType: "markdown",
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
                en: "Next page",
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
          id: "forceMono",
          label: {
            en: "Use monospace font",
            fr: "Utiliser police monospace",
          },
          typeName: "boolean",
          nValues: [0, 1],
          suggestedDefault: false,
        },
        {
          id: "md",
          label: {
            en: "Markdown Source",
            fr: "Source pour markdown",
          },
          typeName: "md",
          nValues: [1, 1],
        },
      ],
    };
  }

  async doSection({
    section,
    templates,
    bookCode,
    manifest,
    options,
    i18nRef,
  }) {
    let pdfPath;
    let mkrText = await getText(
      `/api/burrito/ingredient/bytes/${section.content.md.src}?ipath=${section.content.md.name}`,
    );
    if (mkrText.ok) {
      const server = window.location.origin;
      let srcPolyfill = `${server}/api/app-resources/pdf/paged.polyfill.js`;
      const fontLinks = options.fontFamily
        .map((e) => {
          const ebis = e.replace("Pankosmia", "pankosmia").replaceAll(" ", "_");

          return `<link rel="stylesheet" href="/api/webfonts/${ebis}.css">`;
        })
        .join("\n");
      let htmlContent = templates[
        section.content.forceMono ? "markdown_mono_page" : "markdown_page"
      ]
        .replace(
          "%%TITLE%%",
          `${section.id.replace("%%bookCode%%", bookCode)} - ${section.type}`,
        )
        .replace(
          "%%BODY%%",
          DOMPurify.sanitize(await marked.parse(mkrText.text)),
        )
        .replace(
          "%%CSS%%",
          await getCssFromLookUp(
            options.cssLookUp,
            section.content.forceMono
              ? "markdown_mono_page_styles"
              : "markdown_page_styles",
          ),
        )
        .replace("%%POLYFY%%", srcPolyfill)
        .replace("%%FONTLINKS%%", fontLinks);

      let uuid = await toTemp(htmlContent);
      pdfPath = await window.api.generatePdf(uuid);
      manifest.push({
        id: pdfPath,
        type: section.type,
        startOn: section.content.startOn,
        showPageNumber: section.content.showPageNumber,
        makeFromDouble: false,
      });
    } else {
      enqueueSnackbar(
        doI18n(`pages:core-client_pdf_publisher:errorGet`, i18nRef.current) +
          `/api/burrito/ingredient/bytes/${section.content.md.src}?ipath=${section.content.md.name}` +
          `${mkrText.status}): ${mkrText.error}`,
        { variant: "error" },
      );
    }
  }
}
