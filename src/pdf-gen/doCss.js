import {
  simple_juxta_page_styles,
  markdown_page_styles,
  markdown_mono_page_styles,
  bcv_bible_page_styles,
  bible_plus_notes_in_columns_page_styles,
  bible_plus_notes_in_rows_page_styles,
  four_col_header_page_styles,
  four_col_page_styles,
  juxta_page_styles,
  non_juxta_page_styles,
  obs_page_styles,
  obs_plus_notes_page_styles,
  page_number_master_styles,
  para_bible_page_styles,
  two_col_header_page_styles,
  two_col_page_styles,
} from "./Css/stylePages";
import {
  JUXTA,
  BODY2,
  ATPAGE,
  FOOTNOTE,
  BODY,
  H1,
  P,
  ATDOUBLEPAGE,
  ATDOUBLEPAGEHEADER,
  ATPAGEHEADER,
  FOURCOL,
  TWOCOL,
} from "./Css/Fragment";
const setupOneCSS = (fileContent, placeholder, markup, value) => {
  const substRe = new RegExp(`${markup}${placeholder}${markup}`, "g");
  return fileContent.replace(substRe, value);
};

const checkCssSubstitution = (filename, css, markup) => {
  const checkRe = new RegExp(`${markup}[A-Z0-9]+${markup}`);
  if (checkRe.test(css)) {
    throw new Error(
      `${checkRe.exec(css)} found in CSS from ${filename} after substitution`,
    );
  }
};

