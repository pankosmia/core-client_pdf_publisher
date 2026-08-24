import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { Section } from "./section";
import { getJson } from "pankosmia-lib/http";
import { getCssFromLookUp, toTemp } from "../helpers/PankosmiaUtils";
import { enqueueSnackbar } from "notistack";
import { doI18n } from "pankosmia-lib/i18n";

export class obsSection extends Section {
  requiresWrapper() {
    return ["obs"];
  }

  signature() {
    return {
      sectionType: "obs",
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
          id: "obsImg",
          label: {
            en: "OBS source images",
            fr: "Source pour images OBS",
          },
          typeName: "obsImg",
          nValues: [1, 1],
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
      ],
    };
  }

  async doSection({ section, templates, manifest, options, i18nRef }) {
    let isFirst = true;
    let storiesJsonResponse = await getJson(
      `/api/burrito/ingredients/raw/${section.content.obs}?ipath=content`,
    );
    if (storiesJsonResponse.ok) {
      let stories = storiesJsonResponse.json;
      let mkdStories = Object.keys(stories).filter((e) => e.includes(".md"));
      for (const mdName of mkdStories) {
        const [name, suffix] = mdName.split(".");
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
        let imgRepoResponse = await getJson(
          `/api/burrito/paths/${section.content.obsImg}`,
        );
        if (imgRepoResponse.ok) {
          let imgRepo = imgRepoResponse.json;

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

          const server = window.location.origin;
          let srcPolyfill = `${server}/api/app-resources/pdf/paged.polyfill.js`;
          const fontLinks = options.fontFamily.map((e) => {
            const ebis = e
              .replace("Pankosmia", "pankosmia")
              .replaceAll(" ", "_");

            return `<link rel="stylesheet" href="/api/webfonts/${ebis}.css">`;
          });
          let html = templates["obs_page"]
            .replace("%%POLYFY%%", srcPolyfill)
            .replace(
              "%%TITLE%%",
              `${section.id.replace("%%bookCode%%", name)} - ${section.type}`,
            )
            .replace("%%BODY%%", markdown)
            .replace(
              "%%CSS%%",
              await getCssFromLookUp(options.cssLookUp, "obs_page_styles"),
            )
            .replace("%%FONTLINKS%%", fontLinks);

          let uuidHtml = await toTemp(html);
          //   section.doPdfCallback &&
          //     section.doPdfCallback({
          //       type: "pdf",
          //       level: 3,
          //       msg: `Originating PDF ${path.join(options.pdfPath, `${section.id}_${name}.pdf}`)} for OBS story '${mdName}'`,
          //       args: [
          //         `${path.join(options.pdfPath, `${section.id}_${name}.pdf`)}`,
          //         mdName,
          //       ],
          //     });
          let pdfUuid = await window.api.generatePdf(uuidHtml);
          manifest.push({
            id: pdfUuid,
            type: section.type,
            startOn: isFirst ? section.content.startOn : "either",
            showPageNumber: section.content.showPageNumber,
            makeFromDouble: false,
          });
          isFirst = false;
        } else {
          enqueueSnackbar(
            doI18n(
              `pages:core-client_pdf_publisher:errorGet`,
              i18nRef.current,
            ) + `/api/burrito/paths/${section.content.obsImg}`,
            `${imgRepoResponse.status}): ${imgRepoResponse.error}`,
            { variant: "error" },
          );
        }
      }
    } else {
      enqueueSnackbar(
        doI18n(`pages:core-client_pdf_publisher:errorGet`, i18nRef.current) +
          `/api/burrito/ingredients/raw/${section.content.obs}?ipath=content` +
          `${storiesJsonResponse.status}): ${storiesJsonResponse.error}`,
        { variant: "error" },
      );
    }
  }
}
