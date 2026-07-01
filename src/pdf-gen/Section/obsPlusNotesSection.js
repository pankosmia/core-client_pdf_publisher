import { setupOneCSS, checkCssSubstitution } from "../helpers";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { Section } from "./section";
import { getJson, getText } from "pankosmia-lib/http";
import { getCssFromLookUp, toTemp } from "../helpers/PankosmiaUtils";

const getObsNotes = async (notesPath, notesRef) => {
  return (
    await getText(`/api/burrito/ingredient/raw/${notesPath}?ipath=${"OBS.tsv"}`)
  ).text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith(`${notesRef}\t`))
    .map((l) => l.split(`\t`))
    .map((lc) => `<p class="note\"><b>${lc[4]}</b> ${lc[6]}</p>`)
    .join("\n");
};

export class obsPlusNotesSection extends Section {
  requiresWrapper() {
    return ["obs"];
  }

  signature() {
    return {
      sectionType: "obsPlusNotes",
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
          id: "obs",
          label: {
            en: "OBS source",
            fr: "Source pour OBS",
          },
          typeName: "obs",
          nValues: [1, 1],
        },
        {
          id: "obsImg",
          label: {
            en: "OBS source images",
            fr: "Source pour images OBS",
          },
          typeName: "obsImg",
          nValues: [1, 1],
        },
        {
          id: "notes",
          label: {
            en: "Notes source",
            setupOneCSS,

            fr: "Source pour notes",
          },
          typeName: "obsNotes",
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
    doPdfCallback,
  }) {
    let isFirst = false;
    let stories = (
      await getJson(
        `/api/burrito/ingredients/raw/${section.content.obs}?ipath=content`,
      )
    ).json;
    let mkdStories = Object.keys(stories).filter((e) => e.includes(".md"));
    for (const mdName of mkdStories) {
      const [name, suffix] = mdName.split(".");
      let storyNotes = "";
      if (section.obsNotesPath) {
        storyNotes = await getObsNotes(
          section.content.notes,
          `${parseInt(name)}:0`,
        );
      }
      if (suffix !== "md" || !parseInt(name)) {
        continue;
      }
      if (section.firstStory && parseInt(name) < section.firstStory) {
        continue;
      }
      if (section.lastStory && parseInt(name) > section.lastStory) {
        continue;
      }
      let markdown = DOMPurify.sanitize(
        marked.parse(stories[mdName].toString()),
      );

      const imagesLinks = [
        ...markdown.matchAll(/!\[OBS Image\]\(([^)]+)\)/g),
      ].map((match) => match[1]);

      let imgRepo = (
        await getJson(`/api/burrito/paths/${section.content.obsImg}`)
      ).json;

      imagesLinks.map((e) => {
        let replacedValue = e;
        let splited = e.split("/")[e.split("/").length - 1].split("-");
        let obsNumber = splited[2];
        let obsImgNumber = splited[3];
        let path = imgRepo.find((e) =>
          e.includes(`${obsNumber}-${obsImgNumber}`),
        );
        let link = `/burrito/ingredient/bytes/${section.content.obsImg}?ipath=${path}`;
        replacedValue = replacedValue.replace(
          /!\[OBS Image\]\([^)]+\)/g,
          `![OBS Image not found](${link})`,
        );
        return (e, replacedValue);
      });

      imagesLinks.forEach((tup) => markdown.replace(tup[0], tup[1]));

      if (section.content.notes) {
        markdown = markdown.replace(
          /<\/h1>/g,
          `</h1><section class=\"storynotes\">\n${storyNotes}\n</section>\n`,
        );
        markdown = markdown.replace(
          /<p><img/g,
          '<section class="storysection">\n<p class="storypara"><img',
        );
        markdown = markdown.replace(/jpg"><\/p>\n<p>/g, 'jpg">');
        markdown = markdown.replace(
          /<\/p>\n<section/g,
          '</p>\n<section class="storynotes">%%%%NOTES%%%%</section>\n</section>\n<section',
        );
        let noteParaN = 1;
        while (RegExp(/%%%%NOTES%%%%/).test(markdown)) {
          const noteParaRef = `${parseInt(name)}:${noteParaN}`;
          markdown = markdown.replace(
            "%%%%NOTES%%%%",
            await getObsNotes(section.content.notes, noteParaRef),
          );
          noteParaN++;
        }
      }
      const qualified_id = `${section.id}_${section.bcvRange}`;
      const server = window.location.origin;
      const fontLinks = options.fontFamily.map((e) => {
        const ebis = e.replace("Pankosmia", "pankosmia").replaceAll(" ", "_");

        return `<link rel="stylesheet" href="/api/webfonts/${ebis}.css">`;
      });
      let srcPolyfill = `${server}/api/app-resources/pdf/paged.polyfill.js`;
      let html = templates["obs_page"]
        .replace("%%POLYFY%%", srcPolyfill)
        .replace(
          "%%TITLE%%",
          `${section.id.replace("%%bookCode%%", name)} - ${section.type}`,
        )
        .replace("%%BODY%%", markdown)
        .replace("%%FONTLINKS%%", fontLinks);
      let css = await getCssFromLookUp(
        options.cssLookUp,
        "obs_plus_notes_page_styles",
      );
      for (const [placeholder, values] of options.pageFormat.sections
        .obsPlusNotes.cssValues) {
        css = setupOneCSS(css, placeholder, "%", values[0]);
      }

      checkCssSubstitution("obs_plus_notes_page_styles.css", css, "%");
      html.replace("%%CSS%%", css);

      //   section.doPdfCallback &&
      //     section.doPdfCallback({
      //       type: "pdf",
      //       level: 3,
      //       msg: `Originating PDF ${path.join(options.pdfPath, `${section.id}_${name}.pdf}`)} for OBSPlusNotes story '${mdName}'`,
      //       args: [
      //         `${path.join(options.pdfPath, `${section.id}_${name}.pdf`)}`,
      //         mdName,
      //       ],
      //     });
      let uuidHtml = await toTemp(html);
      let pdfUuid = await window.api.generatePdf(uuidHtml);

      manifest.push({
        id: pdfUuid,
        type: section.type,
        startOn: isFirst ? section.content.startOn : "either",
        showPageNumber: section.content.showPageNumber,
        makeFromDouble: false,
      });
      isFirst = false;
    }
  }
}
