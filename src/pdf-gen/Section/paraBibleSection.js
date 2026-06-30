import { unpackCellRange, pkWithDocs, getBookName, bcvNotes } from "../helpers";
import { SofriaRenderFromProskomma, render } from "proskomma-json-tools";
import { getCssFromLookUp, toTemp } from "../helpers/PankosmiaUtils";
import { Section } from "./section";

export class paraBibleSection extends Section {
  requiresWrapper() {
    return ["bcv"];
  }

  signature() {
    return {
      sectionType: "paraBible",
      requiresWrapper: this.requiresWrapper(),
      fields: [
        {
          id: "startOn",
          label: {
            en: "Start Page Side",
            fr: "Côté pour première page",
          },
          nValues: [1, 1],
          suggestedDefault: "recto",
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
        },
        {
          id: "showPageNumber",
          label: {
            en: "Show Page Number",
            fr: "Afficher numéro de page",
          },
          typeName: "boolean",
          nValues: [1, 1],
          suggestedDefault: true,
        },
        {
          id: "scriptureSrc",
          label: {
            en: "Scripture Text Source",
            fr: "Source pour texte biblique",
          },
          typeName: "translationText",
          nValues: [1, 1],
        },
        {
          id: "scriptureType",
          label: {
            en: "Scripture Text Type",
            fr: "Type de texte biblique",
          },
          typeEnum: [
            {
              id: "greek",
              label: {
                en: "Greek",
                fr: "Grec",
              },
            },
            {
              id: "hebrew",
              label: {
                en: "Hebrew",
                fr: "Hébreu",
              },
            },
            {
              id: "translation",
              label: {
                en: "Translation",
                fr: "Traduction",
              },
            },
          ],
          nValues: [1, 1],
          suggestedDefault: "translation",
        },
        {
          id: "nColumns",
          typeName: "number",
          label: {
            en: "Number of columns",
            fr: "Nombre de colonnes",
          },
          nValues: [1, 1],
          minValue: 1,
          maxValue: 3,
          suggestedDefault: 1,
        },
        {
          id: "showWordAtts",
          typeLiteral: false,
          label: {
            en: "Show Word Atts",
            fr: "Afficher attributs des mots",
          },
          nValues: [1, 1],
          suggestedDefault: false,
        },
        {
          id: "showTitles",
          typeName: "boolean",
          label: {
            en: "Show Titles",
            fr: "Afficher titres de livre",
          },
          nValues: [1, 1],
          suggestedDefault: true,
        },
        {
          id: "showHeadings",
          typeName: "boolean",
          label: {
            en: "Show Headings",
            fr: "Afficher titres de section",
          },
          nValues: [1, 1],
          suggestedDefault: true,
        },
        {
          id: "showIntroductions",
          typeName: "boolean",
          label: {
            en: "Show Introductions",
            fr: "Afficher introductions",
          },
          nValues: [1, 1],
          suggestedDefault: true,
        },
        {
          id: "showFootnotes",
          typeName: "boolean",
          label: {
            en: "Show Footnotes",
            fr: "Afficher notes de bas de page",
          },
          nValues: [1, 1],
          suggestedDefault: true,
        },
        {
          id: "showXrefs",
          typeName: "boolean",
          label: {
            en: "Show Cross-references",
            fr: "Afficher références croisées",
          },
          nValues: [1, 1],
          suggestedDefault: true,
        },
        {
          id: "showXrefs",
          typeName: "boolean",
          label: {
            en: "Show Cross-references",
            fr: "Afficher références croisées",
          },
          nValues: [1, 1],
          suggestedDefault: true,
        },
        {
          id: "showParaStyles",
          typeName: "boolean",
          label: {
            en: "Show Paragraph Styles",
            fr: "Afficher styles de paragraphes",
          },
          nValues: [1, 1],
          suggestedDefault: true,
        },
        {
          id: "showCharacterMarkup",
          typeName: "boolean",
          label: {
            en: "Show Character Markup",
            fr: "Afficher styles de caractère",
          },
          nValues: [1, 1],
          suggestedDefault: true,
        },
        {
          id: "showChapterLabels",
          typeName: "boolean",
          label: {
            en: "Show Chapter Numbers",
            fr: "Afficher numéros de chapitre",
          },
          nValues: [1, 1],
          suggestedDefault: true,
        },
        {
          id: "showVersesLabels",
          typeName: "boolean",
          label: {
            en: "Show Verse Numbers",
            fr: "Afficher numéros de versets",
          },
          nValues: [1, 1],
          suggestedDefault: true,
        },
        {
          id: "showFirstVerseLabel",
          typeName: "boolean",
          label: {
            en: "Show Verse Number for v1",
            fr: "Afficher numéro de verset pour v1",
          },
          nValues: [1, 1],
          suggestedDefault: false,
        },
        {
          id: "showGlossaryStar",
          typeName: "boolean",
          label: {
            en: "Show asterisk after words in glossary",
            fr: "Afficher une étoile après des mot dans le glossaire",
          },
          nValues: [1, 1],
          suggestedDefault: false,
        },
        {
          id: "notes",
          typeName: "tNotes",
          label: {
            en: "External notes",
            fr: "Notes externes à la traduction",
          },
          nValues: [0, 1],
        },
      ],
    };
  }

