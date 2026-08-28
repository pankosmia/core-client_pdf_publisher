import { Box, Typography } from "@mui/material";
import { freeFormat, iconBySection } from "../../pdf-gen/helpers/constants";
import { typeThatNeedRessourceSelection } from "../../pdf-gen/helpers/constants";
import { doI18n } from "pankosmia-lib/i18n";
import { sectionHandlerLookup } from "../../pdf-gen/sectionHandlerLookup";
import { InfoRessource } from "../RessourcesChecker/InfoRessource";
import { convertionTypes } from "../../pdf-gen/helpers/constants";

export function FreeFormatOverview({
  section,
  projectSummaries,
  id,
  lang,
  i18nRef,
}) {
  const Icon = iconBySection[section.type + "Section"];
  return (
    <Box
      key={id}
      sx={{
        width: "100%",
        py: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        {/* ICON */}
        <Box
          sx={{
            width: 48,
            minWidth: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ fontSize: 48 }} />
        </Box>

        {/* CONTENT */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography
            component="div"
            sx={{
              height: 48,
              display: "flex",
              alignItems: "center",
              fontWeight: 500,
            }}
          >
            {doI18n(
              `pages:core-client_pdf_publisher:${section.type + "Section"}`,
              i18nRef.current,
            )}
          </Typography>

          {/* DETAILS */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
            }}
          >
            {Object.entries(section.content)
              .filter(([e]) => freeFormat.includes(e))
              .map(([e, value], idt) => {
                const field = sectionHandlerLookup[
                  section.type.replace("Section", "")
                ]
                  .signature()
                  .fields.find((f) => f.id === e);
                return (
                  <Typography
                    component="div"
                    key={idt}
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      justifyContent: "left",
                      paddingLeft: 2,
                      display: "flex",
                    }}
                  >
                    <>
                      {field?.label?.[lang]} :{value.name.split("/")[1]}
                    </>
                  </Typography>
                );
              })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
