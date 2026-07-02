import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import AddScriptureModal from "../AddScriptureModal";
import { convertionTypes } from "../../../pdf-gen/helpers/constants";
import { useState, useEffect, useContext } from "react";
import { getJson } from "pankosmia-lib/http";
import { doI18n } from "pankosmia-lib/i18n";
import { debugContext, i18nContext } from "pankosmia-rcl";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { iconBySection } from "../../../pdf-gen/helpers/constants";
import { Delete, DragIndicator } from "@mui/icons-material";
import {
  checkPathBooks,
  checkPathsSections,
} from "../../RessourcesChecker/checkSpecs";
import { InfoRessource } from "../../RessourcesChecker/InfoRessource";
import { typeThatNeedRessourceSelection } from "../../../pdf-gen/helpers/constants";

const isFieldsValid = (fields, sectionData, isCard) => {
  return fields
    .filter((f) => typeThatNeedRessourceSelection.includes(f.id))
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

export function RessourceSelection({
  currentSectionsSignature,
  currentSections,
  setCurrentSections,
  setIsRessourcesStepComplete,
  bRanges,
  summary,
  card = true,
  sectionKey = null,
}) {
  let { debugRef } = useContext(debugContext);
  let { i18nRef } = useContext(i18nContext);
  const [instanceCounts, setInstanceCounts] = useState({});

  const getInstanceCount = (sectionId, fieldId, defaultCount) =>
    instanceCounts[`${sectionId}-${fieldId}`] ?? defaultCount;

  const removeInstanceAt = (sectionId, fieldId, index, minCount) => {
    setCurrentSections((prev) => {
      const copy = prev.map((s) => ({ ...s }));
      if (!copy[sectionId]) return prev;
      const fieldArr = [...(copy[sectionId][fieldId] || [])];
      if (
        minCount !== undefined &&
        minCount !== null &&
        fieldArr.length <= minCount
      ) {
        return prev; // already at the floor, do nothing
      }
      fieldArr.splice(index, 1);
      copy[sectionId] = { ...copy[sectionId], [fieldId]: fieldArr };
      return copy;
    });

    setInstanceCounts((prev) => {
      const key = `${sectionId}-${fieldId}`;
      const current = prev[key] ?? 1;
      if (minCount !== undefined && minCount !== null && current <= minCount) {
        return prev;
      }
      return { ...prev, [key]: current - 1 };
    });
  };
  // Seed instanceCounts with the real default count for every typeSpec field
  // on first render (and whenever the signature changes), so increments
  // always start from the correct base instead of an undefined/wrong value.
  useEffect(() => {
    setInstanceCounts((prev) => {
      const next = { ...prev };
      let changed = false;
      currentSectionsSignature.forEach((section, sectionId) => {
        section.fields
          .filter(
            (f) => typeThatNeedRessourceSelection.includes(f.id) && f.typeSpec,
          )
          .forEach((f) => {
            const key = `${sectionId}-${f.id}`;
            // Only seed if we don't already have a tracked count for this
            // key in this mount's lifetime. Never shrink/overwrite an
            // existing local count — that's what was eating still-empty
            // instances as soon as an earlier instance got filled in.
            if (next[key] !== undefined) return;

            const existingArr = currentSections?.[sectionId]?.[f.id];
            const existingCount = Array.isArray(existingArr)
              ? existingArr.length
              : 0;
            const defaultCount = f?.nValues?.[0] ?? 1;

            // Restore at least as many slots as there's data for, but
            // never fewer than the field's own default/minimum.
            next[key] = Math.max(existingCount, defaultCount);
            changed = true;
          });
      });
      return changed ? next : prev;
    });
  }, [currentSectionsSignature, currentSections]);
  const incrementInstanceCount = (sectionId, fieldId, maxCount) => {
    setInstanceCounts((prev) => {
      const key = `${sectionId}-${fieldId}`;
      const current = prev[key] ?? 1;
      if (maxCount !== undefined && maxCount !== null && current >= maxCount) {
        return prev; // already at the cap, do nothing
      }
      return { ...prev, [key]: current + 1 };
    });
  };
  const [lang, setlang] = useState("");
  useEffect(() => {
    async function getLang() {
      let langs = await getJson(`/api/settings/languages`);
      setlang(langs.json[0]);
    }
    getLang();
  }, []);

  useEffect(() => {
    if (card) {
      let allValid = currentSectionsSignature.every((section, sectionIndex) =>
        isFieldsValid(section.fields, currentSections?.[sectionIndex], true),
      );
      allValid =
        allValid &&
        checkPathsSections(
          summary,
          currentSections,
          typeThatNeedRessourceSelection,
        ) &&
        checkPathBooks(
          summary,
          currentSections,
          bRanges,
          typeThatNeedRessourceSelection,
        );

      setIsRessourcesStepComplete(allValid);
    }
  }, [
    currentSections,
    currentSectionsSignature,
    card,
    setIsRessourcesStepComplete,
    bRanges,
  ]);

  useEffect(() => {
    if (currentSections && summary) {
      let book = [];
      currentSections.forEach((r) => {
        let ressources = Object.entries(r).filter(([k, v]) =>
          typeThatNeedRessourceSelection.includes(k),
        );
        ressources.forEach(([k, v]) => {
          if (typeof v === typeof []) {
            v.forEach((r2) => {
              let inRessources = Object.entries(r2).filter(([k2, v2]) =>
                typeThatNeedRessourceSelection.includes(k2),
              );
              inRessources.forEach(([k2, v2]) => {
                book.push(summary?.[v2]?.book_codes);
              });
            });
          } else {
            book.push(summary?.[v]?.book_codes);
          }
        });
      });
      if (book.length > 0) {
        const result = book.reduce((acc, curr) =>
          acc.filter((item) => curr.includes(item)),
        );
      }
    }
  }, [summary, currentSections]);

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
    console.log(
      e.fields.filter((f) => typeThatNeedRessourceSelection.includes(f.id)),
    );
    return (
      <Box key={id}>
        {e.fields
          .filter((f) => typeThatNeedRessourceSelection.includes(f.id))
          .map((f, ids) => {
            const isRequired = f?.nValues[0] >= 1;
            if (f.typeSpec) {
              const defaultInstances = f?.nValues?.[0] ?? 1;
              const nInstances = getInstanceCount(id, f.id, defaultInstances);
              const maxCount = f?.nValues?.[1];
              const atMax =
                maxCount !== undefined &&
                maxCount !== null &&
                nInstances >= maxCount;

              return (
                <Box key={ids}>
                  {Array.from({ length: nInstances }).map((_, i) => {
                    // Read/write this instance's data from currentSections[id][f.id][i]
                    const instanceData =
                      currentSections?.[id]?.content?.[f.id]?.[i] ?? {};
                    const minCount = f?.nValues?.[0] ?? 0;

                    const canRemove = i >= minCount;
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
                      <Box
                        key={i}
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "flex-start",
                        }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            display: "flex",
                            justifyContent: "center",
                            pt: 1,
                            flexShrink: 0,
                          }}
                        >
                          {canRemove && (
                            <IconButton
                              size="small"
                              onClick={() =>
                                removeInstanceAt(id, f.id, i, minCount)
                              }
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          )}
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <RessourceSelection
                            key={i}
                            bRanges={bRanges}
                            sectionKey={i}
                            currentSectionsSignature={[{ fields: f.typeSpec }]}
                            currentSections={[instanceData]}
                            setCurrentSections={setInstanceData}
                            setIsRessourcesStepComplete={
                              setIsRessourcesStepComplete
                            }
                            card={false}
                            summary={summary}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                  <Button
                    disabled={atMax}
                    onClick={() => incrementInstanceCount(id, f.id, maxCount)}
                  >
                    <Typography>
                      {doI18n(
                        `pages:core-client_pdf_publisher:Add`,
                        i18nRef.current,
                      ) + ` ${f.label[lang]}`}
                    </Typography>
                  </Button>
                </Box>
              );
            } else {
              return (
                <Box
                  key={ids}
                  sx={{
                    m: 2,
                    gap: 2,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography sx={{ fontWeight: "bold" }}>
                    {f.label[lang]?.includes("#")
                      ? f.label[lang].replace("#", sectionKey + 1)
                      : f.label[lang]}
                    {isRequired && (
                      <span style={{ color: "black", marginLeft: 4 }}>*</span>
                    )}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      {(() => {
                        const selectedId = card
                          ? currentSections?.[id]?.["content"]?.[f.id]
                          : currentSections?.[id]?.[f.id];

                        return selectedId ? (
                          <Typography
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            {/* {summary?.[selectedId]?.name} */}
                            <InfoRessource
                              summary={summary}
                              pathElem={selectedId}
                              flavors={convertionTypes[f.id]}
                              bRanges={bRanges}
                              i18nRef={i18nRef}
                            />
                          </Typography>
                        ) : (
                          <Typography>
                            {doI18n(
                              `pages:core-client_pdf_publisher:selectRessource`,
                              i18nRef.current,
                            )}
                            {isRequired && (
                              <span style={{ color: "black", marginLeft: 4 }}>
                                *
                              </span>
                            )}
                          </Typography>
                        );
                      })()}
                    </Box>

                    <Box sx={{ ml: "auto" }}>
                      <AddScriptureModal
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
                        type={convertionTypes[f.id]}
                      />
                    </Box>
                  </Box>
                </Box>
              );
            }
          })}
      </Box>
    );
  };

  return (
    <Box>
      {card ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="resources-sections">
            {(provided) => (
              <Box ref={provided.innerRef} {...provided.droppableProps}>
                {currentSectionsSignature.map((e, id) => {
                  console.log(e.sectionType + "Section")
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
