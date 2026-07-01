import {
  unpackCellRange,
  pkWithDocs,
  getBookName,
  getCVTexts,
  cleanNoteLine,
  bcvNotes,
  checkCssSubstitution,
  toTemp,
} from "../helpers";
import { getCssFromLookUp } from "../helpers/PankosmiaUtils";

import { Section } from "./section";

export class biblePlusNotesSection extends Section {
  requiresWrapper() {
    return ["bcv"];
  }

  signature() {
    return {
      sectionType: "biblePlusNotes",
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
            en: "Notes source",
            fr: "Source pour notes",
          },
          typeName: "tNotes",
          nValues: [1, 1],
        },
        {
          id: "notesUnit",
          label: {
            en: "Notes grouped by",
            fr: "Notes regroupées par",
          },
          typeEnum: [
            {
              id: "verse",
              label: {
                en: "verse",
                fr: "verset",
              },
            },
            {
              id: "sentence",
              label: {
                en: "sentence",
                fr: "phrase",
              },
            },
          ],
          nValues: [0, 1],
          suggestedDefault: "verse",
        },
        {
          id: "notesPosition",
          label: {
            en: "Notes position",
            fr: "Position des notes",
          },
          typeEnum: [
            {
              id: "columns",
              label: {
                en: "column",
                fr: "colonne",
              },
            },
            {
              id: "rows",
              label: {
                en: "row",
                fr: "rangé",
              },
            },
          ],
          nValues: [0, 1],
          suggestedDefault: "rows",
        },
        {
          id: "notesWidth",
          label: {
            en: "% width of notes",
            fr: "% largeur des notes",
          },
          typeName: "number",
          maxValue: 80,
          minValue: 20,
          nValues: [0, 1],
          suggestedDefault: 50,
        },
        {
          id: "scriptureSrc",
          label: {
            en: "Scripture text Source",
            fr: "Source pour texte biblique",
          },
          typeName: "translationText",
          nValues: [1, 1],
        },
        {
          id: "scriptureType",
          label: {
            en: "Scripture text Type",
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
    const cvBySentence = (cvTexts, endSentenceRegex) => {
      const emptyRecord = () => ({
        textBits: [],
        text: "",
        cvBits: [],
        cv: "",
      });

      const completedRecord = (rec) => {
        const printCv = `${rec.cvBits[0]}${rec.cvBits.length > 1 ? `-${rec.cvBits[rec.cvBits.length - 1].split(":")[1]}` : ""}`;
        rec.cv = printCv;
        rec.text = rec.textBits.join(" ");
        delete rec.textBits;
        return rec;
      };

      const ret = [];
      let retRecord = emptyRecord();
      for (const verseOb of cvTexts) {
        retRecord.textBits.push(verseOb.texts.xxx_yyy);
        for (const cvBit of unpackCellRange(verseOb.cv)) {
          retRecord.cvBits.push(cvBit);
        }
        const isEnd = endSentenceRegex.test(verseOb.texts.xxx_yyy);
        if (isEnd) {
          ret.push(completedRecord(retRecord));
          retRecord = emptyRecord();
        }
      }
      if (retRecord.textBits.length > 0) {
        ret.push(completedRecord(retRecord));
      }
      return ret;
    };
    section.content.notesUnit = section.content.notesUnit || "verse";
    section.content.notesPosition = section.content.notesPosition || "columns";
    section.content.notesWidth = section.content.notesWidth || 70;
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
    const notes = await bcvNotes(section.content.notes, section.bcvRange, []);
    const cvTexts = getCVTexts(section.bcvRange, pk);
    const verses = [`<h1>${bookName}</h1>`];
    const qualified_id = `${section.id}_${section.bcvRange}`;
    const seenCvs = new Set([]);
    let styleNotes =
      section.content.notesPosition === "columns" ? "columns" : "rows";

    const chapterVerseSeparator = options.referencePunctuation
      ? options.referencePunctuation.chapterVerse || ":"
      : ":";
    const verseRangeSeparator = options.referencePunctuation
      ? options.referencePunctuation.verseRange || "-"
      : "-";
    if (section.content.notesUnit === "verse") {
      for (const cvRecord of cvTexts) {
        if (seenCvs.has(cvRecord.cv)) {
          continue;
        } else {
          seenCvs.add(cvRecord.cv);
        }
        const cvNotes = unpackCellRange(cvRecord.cv).map(
          (cv) => notes[cv] || [],
        );
        const verseHtml = templates[`bible_plus_notes_${styleNotes}`]
          .replace(
            "%%CSS%%",
            await getCssFromLookUp(
              options.cssLookUp,
              `bible_plus_notes_in_${styleNotes}_page_styles`,
            ),
          )
          .replace("%%TRANS1TITLE%%", section.content.scriptureText)
          .replace("%%TRANS2TITLE%%", section.content.scriptureText)
          .replace("%%SCRIPTUREWIDTH%%", 100 - section.content.notesWidth)
          .replace("%%NOTEWIDTH%%", section.content.notesWidth)
          .replace(
            "%%LEFTCOLUMN%%",
            `<div class="col1"><span class="cv">${cvRecord.cv
              .replace(/(\d):/, (match, p1) => `${p1}${chapterVerseSeparator}`)
              .replace(
                /(\d)-/,
                (match, p1) => `${p1}${verseRangeSeparator}`,
              )}</span> ${cvRecord.texts["xxx_yyy"] || "-"}</div>`,
          )
          .replace(
            "%%RIGHTCOLUMN%%",
            cvNotes.length > 0
              ? `<div class="col2">${cvNotes
                  .reduce((a, b) => [...a, ...b])
                  .map((nr) => cleanNoteLine(nr))
                  .map((note) => `<p class="note">${note}</p>`)
                  .join("\n")}</div>`
              : "",
          );
        verses.push(verseHtml);
      }
    } else {
      const sentenceTexts = cvBySentence(
        cvTexts,
        RegExp(/[.?!]\s*(['"”’»)]\s*)*$/),
      );
      for (const sentenceRecord of sentenceTexts) {
        if (seenCvs.has(sentenceRecord.cv)) {
          continue;
        } else {
          seenCvs.add(sentenceRecord.cv);
        }
        const verseHtml = templates[
          `bible_plus_notes_${section.content.notesPosition}`
        ]
          .replace(
            "%%CSS%%",
            await getCssFromLookUp(
              options.cssLookUp,
              `bible_plus_notes_in_${section.content.notesPosition}_page_styles`,
            ),
          )
          .replace("%%TRANS1TITLE%%", section.content.scriptureText)
          .replace("%%TRANS2TITLE%%", section.content.scriptureText)
          .replace("%%SCRIPTUREWIDTH%%", 100 - section.content.notesWidth)
          .replace("%%NOTEWIDTH%%", section.content.notesWidth)
          .replace(
            "%%LEFTCOLUMN%%",
            `<div class="col1"><span class="cv">${sentenceRecord.cv
              .replace(/(\d):/, (match, p1) => `${p1}${chapterVerseSeparator}`)
              .replace(
                /(\d)-/,
                (match, p1) => `${p1}${verseRangeSeparator}`,
              )}</span> ${sentenceRecord.text || "-"}</div>`,
          )
          .replace(
            "%%RIGHTCOLUMN%%",
            `<div class="col2">${sentenceRecord.cvBits
              .map((cv) => notes[cv] || [])
              .reduce((a, b) => [...a, ...b])
              .map((nr) => cleanNoteLine(nr))
              .map((note) => `<p class="note">${note}</p>`)
              .join("\n")}</div>`,
          );
        verses.push(verseHtml);
      }
    }
    const server = window.location.origin;
    const fontLinks = options.fontFamily
      .map((e) => {
        const ebis = e.replace("Pankosmia", "pankosmia").replaceAll(" ", "_");

        return `<link rel="stylesheet" href="/api/webfonts/${ebis}.css">`;
      })
      .join("\n");

    let srcPolyfill = `${server}/api/app-resources/pdf/paged.polyfill.js`;
    let html =
      section?.content?.notesPosition === "columns"
        ? templates["bible_plus_notes_in_columns_page"]
        : templates["bible_plus_notes_in_rows_page"];
    html = html
      .replace("%%POLYFY%%", srcPolyfill)
      .replace("%%TITLE%%", `${qualified_id} - ${section.type}`)
      .replace("%%BODY%%", verses.join("\n"))
      .replace("%%BOOKNAME%%", bookName)
      .replace("%%FONTLINKS%%", fontLinks);
    let css = await getCssFromLookUp(
      options.cssLookUp,
      section.content.notesPosition === "columns"
        ? "bible_plus_notes_in_columns_page_styles"
        : "bible_plus_notes_in_rows_page_styles",
    );
    // const spaceOption = 0; // MAKE THIS CONFIGURABLE
    // checkCssSubstitution(
    //   "bible_plus_notes_in_columns_page_styles.css",
    //   css,
    //   "%",
    // );
    html = html.replace("%%CSS%%", css);

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