  async doSection({ section, templates, manifest, options }) {
    if (!section.bcvRange) {
      throw new Error(`No bcvRange found for section ${section.id}`);
    }
    const sectionConfig = {
      showWordAtts: section.content.showWordAtts,
      showTitles: section.content.showTitles,
      showHeadings: section.content.showHeadings,
      showIntroductions: section.content.showIntroductions,
      showFootnotes: section.content.showFootnotes,
      showXrefs: section.content.showXrefs,
      showParaStyles: section.content.showParaStyles,
      showCharacterMarkup: section.content.showCharacterMarkup,
      showChapterLabels: section.content.showChapterLabels,
      showVersesLabels: section.content.showVersesLabels,
      showFirstVerseLabel: section.content.showFirstVerseLabel,
      nColumns: section.content.nColumns,
      showGlossaryStar: section.content.showGlossaryStar,
    };
    const pk = await pkWithDocs(
      section.bcvRange,
      [{ id: "xxx_yyy", path: section.content.scriptureSrc }],
      options.verbose,
    );
    const bookName = getBookName(pk, "xxx_yyy", section.bcvRange);
    const notes = section.content.notes
      ? bcvNotes(section.content.notes, section.bcvRange)
      : {};
    const docId = pk.gqlQuerySync("{documents { id } }").data.documents[0].id;
    const actions = render.sofria2web.renderActions.sofria2WebActions;
    const renderers = render.sofria2web.sofria2html.renderers;
    const cl = new SofriaRenderFromProskomma({
      proskomma: pk,
      actions,
      debugLevel: 0,
    });
    const output = {};
    sectionConfig.selectedBcvNotes = ["foo"];
    sectionConfig.renderers = renderers;
    sectionConfig.renderers.verses_label = (vn, bcv, _, currentIndex) => {
      let ret = [];
      const cv = `${bcv[1]}${options.referencePunctuation.chapterVerse}${bcv[2]}`;
      const cvNotes = unpackCellRange(cv).map((cv) => notes[cv] || []);
      const verseNotes =
        cvNotes.length > 0
          ? cvNotes
              .reduce((a, b) => [...a, ...b])
              .map((n) =>
                n
                  .replace(/ \?/g, "&nbsp;?")
                  .replace(/\*\*([^*]+)\*\*/g, "<i>$1</i>"),
              )
          : "";
      if (verseNotes.length > 0) {
        ret.push(
          `<span class="bcv_note"><b>${cv}</b>: ${verseNotes.join(" ")}</span>`,
        );
      }
      ret.push(`<span class="marks_verses_label">${vn}</span>`);
      return ret.join("\n");
    };
    const server = window.location.origin;
    let srcPolyfill = `${server}/api/app-resources/pdf/paged.polyfill.js`;
    const fontLinks = options.fontFamily
      .map((e) => {
        const ebis = e.replace("Pankosmia", "pankosmia").replaceAll(" ", "_");

        return `<link rel="stylesheet" href="/api/webfonts/${ebis}.css">`;
      })
      .join("\n");

    const qualified_id = `${section.id}_${section.bcvRange}`;
    cl.renderDocument({ docId, config: sectionConfig, output });

    let html = templates["para_bible_page"]
      .replace("%%TITLE%%", `${qualified_id} - ${section.type}`)
      .replace("%%BODY%%", output.paras)
      .replace("%%BOOKNAME%%", bookName)
      .replace("%%POLYFY%%", srcPolyfill)
      .replace(
        "%%CSS%%",
        await getCssFromLookUp(options.cssLookUp, "para_bible_page_styles"),
      )
      .replace("%%FONTLINKS%%", fontLinks);
    let htmlUuid = await toTemp(html);
    let pdfUuid = await window.api.generatePdf(htmlUuid);
    manifest.push({
      id: `${pdfUuid}`,
      type: section.type,
      startOn: section.content.startOn,
      showPageNumber: section.content.showPageNumber,
      makeFromDouble: false,
    });
  }
}
