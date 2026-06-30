import { Box, Card, CardContent, Divider, Typography } from "@mui/material";
import { FieldPicker } from "./FieldPicker/FieldPicker";
import { useContext, useEffect, useState } from "react";
import { getJson } from "pankosmia-lib/http";
import { doI18n } from "pankosmia-lib/i18n";
import { i18nContext } from "pankosmia-rcl";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { iconBySection } from "../../../pdf-gen/helpers/constants";
import { Done, DragIndicator } from "@mui/icons-material";

const allowedConfig = ["boolean", "int", "string", "number"];

const allowedSelected = [
  "md",
  "pdf",
  "jxl",
  "scripture",
  "notes",
  "src",
  "obs",
  "obsImg",
  "lhs",
  "bcvNotes",
  "scriptureSrc",
  "tNotes",
  "glossNotes",
];

const isFieldsValid = (fields, sectionData, isCard) => {
  return fields
    .filter(
      (f) =>
        allowedConfig.includes(f.typeName) ||
        f.typeEnum ||
        f.typeSpec ||
        allowedSelected.includes(f.id),
    )
    .every((f) => {
      if (f.typeSpec) {
        // typeSpec instance arrays always live under .content
        const instances = sectionData?.content?.[f.id];
        const minCount = f?.nValues?.[0] ?? 0;
        if (!Array.isArray(instances) || instances.length < minCount)
          return false;
        // each instance is itself a non-card section: recurse with isCard=false
        return instances.every((inst) =>
          isFieldsValid(f.typeSpec, inst, false),
        );
      }

      const isRequired = f?.nValues?.[0] >= 1;
      if (!isRequired) return true;

      const value = isCard ? sectionData?.content?.[f.id] : sectionData?.[f.id];
      return value !== undefined && value !== null && value !== "";
    });
};

