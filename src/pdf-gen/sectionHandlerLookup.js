import {
  fourColumnSpreadSection,
  bookNoteSection,
  jxlSimpleSection,
  bcvBibleSection,
  biblePlusNotesSection,
  markdownSection,
  paraBibleSection,
  jxlSpreadSection,
  obsPlusNotesSection,
  obsSection,
  pdfSection,
  twoColumnSection,
} from "./Section";

export const sectionHandlerLookup = {
  markdown: new markdownSection(),
  jxlSimple: new jxlSimpleSection(),
  fourColumnSpread: new fourColumnSpreadSection(),
  bcvBible: new bcvBibleSection(),
  bookNote: new bookNoteSection(),
  biblePlusNotes: new biblePlusNotesSection(),
  paraBible: new paraBibleSection(),
  jxlSpread: new jxlSpreadSection(),
  obsPlusNotes: new obsPlusNotesSection(),
  obs: new obsSection(),
  pdf: new pdfSection(),
  twoColumn: new twoColumnSection(),
};
