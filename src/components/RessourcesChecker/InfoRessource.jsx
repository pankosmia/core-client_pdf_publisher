import { doI18n } from "pankosmia-lib/i18n";
import { Tooltip, Typography, Box } from "@mui/material";
import { ErrorOutline, Done } from "@mui/icons-material";

export const InfoRessource = ({
  summary,
  pathElem,
  flavors,
  bRanges,
  i18nRef,
  typographySx = null,
  typographyVariant = null,
  icons = true,
}) => {
  if (!summary?.[pathElem]?.name) {
    return (
      <>
        {icons && <ErrorOutline fontSize="small" />}
        <Typography
          variant={typographyVariant ? typographyVariant : "body1"}
          color="text.primary"
        >{` ${doI18n(
          `pages:core-client_pdf_publisher:missing_ressources`,
          i18nRef.current,
        )} : ${pathElem}`}</Typography>
      </>
    );
  }

  let toolTipErrors = { bookCode: [], flavor: "" };
  let toolTipMessages = [];
  bRanges.forEach((bc) => {
    if (!summary?.[pathElem]?.book_codes.includes(bc)) {
      toolTipErrors.bookCode.push(bc);
    }
  });
  if (!flavors.includes(summary?.[pathElem]?.flavor)) {
    toolTipErrors.flavor = summary?.[pathElem]?.flavor;
  }
  if (toolTipErrors.bookCode.length > 0) {
    toolTipMessages.push(
      `${doI18n(
        `pages:core-client_pdf_publisher:missing_book`,
        i18nRef.current,
      ).replace(
        "%%RESSOURCE%%",
        summary?.[pathElem]?.name,
      )} ${toolTipErrors.bookCode}`,
    );
  }
  if (toolTipErrors.flavor !== "") {
    toolTipMessages.push(
      `${doI18n(
        `pages:core-client_pdf_publisher:flavor_miss_match`,
        i18nRef.current,
      )} ${toolTipErrors.flavor}`,
    );
  }
  if (toolTipMessages.length > 1) {
    return (
      <Tooltip
        describeChild
        title={toolTipMessages.map((m) => (
          <Typography>{m}</Typography>
        ))}
      >
        <Box sx={{ display: "flex", flexDirection: "row", gap: 0.5 }}>
          {icons && <ErrorOutline fontSize="small" />}
          <Typography
            color="text.primary"
            variant={typographyVariant ? typographyVariant : "body1"}
            sx={typographySx ? typographySx : {}}
          >
            {doI18n(
              `pages:core-client_pdf_publisher:ressource_errors`,
              i18nRef.current,
            )}
          </Typography>
        </Box>
      </Tooltip>
    );
  }
  if (toolTipMessages.length === 1) {
    return (
      <>
        {icons && <ErrorOutline fontSize="small" />}
        <Typography
          color="text.primary"
          variant={typographyVariant ? typographyVariant : "body1"}
          sx={typographySx ? typographySx : {}}
        >
          {toolTipMessages[0]}
        </Typography>
      </>
    );
  } else {
    return (
      <>
        {icons && <Done fontSize="small" />}{" "}
        <Typography
          variant={typographyVariant ? typographyVariant : "body1"}
          sx={typographySx ? typographySx : {}}
        >
          {summary?.[pathElem]?.name}
        </Typography>
      </>
    );
  }
};
