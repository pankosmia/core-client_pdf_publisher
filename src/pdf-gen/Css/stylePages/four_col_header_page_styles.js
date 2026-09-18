export const four_col_header_page_styles = `%%%ATDOUBLEPAGEHEADER%%%

%%%BODY%%%

%%%P%%%

%%%H1%%%

%%%FOURCOL%%%

.col1, .col2, .col3, .col4 {
    vertical-align: top;
    display: inline-block;
    width: %%TWOCOLUMNWIDTH%%pt;
    text-align: justify;
}

.col1, .col3 {
    margin-right: 12pt;
}

.columnHeadings {
    page-break-inside: avoid;
    break-after: page;
    vertical-align: top;
    display: inline-flex;
}`;
