import { Section } from "./section";
import { formatNote, bcvNotes, toTemp } from "../helpers";

export class bookNoteSection extends Section {
  requiresWrapper() {
    return ["bcv"];
  }

  signature() {
    return {
      sectionType: "bookNote",
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
          id: "notes",
          label: {
            en: "Notes Source",
            fr: "Source pour notes",
          },
          typeName: "tNotes",
          nValues: [0, 1],
        },
      ],
    };
  }

  async doSection({ section, templates, manifest, options }) {
    const notes = section.content.notes
      ? bcvNotes(section.content.notes, section.bcvRange)
      : {};
    const introNotes = notes["front:intro"]
      ? notes["front:intro"].join("\n\n")
      : "";
    const [title, body] = formatNote(introNotes, templates);
    const qualified_id = `${section.id}_${section.bcvRange}`;
    const server = window.location.origin;
    let srcPolyfill = `${server}/api/app-resources/pdf/paged.polyfill.js`;
    const fontLinks = options.fontFamily
      .map((e) => {
        const ebis = e.replace("Pankosmia", "pankosmia").replaceAll(" ", "_");

        return `<link rel="stylesheet" href="/api/webfonts/${ebis}.css">`;
      })
      .join("\n");
    let html = templates["non_juxta_page"]
      .replace("%%POLYFY%%", srcPolyfill)
      .replace("%%TITLE%%", title)
      .replace("%%BODY%%", `<h1>${title}</h1>\n\n${body}`)
      .replace("%%FONTLINKS%%", fontLinks);
    let htmlUuid = await toTemp(html);
    let pdfUuid = await window.api.generatePdf(htmlUuid);

    // await doPuppet({
    //     browser: options.browser,
    //     verbose: options.verbose,
    //     htmlPath: path.join(options.htmlPath, `${qualified_id}.html`),
    //     pdfPath: path.join(options.pdfPath, `${qualified_id}.pdf`)
    // });
    manifest.push({
      id: pdfUuid,
      type: section.type,
      startOn: section.content.startOn,
      showPageNumber: section.content.showPageNumber,
      makeFromDouble: false,
    });
  }
}
