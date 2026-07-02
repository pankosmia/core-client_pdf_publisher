import {
  sectionsTypes,
  iconBySection,
} from "../../../pdf-gen/helpers/constants";
import { doI18n } from "pankosmia-lib/i18n";
import { i18nContext } from "pankosmia-rcl";
import { useContext, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Switch,
  Badge,
  FormControlLabel,
} from "@mui/material";

export function SelectSection({
  currentSections,
  setCurrentSections,
  wrapperName,
}) {
  const { i18nRef } = useContext(i18nContext);

  const [allowMultiple, setAllowMultiple] = useState(true);

  const isSelected = (section) =>
    currentSections.some((s) => s.type === section);

  const getIndex = (section) =>
    currentSections.findIndex((s) => s.type === section);

  const handleSelection = (section) => {
    if (allowMultiple) {
      setCurrentSections((prev) => {
        const exists = prev.some((s) => s.type === section);

        if (exists) {
          return prev.filter((s) => s.type !== section);
        }

        return [
          ...prev,
          {
            type: section,
            id: uuidv4(),
            content: {},
          },
        ];
      });
    } else {
      setCurrentSections([
        {
          type: section,
          id: uuidv4(),
          content: {},
        },
      ]);
    }
  };

  const handleMultipleToggle = (enabled) => {
    setAllowMultiple(enabled);

    if (!enabled && currentSections.length > 1) {
      setCurrentSections([currentSections[0]]);
    }
  };
  let usedSectionType = JSON.parse(JSON.stringify(sectionsTypes));
  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
        <InfoOutlinedIcon />

        <Typography>
          {doI18n(
            "pages:core-client_pdf_publisher:multipleSelectionDescription",
            i18nRef.current,
          )}
        </Typography>
      </Box>
      {usedSectionType?.[wrapperName] &&
        Object.entries({ ...usedSectionType?.[wrapperName] }).map(
          ([name, sections], id) => (
            <Box key={id} sx={{ margin: 2 }}>
              <Typography sx={{ fontWeight: 700 }}>
                {doI18n(
                  `pages:core-client_pdf_publisher:${name}`,
                  i18nRef.current,
                )}
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "row", margin: 2 }}>
                {sections.map((section, id) => (
                  <Badge
                    key={id}
                    invisible={!allowMultiple}
                    badgeContent={
                      isSelected(section) ? getIndex(section) + 1 : null
                    }
                    color="primary"
                    overlap="circular"
                    anchorOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                  >
                    <Card
                      onClick={() => handleSelection(section)}
                      sx={{
                        width: 128,
                        height: 128,
                        mr: 2,
                        cursor: "pointer",
                        transition: "all 0.2s ease",

                        bgcolor: isSelected(section)
                          ? "secondary.light"
                          : "background.paper",

                        color: isSelected(section)
                          ? "primary.contrastText"
                          : "text.primary",

                        borderColor: isSelected(section)
                          ? "secondary.light"
                          : "divider",

                        "&:hover": {
                          bgcolor: isSelected(section)
                            ? "secondary.light"
                            : "action.hover",
                          transform: "translateY(-2px)",
                          boxShadow: 4,
                        },
                      }}
                    >
                      <CardContent sx={{ padding: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                          }}
                        >
                          {(() => {
                            const Icon = iconBySection[section];
                            if (!Icon) {
                              console.warn(
                                `No icon found for section type: "${section}"`,
                              );
                              return (
                                <InfoOutlinedIcon
                                  sx={{ width: 72, height: 72, fontSize: 72 }}
                                />
                              );
                            }
                            return (
                              <Icon
                                sx={{ width: 72, height: 72, fontSize: 72 }}
                              />
                            );
                          })()}

                          <Typography sx={{ userSelect: "none" }}>
                            {doI18n(
                              `pages:core-client_pdf_publisher:${section}`,
                              i18nRef.current,
                            )}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Badge>
                ))}
              </Box>
            </Box>
          ),
        )}
    </Box>
  );
}
