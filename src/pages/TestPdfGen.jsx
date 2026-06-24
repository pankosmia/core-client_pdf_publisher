import { Button, Typography, Box } from "@mui/material";
import { originatePdfs } from "../pdf-gen/originatePdfs";
import { assemblePdfs } from "../pdf-gen/assemblePdf";
import FirefoxInstaller from "../components/FirefoxInstaller";
import pages from "../pdf-gen/Css/Ressources/pages.json";
import fonts from "../pdf-gen/Css/Ressources/fonts.json";
import sizes from "../pdf-gen/Css/Ressources/sizes.json";
import { setupCSS } from "../pdf-gen/doCss";
let configContentBibles = {
  global: {
    fonts: "gentiumOpen",
    pages: "A4P",
    sizes: "12on15",
    outputPath: "~/Downloads/test_one_bible.pdf",
    workingDir: "~/.jxlpdf/working",
    verbose: false,
  },
  sections: [
    {
      id: "cover",
      type: "pdf",
      content: {
        startOn: "recto",
        showPageNumber: false,
        pdf: {
          src: "/git.door43.org/burritotruck/fr_juxta",
          name: "cover.pdf",
        },
      },
    },
    {
      id: "title",
      type: "markdown",
      content: {
        startOn: "recto",
        showPageNumber: false,
        md: {
          src: "/git.door43.org/burritotruck/fr_juxta",
          name: "title.md",
        },
      },
    },
    {
      type: "bcvWrapper",
      ranges: ["LUK"],
      sections: [
        {
          id: "4a663359-0726-4cb1-8b5a-ecf0f9978caa",
          type: "bookNote",
          content: {
            startOn: "recto",
            showPageNumber: true,
            notes: "/git.door43.org/burritotruck/en_sq",
          },
        },
        {
          id: "ba5c63b1-2377-42b8-b032-38ff9007b72f",
          type: "paraBible",
          content: {
            startOn: "recto",
            showPageNumber: true,
            scriptureSrc: "/git.door43.org/burritotruck/en_bsb",
            scriptureType: "translation",
            showWordAtts: false,
            showTitles: true,
            showHeadings: true,
            showIntroductions: true,
            showFootnotes: true,
            showXrefs: true,
            showParaStyles: true,
            showCharacterMarkup: true,
            showChapterLabels: true,
            showVersesLabels: true,
            showFirstVerseLabel: true,
            nColumns: 2,
            showGlossaryStar: false,
            notes: "/git.door43.org/unfoldingWord/en_tn",
          },
        },
        {
          id: "4a663359-0726-4cb1-8b5a-ecf0f9978cab",
          type: "bcvBible",
          content: {
            startOn: "recto",
            showPageNumber: true,
            notes: "/git.door43.org/burritotruck/en_sq",
            scriptureSrc: "/git.door43.org/burritotruck/en_bsb",
            scriptureType: "translation",
          },
        },
        {
          id: "4a663359-0726-4cb1-8b5a-ecf0f9978cac",
          type: "biblePlusNotes",
          content: {
            startOn: "recto",
            showPageNumber: true,
            notes: "/git.door43.org/unfoldingWord/en_tn",
            scriptureSrc: "/git.door43.org/burritotruck/en_bsb",
            scriptureType: "translation",
          },
        },
      ],
    },
  ],
};
let configContentObs = {
  global: {
    fonts: "allGentium",
    pages: "A4P",
    sizes: "9on10",
    outputPath: "~/Downloads/test_obs.pdf",
    workingDir: "~/.jxlpdf/working",
    verbose: false,
  },
  sections: [
    {
      type: "obsWrapper",
      ranges: ["1", "4-5"],
      sections: [
        {
          id: "67481a98-1759-11ef-b34d-1326466935f3",
          type: "obs",
          content: {
            showPageNumber: [true],
            obs: "/git.door43.org/uw/en_obs",
            obsImg: "/git.door43.org/uw/en_images_360",
            startOn: "recto",
          },
        },
        {
          id: "67481a98-1759-11ef-b34d-1326466935f4",
          type: "obsPlusNotes",
          content: {
            showPageNumber: [true],
            obs: "/git.door43.org/uw/en_obs",
            obsImg: "/git.door43.org/uw/en_images_360",
            startOn: "recto",
            notes: "/git.door43.org/uw/en_obs-tn",
          },
        },
      ],
    },
  ],
};
let configContentJxl = {
  global: {
    fonts: "allOpen",
    pages: "A4P",
    sizes: "12on14",
    outputPath: "/home/mark/Downloads/juxtas.pdf",
    workingDir: "/home/mark/.jxlpdf/working",
    verbose: false,
    referencePunctuation: {
      bookChapter: " ",
      chapterVerse: ".",
      verseRange: "-",
    },
  },
  sections: [
    {
      type: "bcvWrapper",
      ranges: ["TIT"],
      sections: [
        {
          id: "juxtaSpread",
          type: "jxlSpread",
          content: {
            startOn: "verso",
            showPageNumber: true,
            jxl: "/git.door43.org/burritotruck/fr_juxta",
            lhs: [
              {
                text: "GREC",
                type: "greek",
                src: "/git.door43.org/unfoldingWord/el-x-koine_ugnt",
              },
              {
                text: "PSLE",
                type: "translation",
                src: "/git.door43.org/burritotruck/fr_psle",
              },
            ],
            bcvNotes: "/git.door43.org/burritotruck/en_sq",
          },
        },
        {
          id: "juxtaSimple",
          type: "jxlSimple",
          content: {
            startOn: "recto",
            showPageNumber: true,
            jxl: "/git.door43.org/burritotruck/fr_juxta",
            bcvNotes: "/git.door43.org/burritotruck/en_sq",
          },
        },
      ],
    },
  ],
};

