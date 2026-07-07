import {
  unpackCellRange,
  pkWithDocs,
  getBookName,
  getCVTexts,
  cleanNoteLine,
  bcvNotes,
  toTemp,
} from "../helpers";
import { getCssFromLookUp } from "../helpers/PankosmiaUtils";

import { Section } from "./section";

export class fourColumnSpreadSection extends Section {
  requiresWrapper() {
    return ["bcv"];
  }

  signature() {
    return {
      sectionType: "fourColumnSpread",
      requiresWrapper: this.requiresWrapper(),
      fields: [
        {
          id: "startOn",
          label: {
            en: "First page on",
            fr: "Côté pour première page",
          },
          typeLiteral: "verso",
          nValues: [1, 1],
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
          nValues: [0, 1],
        },
        {
          id: "scripture",
          label: {
            en: "Scripture texts",
            fr: "Textes bibliques",
          },
          nValues: [4, 4],
          typeSpec: [
            {
              id: "text",
              label: {
                en: "Scripture # text label",
                fr: "Etiquette pour texte biblique #",
              },
              typeName: "string",
              nValues: [1, 1],
            },
            {
              id: "src",
              label: {
                en: "Source # text source",
                fr: "Source pour texte biblique #",
              },
              typeName: "translationText",
              nValues: [1, 1],
            },
            {
              id: "type",
              label: {
                en: "Scripture # text type",
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
    const docSpecs = [];
    let scriptureN = 0;
    for (const scripture of section.content.scripture) {
      docSpecs.push({
        id: `xxx_yyy${scriptureN}`,
        path: scripture.src,
      });
      scriptureN++;
    }
    const pk = await pkWithDocs(section.bcvRange, docSpecs, options.verbose);
    const bookName = getBookName(pk, "xxx_yyy0", section.bcvRange);
    const cvTexts = getCVTexts(section.bcvRange, pk);
    let notes = section.content.notes
      ? bcvNotes(section.content.notes, section.bcvRange)
      : {};
    for (const [cv, noteArray] of Object.entries(notes)) {
      notes[cv] = [
        `<div class="no_break footnotesCol"><b>${cv}</b> ${noteArray[0]}`,
        ...noteArray
          .slice(1)
          .map((nt) => `<span class="not_first_note">${nt}</span>`),
      ];
    }
    const verses = [];
    verses.push(
      templates["four_column_spread_title"].replace("%%BOOKNAME%%", bookName),
    );
    const qualified_id = `${section.id}_${section.bcvRange}`;
    const server = window.location.origin;
    let srcPolyfill = `${server}/api/app-resources/pdf/paged.polyfill.js`;
    const fontLinks = options.fontFamily
      .map((e) => {
        const ebis = e.replace("Pankosmia", "pankosmia").replaceAll(" ", "_");

        return `<link rel="stylesheet" href="/api/webfonts/${ebis}.css">`;
      })
      .join("\n");
    const headerHtml = templates["four_column_header_page"]
      .replace(
        "%%TITLE%%",
        `${section.id.replace("%%bookCode%%", section.bcvRange)} - ${section.type}`,
      )
      .replace("%%POLYFY%%", srcPolyfill)
      .replace(/%%TRANS1TITLE%%/g, section.content.scripture[0].text)
      .replace(/%%TRANS2TITLE%%/g, section.content.scripture[1].text)
      .replace(/%%TRANS3TITLE%%/g, section.content.scripture[2].text)
      .replace(/%%TRANS4TITLE%%/g, section.content.scripture[3].text)
      .replace(
        "%%CSS%%",
        await getCssFromLookUp(
          options.cssLookUp,
          "four_col_header_page_styles",
        ),
      )
      .replace("%%FONTLINKS%%", fontLinks);
    let uuidHeader = await toTemp(headerHtml);
    let pdfHeaderfUuid = await window.api.generatePdf(uuidHeader);

    manifest.push({
      id: `${pdfHeaderfUuid}`,
      type: "superimpose",
      startOn: section.content.startOn,
      showPageNumber: section.content.showPageNumber,
      makeFromDouble: true,
    });
    verses.push(`
<section class="columnHeadings">
    <section class="versoPage">
        <h2 class="verseRecordHeadLeft"><span style="float: left">${section.content.scripture[0].text}</span>&nbsp;<span style="float: right">${section.content.scripture[1].text}</span></h2>
    </section>
    <section class="rectoPage">
        <h2 class="verseRecordHeadRight"><span style="float: left">${section.content.scripture[2].text}</span>&nbsp;<span style="float: right">${section.content.scripture[3].text}</span></h2>
    </section>
</section>
`);
    const seenCvs = new Set([]);
    for (const cvRecord of cvTexts) {
      if (seenCvs.has(cvRecord.cv)) {
        continue;
      } else {
        seenCvs.add(cvRecord.cv);
      }
      const cvNotes = unpackCellRange(cvRecord.cv).map((cv) => notes[cv] || []);
      const verseHtml = templates["four_column_spread_verse"]
        .replace(
          "%%VERSOCOLUMNS%%",
          `<div class="col1"><span class="cv">${cvRecord.cv.endsWith(":1") ? `${bookName}&nbsp;` : ""}${cvRecord.cv}</span> ${cvRecord.texts["xxx_yyy0"] || "-"}</div><div class="col2">${cvRecord.texts["xxx_yyy1"] || "-"}</div>`,
        )
        .replace(
          "%%RECTOCOLUMNS%%",
          `<div class="col3">${cvRecord.texts["xxx_yyy2"] || "-"}</div><div class="col4">${cvRecord.texts["xxx_yyy3"] || "-"}${(cvNotes.length >
          0
            ? cvNotes.reduce((a, b) => [...a, ...b])
            : []
          )
            .map((nr) => cleanNoteLine(nr))
            .map((note) => `<span class="note">${note}</span>`)
            .join("\n")}</div>`,
        );
      verses.push(verseHtml);
    }
    let html = templates["four_column_spread_page"]
      .replace(
        "%%TITLE%%",
        `${qualified_id.replace("%%bookCode%%", section.bcvRange)} - ${section.type}`,
      )
      .replace("%%POLYFY%%", srcPolyfill)
      .replace("%%VERSES%%", verses.join("\n"))
      .replace("%%BOOKNAME%%", bookName)
      .replace(
        "%%CSS%%",
        await getCssFromLookUp(options.cssLookUp, "four_col_page_styles"),
      )
      .replace("%%FONTLINKS%%", fontLinks);
    let uuidBody = await toTemp(html);
    let pdfUuid = await window.api.generatePdf(uuidBody);

    // await doPuppet({
    //   browser: options.browser,
    //   verbose: options.verbose,
    //   htmlPath: path.join(
    //     options.htmlPath,
    //     `${qualified_id.replace("%%bookCode%%", section.bcvRange)}.html`,
    //   ),
    //   pdfPath: path.join(
    //     options.pdfPath,
    //     `${qualified_id.replace("%%bookCode%%", section.bcvRange)}.pdf`,
    //   ),
    // });
    manifest.push({
      id: `${pdfUuid}`,
      type: section.type,
      startOn: section.content.startOn,
      showPageNumber: section.content.showPageNumber,
      makeFromDouble: true,
    });
  }
}