export function ConfigSection({
  currentSectionsSignature,
  currentSections,
  setCurrentSections,
  setIsRessourcesStepComplete,
  summary,
  card = true,
  sectionKey = null,
}) {
  const { i18nRef } = useContext(i18nContext);
  const [lang, setLang] = useState("");

  useEffect(() => {
    async function getLang() {
      let langs = await getJson(`/api/settings/languages`);
      setLang(langs.json[0]);
    }
    getLang();
  }, []);

  useEffect(() => {
    if (card) {
      const allValid = currentSectionsSignature.every((section, sectionIndex) =>
        isFieldsValid(section.fields, currentSections?.[sectionIndex], true),
      );
      setIsRessourcesStepComplete(allValid);
    }
  }, [
    currentSections,
    currentSectionsSignature,
    card,
    setIsRessourcesStepComplete,
  ]);
  const onDragEnd = (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    setCurrentSections((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(sourceIndex, 1);
      copy.splice(destinationIndex, 0, removed);
      return copy;
    });
  };

  const renderSection = (e, id) => {
    return (
      <Box>
        {e.fields
          .filter(
            (f) =>
              allowedConfig.includes(f.typeName) ||
              f.typeEnum ||
              f.typeSpec ||
              allowedSelected.includes(f.id),
          )
          .map((f, ids) => {
            if (f.typeSpec) {
              const nInstances =
                currentSections?.[id]?.content?.[f.id]?.length || 0;
              return Array.from({ length: nInstances }).map((_, i) => {
                const instanceData =
                  currentSections?.[id]?.content?.[f.id]?.[i] ?? {};
                const setInstanceData = (updater) => {
                  setCurrentSections((prev) => {
                    const copy = prev.map((s) => ({ ...s }));
                    if (!copy[id]) copy[id] = {};

                    const fieldArr = [...(copy[id].content?.[f.id] || [])]; // <-- read from .content
                    const prevInstance = fieldArr[i] ?? {};

                    if (typeof updater === "function") {
                      const fakeArr = [prevInstance];
                      const result = updater(fakeArr);
                      fieldArr[i] = result[0];
                    } else {
                      fieldArr[i] = updater[0] ?? updater;
                    }

                    copy[id].content = {
                      ...copy[id].content,
                      [f.id]: fieldArr,
                    };
                    return copy;
                  });
                };

                return (
                  <Box key={i}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        mt: 2,
                        gap: 1,
                      }}
                    >
                      <Typography sx={{ fontWeight: "bold" }}>
                        {f.label[lang]} {i + 1}
                        {":"}
                      </Typography>
                      <Typography>
                        {
                          summary?.[
                            Object.entries(
                              currentSections?.[id]?.content?.[f.id][i],
                            ).find(([k, v]) => allowedSelected.includes(k))[1]
                          ]?.name
                        }
                      </Typography>
                    </Box>

                    <ConfigSection
                      sectionKey={i + 1}
                      currentSectionsSignature={[{ fields: f.typeSpec }]}
                      currentSections={[instanceData]}
                      setCurrentSections={setInstanceData}
                      setIsRessourcesStepComplete={setIsRessourcesStepComplete}
                      summary={summary}
                      card={false}
                    />
                  </Box>
                );
              });
            }

            // Resource fields chosen in the previous step: read-only display only.
            if (allowedSelected.includes(f.id) && !f.typeSpec) {
              const isRequired = f?.nValues?.[0] >= 1;
              const value = currentSections?.[id]?.content?.[f.id];
              return (
                !sectionKey && (
                  <Box
                    key={ids}
                    sx={{
                      mt: 2,
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <Typography sx={{ fontWeight: "bold" }}>
                      {f.label[lang]?.includes("#")
                        ? f.label[lang].replace("#", sectionKey)
                        : f.label[lang]}
                    </Typography>
                    <Typography
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      : {summary?.[value]?.name}
                    </Typography>
                  </Box>
                )
              );
            }
            // Non-typeSpec config field: regular FieldPicker
            return (
              <FieldPicker
                key={ids}
                fieldInfo={f}
                lang={lang}
                currentIndex={sectionKey}
                currentFieldValue={currentSections?.[id]?.[f.id]}
                ChangeInSection={(src) =>
                  setCurrentSections((prev) => {
                    if (card) {
                      let copy = [...prev];
                      copy[id].content = {
                        ...copy[id].content,
                        [f.id]: src,
                      };
                      return copy;
                    } else {
                      let copy = [...prev];
                      copy[id] = { ...copy[id], [f.id]: src };
                      return copy;
                    }
                  })
                }
              />
            );
          })}
      </Box>
    );
  };

  return (
    <Box>
      {card ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="config-sections">
            {(provided) => (
              <Box ref={provided.innerRef} {...provided.droppableProps}>
                {currentSectionsSignature.map((e, id) => {
                  const Icon = iconBySection[e.sectionType + "Section"];
                  return (
                    <Draggable
                      key={`${currentSections[id].id}`}
                      draggableId={`${currentSections[id].id}`}
                      index={id}
                    >
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{ mb: 2 }}
                        >
                          <CardContent>
                            <Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "row",
                                  padding: 2,
                                  gap: 1,
                                }}
                              >
                                <Box
                                  {...provided.dragHandleProps}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    mr: 1,
                                    cursor: "grab",
                                  }}
                                >
                                  <DragIndicator />
                                </Box>
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
                                <Typography sx={{ alignContent: "center" }}>
                                  {doI18n(
                                    `pages:core-client_pdf_publisher:${e.sectionType + "Section"}`,
                                    i18nRef.current,
                                  )}
                                </Typography>
                              </Box>

                              <Divider sx={{ width: "100%" }} />
                              {renderSection(e, id)}
                            </Box>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  );
                })}

                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        currentSectionsSignature.map((e, id) => (
          <Box key={id}>{renderSection(e, id)}</Box>
        ))
      )}
    </Box>
  );
}
