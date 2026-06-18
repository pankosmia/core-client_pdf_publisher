import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import AddScriptureModal from "../AddScriptureModal";
import { convertionTypes } from "../../../pdf-gen/helpers/constants";
import { useState, useEffect, useContext } from "react";
import { getJson } from "pithekos-lib";
import { debugContext, i18nContext } from "pankosmia-rcl";
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
];

export function RessourceSelection({
  currentSectionsSignature,
  currentSections,
  setCurrentSections,
  setIsRessourcesStepComplete,
  bRanges,
  card = true,
}) {
  let { debugRef } = useContext(debugContext);
  let { i18nRef } = useContext(i18nContext);
  const [lang, setlang] = useState("");
  const [typeSpec, setTypeSpec] = useState([{}]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const getProjectSummaries = async () => {
      let summariesResponse = await getJson(
        "/api/burrito/metadata/summaries",
        debugRef.current,
      );
      setSummary(summariesResponse.json);
    };
    getProjectSummaries();
  }, []);
  useEffect(() => {
    async function getLang() {
      let langs = await getJson(`/api/settings/languages`);
      setlang(langs.json[0]);
    }
    getLang();
  }, []);
  useEffect(() => {
    const allValid = currentSectionsSignature.every((section, sectionIndex) => {
      return section.fields
        .filter((f) => allowedSelected.includes(f.id))
        .every((f) => {
          const isRequired = f?.nValues?.[0] >= 1;
          if (!isRequired) return true;
          const value = currentSections?.[sectionIndex]?.[f.id];
          return value !== undefined && value !== null && value !== "";
        });
    });

    setIsRessourcesStepComplete(allValid);
  }, [currentSectionsSignature, setIsRessourcesStepComplete]);

  useEffect(() => {
    if (currentSections && summary) {
      let book = [];
      currentSections.forEach((r) => {
        let ressources = Object.entries(r).filter(([k, v]) =>
          allowedSelected.includes(k),
        );
        ressources.forEach(([k, v]) => {
          if (typeof v === typeof []) {
            v.forEach((r2) => {
              let inRessources = Object.entries(r2).filter(([k2, v2]) =>
                allowedSelected.includes(k2),
              );
              inRessources.forEach(([k2, v2]) => {
                book.push(summary[v2].book_codes);
              });
            });
          } else {
            book.push(summary[v].book_codes);
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
  return (
    <Box>
      {currentSectionsSignature.map((e, id) => {
        const Wrapper = card ? Card : Box;
        const ContentWrapper = card ? CardContent : Box;
        return (
          <Wrapper sx={{ mt: 2 }} key={id}>
            <ContentWrapper>
              <Box>
                {e.fields
                  .filter((f) => allowedSelected.includes(f.id))
                  .map((f, ids) => {
                    const isRequired = f?.nValues[0] >= 1;
                    if (f.typeSpec) {
                      const nInstances = f?.nValues?.[0] ?? 1;

                      return Array.from({ length: nInstances }).map((_, i) => {
                        // Read/write this instance's data from currentSections[id][f.id][i]
                        const instanceData =
                          currentSections?.[id]?.[f.id]?.[i] ?? {};

                        const setInstanceData = (updater) => {
                          setCurrentSections((prev) => {
                            const copy = prev.map((s) => ({ ...s }));
                            if (!copy[id]) copy[id] = {};

                            const fieldArr = [...(copy[id][f.id] || [])];
                            const prevInstance = fieldArr[i] ?? {};

                            // Child calls setCurrentSections(prev => { let copy = [...prev]; copy[0][f.id] = src; return copy })
                            // So we simulate that: pass [prevInstance] as the "prev", get back the updated array, take index 0
                            if (typeof updater === "function") {
                              const fakeArr = [prevInstance];
                              const result = updater(fakeArr);
                              fieldArr[i] = result[0];
                            } else {
                              fieldArr[i] = updater[0] ?? updater;
                            }

                            copy[id] = { ...copy[id], [f.id]: fieldArr };
                            return copy;
                          });
                        };

                        return (
                          <Box>
                            <Typography sx={{ fontWeight: "bold" }}>
                              {f.label[lang]} {i + 1}
                            </Typography>
                            <RessourceSelection
                              key={i}
                              currentSectionsSignature={[
                                { fields: f.typeSpec },
                              ]}
                              currentSections={[instanceData]}
                              setCurrentSections={setInstanceData}
                              setIsRessourcesStepComplete={
                                setIsRessourcesStepComplete
                              }
                              card={false}
                            />
                          </Box>
                        );
                      });
                    } else {
                      return (
                        <Box
                          key={ids}
                          sx={{
                            m: 2,
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <Typography>
                            {f.label[lang]}
                            {isRequired && (
                              <span style={{ color: "red", marginLeft: 4 }}>
                                *
                              </span>
                            )}
                            {currentSections?.[id]?.[f.id]
                              ? ` : ${currentSections[id][f.id]}`
                              : ``}
                          </Typography>
                          <Box sx={{ ml: "auto" }}>
                            <AddScriptureModal
                              ChangeInSection={(src) =>
                                setCurrentSections((prev) => {
                                  let copy = [...prev];
                                  copy[id][f.id] = src;
                                  return copy;
                                })
                              }
                              type={convertionTypes[f.id]}
                            />
                          </Box>
                        </Box>
                      );
                    }
                  })}
              </Box>
            </ContentWrapper>
          </Wrapper>
        );
      })}
    </Box>
  );
}
