import { Box, Card, CardContent, Typography } from "@mui/material";
import { FieldPicker } from "./FieldPicker/FieldPicker";
import { useEffect, useState } from "react";
import { getJson } from "pithekos-lib";

const allowedConfig = ["boolean", "int", "string"];

export function ConfigSection({
  currentSectionsSignature,
  currentSections,
  setCurrentSections,
  setIsRessourcesStepComplete,
  card = true,
}) {
  const [lang, setLang] = useState("");

  useEffect(() => {
    async function getLang() {
      let langs = await getJson(`/api/settings/languages`);
      setLang(langs.json[0]);
    }
    getLang();
  }, []);

  useEffect(() => {
    const allValid = currentSectionsSignature.every((section, sectionIndex) => {
      return section.fields
        .filter(
          (f) => allowedConfig.includes(f.typeName) || f.typeEnum || f.typeSpec,
        )
        .every((f) => {
          const isRequired = f?.nValues?.[0] >= 1;
          if (!isRequired) return true;
          const value = currentSections?.[sectionIndex]?.[f.id];
          return value !== undefined && value !== null && value !== "";
        });
    });
    setIsRessourcesStepComplete(allValid);
  }, [currentSections, currentSectionsSignature, setIsRessourcesStepComplete]);

  return (
    <Box>
      {currentSectionsSignature.map((e, id) => {
        const Wrapper = card ? Card : Box;
        const ContentWrapper = card ? CardContent : Box;
        return (
          <Wrapper sx={{ mt: 2 }} key={id}>
            <ContentWrapper>
              {card && <Typography>Name section</Typography>}
              {e.fields
                .filter(
                  (f) =>
                    allowedConfig.includes(f.typeName) ||
                    f.typeEnum ||
                    f.typeSpec,
                )
                .map((f, ids) => {
                  if (f.typeSpec) {
                    const nInstances = f?.nValues?.[0] ?? 1;

                    return Array.from({ length: nInstances }).map((_, i) => {
                      const instanceData =
                        currentSections?.[id]?.[f.id]?.[i] ?? {};

                      const setInstanceData = (updater) => {
                        setCurrentSections((prev) => {
                          const copy = prev.map((s) => ({ ...s }));
                          if (!copy[id]) copy[id] = {};

                          const fieldArr = [...(copy[id][f.id] || [])];
                          const prevInstance = fieldArr[i] ?? {};

                          if (typeof updater === "function") {
                            const fakeArr = [{ ...prevInstance }];
                            const result = updater(fakeArr);
                            fieldArr[i] = { ...prevInstance, ...result[0] };
                          } else {
                            fieldArr[i] = {
                              ...prevInstance,
                              ...(updater[0] ?? updater),
                            };
                          }

                          copy[id] = { ...copy[id], [f.id]: fieldArr };
                          return copy;
                        });
                      };

                      return (
                        <Box key={i}>
                          <Typography sx={{ fontWeight: "bold", mt: 2 }}>
                            {f.label[lang]} {i + 1}
                          </Typography>
                          <ConfigSection
                            currentSectionsSignature={[{ fields: f.typeSpec }]}
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
                  }

                  // Non-typeSpec: regular FieldPicker
                  return (
                    <FieldPicker
                      key={ids}
                      fieldInfo={f}
                      lang={lang}
                      currentFieldValue={currentSections?.[id]?.[f.id]}
                      ChangeInSection={(src) =>
                        setCurrentSections((prev) => {
                          const copy = [...prev];
                          copy[id] = { ...copy[id], [f.id]: src };
                          return copy;
                        })
                      }
                    />
                  );
                })}
            </ContentWrapper>
          </Wrapper>
        );
      })}
    </Box>
  );
}
