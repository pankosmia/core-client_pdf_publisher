export const TWOCOL = `h2.verseRecordHeadLeft, h2.verseRecordHeadRight {
    font-size: %%H4FONTSIZE%%pt;
    line-height: %%H4LINEHEIGHT%%pt;
    font-style: italic;
    font-weight: bold;
    margin: 0;
    width: %%TWOCOLUMNWIDTH%%pt;
    font-family: %%HEADINGFONT%%;
}

h2.verseRecordHeadLeft {
    text-align: left;
}

h2.verseRecordHeadRight {
    text-align: right;
}

.leftColumn {
    display: inline-block;
    width: %%TWOCOLUMNWIDTH%%pt;
    vertical-align: top;
    margin-right: %%HALFCOLUMNGAP%%pt;
}

.rightColumn {
    width: %%TWOCOLUMNWIDTH%%pt;
    height: 100%;
    display: inline-block;
    vertical-align: top;
    margin-left: %%HALFCOLUMNGAP%%pt;
}`;
