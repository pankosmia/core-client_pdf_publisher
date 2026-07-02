import {
  pkWithDocs,
  getBookName,
  cvForSentence,
  quoteForCv,
  tidyLhsText,
  cleanNoteLine,
  bcvNotes,
  unpackCellRange,
  toTemp,
} from "../helpers";
import books from "../Css/Ressources/books.json";
import { Section } from "./section";
import { getJson, getText } from "pankosmia-lib/http";
import { getCssFromLookUp } from "../helpers/PankosmiaUtils";

export class jxlSpreadSection extends Section {
  requiresWrapper() {
    return ["bcv"];
  }

  signature() {
    return {
      sectionType: "jxlSpread",
      requiresWrapper: this.requiresWrapper(),
      fields: [
        {
          id: "startOn",
          label: {
            en: "Start Page Side",
            fr: "Côté pour première page",
          },
          typeLiteral: "verso",
          nValues: [1, 1],
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
          id: "jxl",
          label: {
            en: "Juxta Source",
            fr: "Source pour Juxta",
          },
          typeName: "juxta",
          nValues: [1, 1],
        },
        {
          id: "bcvNotes",
          label: {
            en: "Notes by verse",
            fr: "Notes par verset",
          },
          typeName: "tNotes",
          nValues: [0, 1],
        },
        // {
        //   id: "glossNotes",
        //   label: {
        //     en: "Gloss notes (advanced)",
        //     fr: "Notes pour gloss (avancé)",
        //   },
        //   nValues: [0, 1],
        //   typeSpec: [
        //     {
        //       id: "notes",
        //       label: {
        //         en: "Notes",
        //         fr: "Notes",
        //       },
        //       typeName: "tNotes",
        //       nValues: [1, 1],
        //     },
        //     {
        //       id: "pivot",
        //       label: {
        //         en: "Pivot table",
        //         fr: "Tableau croisé",
        //       },
        //       typeName: "tNotes",
        //       nValues: [1, 1],
        //     },
        //   ],
        // },
        {
          id: "firstSentence",
          label: {
            en: "First Sentence Number",
            fr: "N° de première phrase",
          },
          typeName: "number",
          nValues: [0, 1],
        },
        {
          id: "lastSentence",
          label: {
            en: "Last Sentence Number",
            fr: "N° de dernière phrase",
          },
          typeName: "number",
          nValues: [0, 1],
        },

        {
          id: "lhs",
          label: {
            en: "Scripture Texts",
            fr: "Textes bibliques",
          },
          nValues: [1, 5],
          typeSpec: [
            {
              id: "text",
              label: {
                en: "Scripture # Text Label",
                fr: "Etiquette pour texte biblique #",
              },
              typeName: "string",
              nValues: [1, 1],
            },
            {
              id: "src",
              label: {
                en: "Source # Text Source",
                fr: "Source pour texte biblique #",
              },
              typeName: "translationText",
              nValues: [1, 1],
            },
            {
              id: "type",
              label: {
                en: "Scripture # Text Type",
                fr: "Type de texte biblique #",
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
        },
      ],
    };
  }

  async doSection({ section, templates, manifest, options }) {
    const jsonFile = (
      await getJson(
        `/api/burrito/ingredient/raw/${section.content.jxl}?ipath=${section.bcvRange}.json`,
      )
    ).json;
    const mergeCvs = (cvs, canonical = false) => {
      const chapter = cvs[0].split(":")[0];
      const firstCvFirstV = cvs[0].split(":")[1].split("-")[0];
      const lastCvLastV = [...cvs]
        .reverse()[0]
        .split(":")[1]
        .split("-")
        .reverse()[0];
      const chapterVerseSeparator =
        !canonical && options.referencePunctuation
          ? options.referencePunctuation.chapterVerse || ":"
          : ":";
      const verseRangeSeparator =
        !canonical && options.referencePunctuation
          ? options.referencePunctuation.verseRange || "-"
          : "-";
      return `${chapter}${chapterVerseSeparator}${firstCvFirstV}${firstCvFirstV === lastCvLastV ? "" : `${verseRangeSeparator}${lastCvLastV}`}`;
    };
    const jxlJson = jsonFile.bookCode ? jsonFile.sentences : jsonFile;
    const sentenceMerges = []; // True means "merge with next sentence"
    let sentenceN = 0;
    for (const sentence of jxlJson) {
      const cv4Sentence = cvForSentence(sentence);
      let sentenceLastV = cv4Sentence.split(":")[1].split("-").reverse()[0];
      let nextSentenceFirstV =
        sentenceN + 1 === jxlJson.length
          ? 999
          : cvForSentence(jxlJson[sentenceN + 1])
              .split(":")[1]
              .split("-")[0];
      sentenceMerges.push(sentenceLastV === nextSentenceFirstV);
      sentenceN++;
    }
    let vNotes = section.content.bcvNotes
      ? await bcvNotes(section.content.bcvNotes, section.bcvRange)
      : {};
    for (const [cv, noteArray] of Object.entries(vNotes)) {
      vNotes[cv] = [
        `<b>${cv}</b> ${noteArray[0]}`,
        ...noteArray
          .slice(1)
          .map((nt) => `<span class="not_first_note">${nt}</span>`),
      ];
    }
    let pivotIds = new Set([]);
    const glossNotes = {};
    const glossNotePivot = {};
    if (section.content.glossNotes) {
      const pivotRows = await getText(
        `/api/burrito/ingredient/raw/${section.content.glossNotes[0].pivot}?ipath=${section.bcvRange}.tsv`,
      )
        .text.toString()
        .split("\n");
      for (const pivotRow of pivotRows) {
        const cells = pivotRow.split("\t");
        if (!cells[4] || cells[4].length === 0) {
          continue;
        }
        if (!glossNotePivot[cells[0]]) {
          glossNotePivot[cells[0]] = {};
        }
        const noteIds = cells[4].split(";").map((n) => n.trim());
        glossNotePivot[cells[0]][cells[1]] = noteIds;
        for (const noteId of noteIds) {
          pivotIds.add(noteId);
        }
      }
      const notesRows = await getText(
        `/api/burrito/ingredient/raw/${section.content.glossNotes[0].notes}?ipath=${section.bcvRange}.tsv`,
      )
        .text.toString()
        .split("\n");
      for (const notesRow of notesRows) {
        const cells = notesRow.split("\t");
        if (pivotIds.has(cells[4])) {
          glossNotes[cells[4]] = cells[6];
        }
      }
    }
    const docSpecs = [];
    let scriptureN = 0;
    for (const scripture of section.content.lhs) {
      docSpecs.push({
        id: `xxx_yyy${scriptureN}`,
        path: scripture.src,
        type: scripture.type,
        text: scripture.text,
      });
      scriptureN++;
    }
    const pk = await pkWithDocs(section.bcvRange, docSpecs, options.verbose);
    const bookName = getBookName(pk, "xxx_yyy0", section.bcvRange);
    let sentences = [];
    options.verbose && console.log(`       Sentences`);
    const qualified_id = `${section.id}_${section.bcvRange}`;
    let jxls = [];
    let cvs = [];
    for (const [sentenceN, sentenceJson] of jxlJson.entries()) {
      if (
        section.content.firstSentence &&
        sentenceN + 1 < section.content.firstSentence
      ) {
        continue;
      }
      if (
        section.content.lastSentence &&
        sentenceN + 1 > section.content.lastSentence
      ) {
        continue;
      }
      section.doPdfCallback &&
        section.doPdfCallback({
          type: "juxtaSentence",
          level: 3,
          msg: `Juxta Sentence ${sentenceN + 1} of ${jxlJson.length}`,
          args: [sentenceN + 1, jxlJson.length],
        });
      cvs.push(cvForSentence(sentenceJson));
      options.verbose && console.log(`         ${sentenceN + 1}`);
      let jxlRows = [];
      let sentenceNotes = [];
      for (const [chunkN, chunk] of sentenceJson.chunks.entries()) {
        const source = chunk.source.map((s) => s.content).join(" ");
        const gloss = chunk.gloss;
        let noteFound = false;
        if (
          glossNotePivot[`${sentenceN + 1}`] &&
          glossNotePivot[`${sentenceN + 1}`][`${chunkN + 1}`]
        ) {
          noteFound = true;
          for (const noteId of glossNotePivot[`${sentenceN + 1}`][
            `${chunkN + 1}`
          ]) {
            if (!glossNotes[noteId]) {
              continue;
            }
            sentenceNotes.push(cleanNoteLine(glossNotes[noteId]));
          }
        }
        const bookTestament = books[section.bcvRange];
        const row = templates.jxlRow
          .replace("%%SOURCE%%", source)
          .replace(
            "%%SOURCECLASS%%",
            bookTestament === "OT" ? "jxlHebrew" : "jxlGreek",
          )
          .replace(
            "%%GLOSS%%",
            gloss.replace(/\*([^*]+)\*/g, (m, m1) => `<i>${m1}</i>`),
          )
          .replace(
            "%%NOTECALLERS%%",
            noteFound
              ? `${sentenceNotes.map((note) => `<p class="note">${note}</p>`).join("")}`
              : "",
          );
        jxlRows.push(row);
        sentenceNotes = [];
      }
      jxls.push(templates.jxl.replace("%%ROWS%%", jxlRows.join("\n")));
      if (!sentenceMerges[sentenceN]) {
        const canonicalCvRef = mergeCvs(cvs, true);
        const cvRef = mergeCvs(cvs);
        const cvNotes = unpackCellRange(canonicalCvRef).map(
          (cv) => vNotes[cv] || [],
        );
        let leftContent = [];
        let first = true;
        for (const content of docSpecs) {
          const cvRecord = quoteForCv(
            pk,
            content,
            section.bcvRange,
            canonicalCvRef,
          );
          let lhsText = sentenceJson.sourceString;
          lhsText = tidyLhsText(cvRecord);
          let sentence = templates[`${first ? "first" : "other"}Left`]
            .replace(
              "%%LANGCLASS%%",
              cvRecord.type === "greek" ? "greekLeft" : "transLeft",
            )
            .replace("%%LABEL%%", content.text)
            .replace("%%CONTENT%%", lhsText);
          leftContent.push(sentence);
          first = false;
        }
        const sentence = templates.sentence
          .replace(/%%BOOKNAME%%/g, bookName)
          .replace(/%%SENTENCEREF%%/g, cvRef)
          .replace("%%LEFTCONTENT%%", leftContent.join("\n"))
          .replace("%%JXL%%", jxls.join("\n"))
          .replace(
            "%%NOTES%%",
            cvNotes.length > 0
              ? `${cvNotes
                  .reduce((a, b) => [...a, ...b])
                  .map((nr) => cleanNoteLine(nr))
                  .map((note, i) => {
                    if (i === 0) {
                      return `<div class="no_break footnotesCol"><p class="bcvnote">${note}</p>`;
                    }
                    if (
                      i ===
                      cvNotes
                        .reduce((a, b) => [...a, ...b])
                        .map((nr) => cleanNoteLine(nr)).length -
                        1
                    ) {
                      return `<p class="bcvnote">${note}</p></div>`;
                    }
                    return `<p class="bcvnote">${note}</p>`;
                  })
                  .join("\n")}`
              : "",
          );
        sentences.push(sentence);
        jxls = [];
        cvs = [];
      }
    }
    const server = window.location.origin;
    let srcPolyfill = `${server}/api/app-resources/pdf/paged.polyfill.js`;
    const fontLinks = options.fontFamily
      .map((e) => {
        const ebis = e.replace("Pankosmia", "pankosmia").replaceAll(" ", "_");

        return `<link rel="stylesheet" href="/api/webfonts/${ebis}.css">`;
      })
      .join("\n");

    let html = templates["juxta_page"]
      .replace(
        "%%TITLE%%",
        `${section.id.replace("%%bookCode%%", section.bcvRange)} - ${section.type}`,
      )
      .replace("%%SENTENCES%%", sentences.join(""))
      .replace("%%POLYFY%%", srcPolyfill)
      .replace(
        "%%CSS%%",
        await getCssFromLookUp(options.cssLookUp, "juxta_page_styles"),
      )
      .replace("%%FONTLINKS%%", fontLinks);
    let htmlUuid = await toTemp(html);
    let pdfUuid = await window.api.generatePdf(htmlUuid);
    manifest.push({
      id: `${pdfUuid}`,
      type: section.type,
      startOn: section.content.startOn,
      showPageNumber: section.content.showPageNumber,
      makeFromDouble: true,
    });
  }
}
