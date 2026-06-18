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

export class twoColumnSection extends Section {
  requiresWrapper() {
    return ["bcv"];
  }

  signature() {
    return {
      sectionType: "2Column",
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
          id: "scripture",
          label: {
            en: "Scripture Texts",
            fr: "Textes bibliques",
          },
          nValues: [2, 2],
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
    const docSpecs = [];
    let scriptureN = 0;
    for (const scripture of section.content.scripture) {
      docSpecs.push({ id: `xxx_yyy${scriptureN}`, path: scripture.src });
      scriptureN++;
    }
    const pk = await pkWithDocs(section.bcvRange, docSpecs, options.verbose);
    const bookName = getBookName(pk, "xxx_yyy0", section.bcvRange);
    const cvTexts = getCVTexts(section.bcvRange, pk);
    let notes = section.content.notes
      ? await bcvNotes(section.content.notes, section.bcvRange)
      : {};
    for (const [cv, noteArray] of Object.entries(notes)) {
      notes[cv] = [
        `<b>${cv}</b> ${noteArray[0]}`,
        ...noteArray
          .slice(1)
          .map((nt) => `<span class="not_first_note">${nt}</span>`),
      ];
    }
    const verses = [];
    verses.push(
      templates["two_column_title"].replace("%%BOOKNAME%%", bookName),
    );
    const qualified_id = `${section.id}_${section.bcvRange}`;
    const server = window.location.origin;
    let srcPolyfill = `${server}/api/app-resources/pdf/paged.polyfill.js`;

    const headerHtml = templates["two_column_header_page"]
      .replace(
        "%%TITLE%%",
        `${section.id.replace("%%bookCode%%", section.bcvRange)} - ${section.type}`,
      )
      .replace("%%POLYFY%%", srcPolyfill)
      .replace(/%%TRANS1TITLE%%/g, section.content.scripture[0].text)
      .replace(/%%TRANS2TITLE%%/g, section.content.scripture[1].text)
      .replace(
        "%%CSS%%",
        await getCssFromLookUp(options.cssLookUp, "two_col_header_page_styles"),
      );
    let uuidHeader = await toTemp(headerHtml);
    let pdfUuidHeader = await window.api.generatePdf(uuidHeader);
    manifest.push({
      id: `${pdfUuidHeader}`,
      type: "superimpose",
      startOn: section.content.startOn,
      showPageNumber: section.content.showPageNumber,
      makeFromDouble: true,
    });
    // await doPuppet({
    //   browser: options.browser,
    //   verbose: options.verbose,
    //   htmlPath: path.join(
    //     options.htmlPath,
    //     `${section.id.replace("%%bookCode%%", section.bcvRange)}_superimpose.html`,
    //   ),
    //   pdfPath: path.join(
    //     options.pdfPath,
    //     `${section.id.replace("%%bookCode%%", section.bcvRange)}_superimpose.pdf`,
    //   ),
    // });
    verses.push(`
<section class="columnHeadings">
    <section class="leftColumn">
        <h2 class="verseRecordHeadLeft">${section.content.scripture[0].text}</h2>
    </section>
    <section class="rightColumn">
        <h2 class="verseRecordHeadRight">${section.content.scripture[1].text}</h2>
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
      const verseHtml = templates["two_column_verse"]
        .replace("%%TRANS1TITLE%%", section.content.scripture[0].text)
        .replace("%%TRANS2TITLE%%", section.content.scripture[1].text)
        .replace(
          "%%LEFTCOLUMN%%",
          `<div class="col1"><span class="cv">${cvRecord.cv}</span> ${cvRecord.texts["xxx_yyy0"] || "-"}</div>`,
        )
        .replace(
          "%%RIGHTCOLUMN%%",
          `<div class="col2">${cvRecord.texts["xxx_yyy1"] || "-"}${(cvNotes.length >
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
    let html = templates["two_column_page"]
      .replace(
        "%%TITLE%%",
        `${qualified_id.replace("%%bookCode%%", section.bcvRange)} - ${section.type}`,
      )
      .replace("%%BODY%%", verses.join("\n"))
      .replace("%%BOOKNAME%%", bookName)
      .replace(
        "%%CSS%%",
        await getCssFromLookUp(options.cssLookUp, "two_col_page_styles"),
      )
      .replace("%%POLYFY%%", srcPolyfill);
    let uuidHtml = await toTemp(html);
    let pdfUuid = await window.api.generatePdf(uuidHtml);
    manifest.push({
      id: pdfUuid,
      type: section.type,
      startOn: section.content.startOn,
      showPageNumber: section.content.showPageNumber,
      makeFromDouble: false,
    });
  }
}