const optionsObs = {
  verbose: false,
  workingDir: "/home/mark/.jxlpdf/working",
  steps: ["originate", "assemble"],
  pageFormat: pages[configContentObs.global.pages],
  fonts: fonts[configContentObs.global.fonts],
  fontSizes: sizes[configContentObs.global.sizes],
  referencePunctuation: configContentObs.global.referencePunctuation || {
    bookChapter: " ",
    chapterVerse: ":",
    verseRange: "-",
  },
  configContent: configContentObs,
  output: "/home/mark/Downloads/juxtas.pdf",
  cssLookUp: null,
};

const optionsJxl = {
  verbose: false,
  workingDir: "/home/mark/.jxlpdf/working",
  steps: ["originate", "assemble"],
  pageFormat: pages[configContentJxl.global.pages],
  fonts: fonts[configContentJxl.global.fonts],
  fontSizes: sizes[configContentJxl.global.sizes],
  referencePunctuation: configContentJxl.global.referencePunctuation || {
    bookChapter: " ",
    chapterVerse: ":",
    verseRange: "-",
  },
  configContent: configContentJxl,
  output: "/home/mark/Downloads/juxtas.pdf",
  cssLookUp: null,
};

const optionsBibles = {
  verbose: false,
  workingDir: "/home/mark/.jxlpdf/working",
  steps: ["originate", "assemble"],
  pageFormat: pages[configContentBibles.global.pages],
  fonts: fonts[configContentBibles.global.fonts],
  fontSizes: sizes[configContentBibles.global.sizes],
  referencePunctuation: configContentBibles.global.referencePunctuation || {
    bookChapter: " ",
    chapterVerse: ":",
    verseRange: "-",
  },
  configContent: configContentBibles,
  output: "/home/mark/Downloads/juxtas.pdf",
  cssLookUp: null,
};

export function TestPptrFirefox() {
  async function testPdfGen(options) {
    let cssLookUp = await setupCSS({
      pageFormat: options.pageFormat,
      fonts: options.fonts,
      fontSizes: options.fontSizes,
    });
    options.cssLookUp = cssLookUp;
    let manifest = await originatePdfs(options, null);
    await assemblePdfs(options, null, manifest);
  }

  return (
    <Box sx={{ p: 2 }}>
      <FirefoxInstaller />
      <Button onClick={() => testPdfGen(optionsJxl)}>
        test generate pdf juxta + markdown
      </Button>
      <Button onClick={() => testPdfGen(optionsBibles)}>
        test generate bible
      </Button>
      <Button onClick={() => testPdfGen(optionsObs)}>test obs</Button>
    </Box>
  );
}
