import { getText } from "pithekos-lib";
import {
  unpackCellRange,
  pkWithDocs,
  getBookName,
  getCVTexts,
  cleanNoteLine,
  bcvNotes,
  setupOneCSS,
  checkCssSubstitution,
  toTemp,
} from "../helpers";
import { getCssFromLookUp } from "../helpers/PankosmiaUtils";

import { Section } from "./section";

export class bcvBibleSection extends Section {
  requiresWrapper() {
    return ["bcv"];
  }

  signature() {
    return {
      sectionType: "bcvBible",
      requiresWrapper: this.requiresWrapper(),
      fields: [
        {
          id: "startOn",
          label: {
            en: "Start Page Side",
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
            en: "Show Page Number",
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
      ],
    };
  }

  async doSection({ section, templates, manifest, options }) {
    if (!section.bcvRange) {
      throw new Error(`No bcvRange found for section ${section.id}`);
    }
    const pk = await pkWithDocs(
      section.bcvRange,
      [
        {
          id: "xxx_yyy",
          path: section.content.scriptureSrc,
        },
      ],
      options.verbose,
    );
    const bookName = getBookName(pk, "xxx_yyy", section.bcvRange);
    const cvTexts = getCVTexts(section.bcvRange, pk);
    let notes = section.content.notes
      ? bcvNotes(section.content.notes, section.bcvRange)
      : {};
    for (const [cv, noteArray] of Object.entries(notes)) {
      notes[cv] = [
        `<span class="cv">${cv}</span> ${noteArray[0]}`,
        ...noteArray
          .slice(1)
          .map((nt) => `<span class="not_first_note">${nt}</span>`),
      ];
    }
    const verses = [`<h1>${bookName}</h1>`];
    const seenCvs = new Set([]);
    for (const cvRecord of cvTexts) {
      if (seenCvs.has(cvRecord.cv)) {
        continue;
      } else {
        seenCvs.add(cvRecord.cv);
      }
      const cvNotes = unpackCellRange(cvRecord.cv).map((cv) => notes[cv] || []);
      const chapterVerseSeparator = options.referencePunctuation
        ? options.referencePunctuation.chapterVerse || ":"
        : ":";
      const verseRangeSeparator = options.referencePunctuation
        ? options.referencePunctuation.verseRange || "-"
        : "-";

      const verseHtml = templates["bcv_bible_verse"]
        .replace(
          "%%CV%%",
          cvRecord.cv
            .replace(/(\d):/, (match, p1) => `${p1}${chapterVerseSeparator}`)
            .replace(/(\d)-/, (match, p1) => `${p1}${verseRangeSeparator}`),
        )
        .replace(
          "%%VERSECONTENT%%",
          cvNotes.length > 0
            ? `${cvRecord.texts["xxx_yyy"] || "-"}<p class="note">${cvNotes
                .reduce((a, b) => [...a, ...b])
                .map((nr) => cleanNoteLine(nr))
                .map(
                  (note) =>
                    `<span>${note
                      .replace(
                        /(\d):/,
                        (match, p1) => `${p1}${chapterVerseSeparator}`,
                      )
                      .replace(
                        /(\d)-/,
                        (match, p1) => `${p1}${verseRangeSeparator}`,
                      )}</span>`,
                )
                .join(" • ")}</p>` // space before, no break space after
            : "",
        );
      verses.push(verseHtml);
    }

    const qualified_id = `${section.id}_${section.bcvRange}`;
    const server = window.location.origin;

    let srcPolyfill = `${server}/api/app-resources/pdf/paged.polyfill.js`;
    const fontLinks = options.fontFamily
      .map((e) => {
        const ebis = e.replace("Pankosmia", "pankosmia").replaceAll(" ", "_");

        return `<link rel="stylesheet" href="/api/webfonts/${ebis}.css">`;
      })
      .join("\n");

    let html = templates["bcv_bible_page"]
      .replace("%%POLYFY%%", srcPolyfill)
      .replace("%%TITLE%%", `${qualified_id} - ${section.type}`)
      .replace("%%BODY%%", verses.join("\n"))
      .replace("%%BOOKNAME%%", bookName)
      .replace("%%FONTLINKS%%", fontLinks);

    let css = await getCssFromLookUp(
      options.cssLookUp,
      "bcv_bible_page_styles",
    );
    const spaceOption = 0; // MAKE THIS CONFIGURABLE
    for (const [placeholder, values] of options.pageFormat.sections.bcvBible
      .cssValues) {
      css = setupOneCSS(css, placeholder, "%", values[0]);
    }
    checkCssSubstitution("bcv_bible_page_styles.css", css, "%");
    html = html.replace("%%CSS%%", css);

    let htmlUuid = await toTemp(html);
    let pdfUuid = await window.api.generatePdf(htmlUuid);

    manifest.push({
      id: pdfUuid,
      type: section.type,
      startOn: section.content.startOn,
      showPageNumber: section.content.showPageNumber,
      makeFromDouble: false,
    });
  }
}