export async function setupCSS(options) {
  const uuidKeyValues = {};
  const cssFragments = {};
  const cssFragmentFilenames = [
    "P",
    "BODY",
    "FOOTNOTE",
    "ATPAGE",
    "BODY2",
    "H1",
    "JUXTA",
    "ATDOUBLEPAGE",
    "ATDOUBLEPAGEHEADER",
    "ATPAGEHEADER",
    "FOURCOL",
    "TWOCOL",
  ];
  const cssFragmentContent = {
    P: P,
    BODY: BODY,
    BODY2: BODY2,
    FOOTNOTE: FOOTNOTE,
    ATPAGE: ATPAGE,
    H1: H1,
    JUXTA: JUXTA,
    ATDOUBLEPAGE: ATDOUBLEPAGE,
    ATDOUBLEPAGEHEADER: ATDOUBLEPAGEHEADER,
    ATPAGEHEADER: ATPAGEHEADER,
    FOURCOL: FOURCOL,
    TWOCOL: TWOCOL,
  };
  const cssFileNames = [
    "simple_juxta_page_styles",
    "markdown_page_styles",
    "markdown_mono_page_styles",
    "bcv_bible_page_styles",
    "bible_plus_notes_in_columns_page_styles",
    "bible_plus_notes_in_rows_page_styles",
    "four_col_header_page_styles",
    "four_col_page_styles",
    "juxta_page_styles",
    "non_juxta_page_styles",
    "obs_page_styles",
    "obs_plus_notes_page_styles",
    "page_number_master_styles",
    "para_bible_page_styles",
    "two_col_header_page_styles",
    "two_col_page_styles",
  ];
  const cssCotent = {
    simple_juxta_page_styles: simple_juxta_page_styles,
    markdown_page_styles: markdown_page_styles,
    markdown_mono_page_styles: markdown_mono_page_styles,
    bcv_bible_page_styles: bcv_bible_page_styles,
    bible_plus_notes_in_columns_page_styles:
      bible_plus_notes_in_columns_page_styles,
    bible_plus_notes_in_rows_page_styles: bible_plus_notes_in_rows_page_styles,
    four_col_header_page_styles: four_col_header_page_styles,
    four_col_page_styles: four_col_page_styles,
    juxta_page_styles: juxta_page_styles,
    non_juxta_page_styles: non_juxta_page_styles,
    obs_page_styles: obs_page_styles,
    obs_plus_notes_page_styles: obs_plus_notes_page_styles,
    page_number_master_styles: page_number_master_styles,
    para_bible_page_styles: para_bible_page_styles,
    two_col_header_page_styles: two_col_header_page_styles,
    two_col_page_styles: two_col_page_styles,
  };

  for (const filename of cssFragmentFilenames) {
    cssFragments[filename] = cssFragmentContent[filename];
  }

  for (const filename of cssFileNames) {
    let fileContent = cssCotent[filename];
    for (const [fragKey, fragContent] of Object.entries(cssFragments)) {
      fileContent = setupOneCSS(fileContent, fragKey, "%%%", fragContent);
    }
    checkCssSubstitution(filename, fileContent, "%%%");
    const pageFormat = options.pageFormat;
    const spaceOption = 0; // MAKE THIS CONFIGURABLE
    const pageBodyWidth =
      pageFormat.pageSize[0] -
      (pageFormat.margins.inner[spaceOption] +
        pageFormat.margins.outer[spaceOption]);
    const pageBodyHeight =
      pageFormat.pageSize[1] -
      (pageFormat.margins.top[spaceOption] +
        pageFormat.margins.bottom[spaceOption]);
    for (const [placeholder, value] of [
      ["PAGEWIDTH", pageFormat.pageSize[0]],
      ["PAGEBODYWIDTH", pageBodyWidth],
      ["DOUBLEPAGEWIDTH", pageFormat.pageSize[0] * 2],
      ["PAGEHEIGHT", pageFormat.pageSize[1]],
      ["MARGINTOP", pageFormat.margins.top[spaceOption]],
      ["FIRSTPAGEMARGINTOP", pageFormat.margins.firstPageTop[spaceOption]],
      ["MARGINBOTTOM", pageFormat.margins.bottom[spaceOption]],
      ["FOOTEROFFSET", pageFormat.footerOffset[spaceOption]],
      ["MARGININNER", pageFormat.margins.inner[spaceOption]],
      ["DOUBLEMARGININNER", pageFormat.margins.inner[spaceOption] * 2],
      ["MARGINOUTER", pageFormat.margins.outer[spaceOption]],
      [
        "PAGENUMBERTOPMARGIN",
        pageBodyHeight +
          pageFormat.margins.top[spaceOption] +
          pageFormat.footerOffset[spaceOption],
      ],
      ["COLUMNGAP", pageFormat.columnGap[spaceOption]],
      ["HALFCOLUMNGAP", pageFormat.columnGap[spaceOption] / 2],
      [
        "TWOCOLUMNWIDTH",
        (pageBodyWidth - pageFormat.columnGap[spaceOption]) / 2,
      ],
      [
        "3COLUMNWIDTH",
        (pageBodyWidth - pageFormat.columnGap[spaceOption] * 2) / 3,
      ],
      [
        "20PCWIDTH",
        (pageBodyWidth - pageFormat.columnGap[spaceOption] * 2) * 0.2,
      ],
      [
        "30PCWIDTH",
        (pageBodyWidth - pageFormat.columnGap[spaceOption] * 2) * 0.3,
      ],
      [
        "35PCWIDTH",
        (pageBodyWidth - pageFormat.columnGap[spaceOption] * 2) * 0.35,
      ],
      [
        "40PCWIDTH",
        (pageBodyWidth - pageFormat.columnGap[spaceOption] * 2) * 0.4,
      ],
      [
        "45PCWIDTH",
        (pageBodyWidth - pageFormat.columnGap[spaceOption] * 2) * 0.45,
      ],
      ["BODYFONT", options.fonts.body],
      ["BODYFONT2", options.fonts.body2 || options.fonts.body],
      ["HEADINGFONT", options.fonts.heading],
      ["FOOTNOTEFONT", options.fonts.footnote],
      ["MONOFONT", options.fonts.mono],
      ["GREEKFONT", options.fonts.greek],
      ["HEBREWFONT", options.fonts.hebrew],
      ["BODYFONTSIZE", options.fontSizes.body.font],
      ["BODYLINEHEIGHT", options.fontSizes.body.height],
      ["DOUBLEBODYLINEHEIGHT", options.fontSizes.body.height * 2],
      ["BODYHALFLINEHEIGHT", options.fontSizes.body.height],
      ["BODYBOTTOMMARGIN", options.fontSizes.body.bottomMargin],
      ["BODYBOTTOMBORDERWIDTH", options.fontSizes.body.bottomBorderWidth],
      ["BODYBOTTOMPADDING", options.fontSizes.body.bottomPadding],
      ["H4FONTSIZE", options.fontSizes.h4.font],
      ["H4LINEHEIGHT", options.fontSizes.h4.height],
      ["H4HALFLINEHEIGHT", options.fontSizes.h4.height],
      ["H4BOTTOMMARGIN", options.fontSizes.h4.bottomMargin],
      ["H4BOTTOMBORDERWIDTH", options.fontSizes.h4.bottomBorderWidth],
      ["H4BOTTOMPADDING", options.fontSizes.h4.bottomPadding],
      ["H3FONTSIZE", options.fontSizes.h3.font],
      ["H3LINEHEIGHT", options.fontSizes.h3.height],
      ["H3HALFLINEHEIGHT", options.fontSizes.h3.height],
      ["H3BOTTOMMARGIN", options.fontSizes.h3.bottomMargin],
      ["H3BOTTOMBORDERWIDTH", options.fontSizes.h3.bottomBorderWidth],
      ["H3BOTTOMPADDING", options.fontSizes.h3.bottomPadding],
      ["H2FONTSIZE", options.fontSizes.h2.font],
      ["H2LINEHEIGHT", options.fontSizes.h2.height],
      ["H2HALFLINEHEIGHT", options.fontSizes.h2.height],
      ["H2BOTTOMMARGIN", options.fontSizes.h2.bottomMargin],
      ["H2BOTTOMBORDERWIDTH", options.fontSizes.h2.bottomBorderWidth],
      ["H2BOTTOMPADDING", options.fontSizes.h2.bottomPadding],
      ["H1FONTSIZE", options.fontSizes.h1.font],
      ["H1LINEHEIGHT", options.fontSizes.h1.height],
      ["H1HALFLINEHEIGHT", options.fontSizes.h1.height],
      ["H1BOTTOMMARGIN", options.fontSizes.h1.bottomMargin],
      ["H1BOTTOMBORDERWIDTH", options.fontSizes.h1.bottomBorderWidth],
      ["H1BOTTOMPADDING", options.fontSizes.h1.bottomPadding],
      ["FOOTNOTEFONTSIZE", options.fontSizes.footnote.font],
      ["FOOTNOTELINEHEIGHT", options.fontSizes.footnote.height],
      ["FOOTNOTEHALFLINEHEIGHT", options.fontSizes.footnote.height],
      ["FOOTNOTEBOTTOMMARGIN", options.fontSizes.footnote.bottomMargin],
      [
        "FOOTNOTEBOTTOMBORDERWIDTH",
        options.fontSizes.footnote.bottomBorderWidth,
      ],
      ["FOOTNOTEBOTTOMPADDING", options.fontSizes.footnote.bottomPadding],
      [
        "FOOTNOTECALLEROFFSET",
        options.fontSizes.body.font - options.fontSizes.footnote.font,
      ],
      ["RULEPADDING", options.fontSizes.rule.bottomPadding],
      ["RULEWIDTH", options.fontSizes.rule.bottomBorderWidth],
      ["RULEMARGIN", options.fontSizes.rule.bottomMargin],
    ]) {
      fileContent = setupOneCSS(fileContent, placeholder, "%%", value);
    }
    checkCssSubstitution(filename, fileContent, "%%");
    const blob = new Blob([fileContent], { type: "text/html" });

    // 2. Create FormData
    const formData = new FormData();

    // IMPORTANT: field name must match backend (likely "file")
    formData.append("file", blob, "test.html");

    const response = await fetch("/api/temp/bytes", {
      method: "POST",
      body: formData,
    });

    const result = await response.text();
    const { uuid } = JSON.parse(result);
    uuidKeyValues[filename] = uuid;
  }
  return uuidKeyValues;
}
