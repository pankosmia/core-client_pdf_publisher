import pageSizes from "../Css/Ressources/pages.json";
import fontSets from "../Css/Ressources/fonts.json";
import fontSizes from "../Css/Ressources/sizes.json";

import Markdown from "../../components/icons/sectionIcons/markdown";
import Pdf from "../../components/icons/sectionIcons/pdf";
import Bcv from "../../components/icons/sectionIcons/bcv";
import JxlSimple from "../../components/icons/sectionIcons/jxlSimple";
import ParaBible from "../../components/icons/sectionIcons/paraBible";
import TwoColumn from "../../components/icons/sectionIcons/twoColumn";
import BookNote from "../../components/icons/sectionIcons/bookNote";
import BiblePlusNotes from "../../components/icons/sectionIcons/biblePlusNotes";
import FourColumn from "../../components/icons/sectionIcons/fourColumn";
import JxlSpread from "../../components/icons/sectionIcons/jxlSpread";
import Obs from "../../components/icons/sectionIcons/obs";
import ObsPlusNotes from "../../components/icons/sectionIcons/obsPlusNotes";

export const constants = {
  // DEFAULT_WORKING_DIR: path.resolve(path.join(os.homedir(), ".jxlpdf/working")),
  DEFAULT_PAGE_SIZE: "A4P",
  DEFAULT_FONT_SET: "allGentium",
  DEFAULT_FONT_SIZE: "9on10",
  STEPS_OPTIONS: {
    ARGSONLY: [],
    CLEAR: ["clear"],
    ORIGINATE: ["originate"],
    ASSEMBLE: ["assemble"],
    ALL: ["originate", "assemble"],
  },
  PAGE_SIZES: pageSizes,
  FONT_SETS: fontSets,
  FONT_SIZES: fontSizes,
};

export const sectionsTypes = {
  pdfWrapper: { free_format: ["pdfSection"] },
  markdownWrapper: { free_format: ["markdownSection"] },
  bcvWrapper: {
    "one-page-bible": [
      "bcvBibleSection",
      "jxlSimpleSection",
      "paraBibleSection",
      "twoColumnSection",
    ],
    "one-page-notes": ["bookNoteSection", "biblePlusNotesSection"],
    "double-page": ["fourColumnSpreadSection", "jxlSpreadSection"],
  },
  obsWrapper: { obs: ["obsSection", "obsPlusNotesSection"] },
};

export const iconBySection = {
  markdownSection: Markdown,
  pdfSection: Pdf,
  bcvBibleSection: Bcv,
  jxlSimpleSection: JxlSimple,
  paraBibleSection: ParaBible,
  twoColumnSection: TwoColumn,
  bookNoteSection: BookNote,
  biblePlusNotesSection: BiblePlusNotes,
  fourColumnSpreadSection: FourColumn,
  jxlSpreadSection: JxlSpread,
  obsSection: Obs,
  obsPlusNotesSection: ObsPlusNotes,
};

export const convertionTypes = {
  md: [],
  pdf: [],
  jxl: ["x-juxtalinear"],
  scripture: ["textTranslation"],
  notes: ["x-bcvnotes", "x-bcvquestions"],
  src: ["textTranslation"],
  obs: ["textStories"],
  obsImg: ["x-obsimages"],
  bcvNotes: ["x-bcvnotes", "x-bcvquestions"],
  scriptureSrc: ["textTranslation"],
};

export const conversionSection = {
  fourColumnSpreadSection: "fourColumnSpread",
  bookNoteSection: "bookNote",
  jxlSimpleSection: "jxlSimple",
  bcvBibleSection: "bcvBible",
  biblePlusNotesSection: "biblePlusNotes",
  markdownSection: "markdown",
  paraBibleSection: "paraBible",
  jxlSpreadSection: "jxlSpread",
  obsPlusNotesSection: "obsPlusNotes",
  obsSection: "obs",
  pdfSection: "pdf",
  twoColumnSection: "twoColumn",
};
