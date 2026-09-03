import {
  sectionsTypes,
  iconBySection,
} from "../../../pdf-gen/helpers/constants";
import { doI18n } from "pankosmia-lib/i18n";
import { i18nContext } from "pankosmia-rcl";
import { useContext, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Card, CardContent, Box, Typography, Badge } from "@mui/material";

/**
 * SelectSection
 *
 * Renders a grid of selectable "section type" cards (grouped by category)
 * that the user picks to build up the sections of a PDF/markdown document.
 *
 * Selection behavior depends on the wrapper being edited:
 * - "markdownPdfWrapper": single-select only — picking a card replaces
 *   `currentSections` entirely with just that one section.
 * - any other wrapper: multi-select — picking a card toggles it in/out
 *   of `currentSections`, and selection order is shown via a numbered badge.
 *
 * @param {Array}    currentSections     - Currently selected sections ({ type, id, content }).
 * @param {Function} setCurrentSections  - Setter to update the selected sections.
 * @param {string}   wrapperName         - Identifies which document type is being built;
 *                                          drives both allowed section types and select mode.
 */
export function SelectSection({
  currentSections,
  setCurrentSections,
  wrapperName,
}) {
  const { i18nRef } = useContext(i18nContext);

  // Multi-select is disabled for the markdown PDF wrapper (only one section allowed);
  // enabled for every other wrapper type.
  const [allowMultiple, setAllowMultiple] = useState(
    wrapperName === "markdownPdfWrapper" ? false : true,
  );

  // Whether a given section type is currently part of the selection.
  const isSelected = (section) =>
    currentSections.some((s) => s.type + "Section" === section);

  // Position of a section type within the current selection (used for the order badge).
  const getIndex = (section) =>
    currentSections.findIndex((s) => s.type + "Section" === section);

  // Handles clicking a section card: toggles it on/off in multi-select mode,
  // or replaces the whole selection with just this section in single-select mode.
  const handleSelection = (section) => {
    if (allowMultiple) {
      setCurrentSections((prev) => {
        console.log(section);
        const exists = prev.some((s) => s.type === section);

        if (exists) {
          // Already selected -> deselect (remove from the list)
          return prev.filter((s) => s.type !== section);
        }

        // Not selected yet -> add as a new section with a fresh id and empty content
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
      // Single-select: selecting a new section always replaces the previous one
      setCurrentSections([
        {
          type: section,
          id: uuidv4(),
          content: {},
        },
      ]);
    }
  };

  // Deep-clone the available section types config so we don't mutate the shared constant.
  let usedSectionType = JSON.parse(JSON.stringify(sectionsTypes));

  return (
    <Box sx={{ mt: 2, p: 2 }}>
      {wrapperName != "markdownPdfWrapper" && (
        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
          {doI18n("pages:core-client_pdf_publisher:layouts", i18nRef.current)}
        </Typography>
      )}
      {/* Helper text shown only in multi-select mode, explaining that order matters */}
      {allowMultiple && (
        <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
          <InfoOutlinedIcon />
          <Box sx={{ display: "flex", flexDirection: "row", gap: "0.3em" }}>
            <Typography>
              {doI18n(
                "pages:core-client_pdf_publisher:multipleSelectionDescription1",
                i18nRef.current,
              )}
            </Typography>
            <Typography sx={{ fontWeight: "bold" }}>
              {doI18n(
                "pages:core-client_pdf_publisher:multipleSelectionDescription2",
                i18nRef.current,
              )}
            </Typography>
            <Typography>
              {doI18n(
                "pages:core-client_pdf_publisher:multipleSelectionDescription3",
                i18nRef.current,
              )}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Iterate over each category of section types available for this wrapper */}
      {usedSectionType?.[wrapperName] &&
        Object.entries({ ...usedSectionType?.[wrapperName] }).map(
          ([name, sections], id) => (
            <Box key={id} sx={{ mt: 2 }}>
              {/* Category heading (e.g. "Text sections", "Media sections", etc.) */}
              <Typography variant="body1">
                {doI18n(
                  `pages:core-client_pdf_publisher:${name}`,
                  i18nRef.current,
                )}
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "row", margin: 2 }}>
                {/* One clickable card per section type in this category */}
                {sections.map((section, id) => (
                  <Badge
                    key={id}
                    // Only show the order badge when multiple selection is allowed
                    invisible={!allowMultiple}
                    // Badge shows the 1-based position of this section in the selection
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
                      onClick={() =>
                        handleSelection(section.replace("Section", ""))
                      }
                      sx={{
                        width: 128,
                        height: 128,
                        mr: 2,
                        cursor: "pointer",
                        transition: "all 0.2s ease",

                        // Visual state changes based on whether this card is selected
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
                            // Look up the icon for this section type;
                            // fall back to a generic info icon (and warn) if none is registered.

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

                          {/* Localized label for this section type */}
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
