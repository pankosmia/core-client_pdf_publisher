import {
  PanDialog,
  i18nContext,
  PanStepperPicker,
  debugContext,
} from "pankosmia-rcl";

import { DialogContent, Box } from "@mui/material";
import { useState, useContext, useEffect, cloneElement } from "react";
import { doI18n } from "pankosmia-lib/i18n";
import { SelectSection } from "./Sections/SelectSection";
import { sectionHandlerLookup } from "../../pdf-gen/sectionHandlerLookup";
import { conversionSection } from "../../pdf-gen/helpers/constants";
import { RessourceSelection } from "./Sections/RessourceSelection";
import { ConfigSection } from "./Sections/ConfigSection";
import { BRangesPicker } from "./Sections/BRangesPicker";
import { getJson } from "pankosmia-lib/http";

let orderOfField = [
  "md",
  "pdf",
  "jxl",
  "translationText",
  "juxta",
  "notes",
  "obs",
  "obsImg",
  "bcvNotes",
  "scriptureSrc",
  "tNotes",
  "string",
  "typeEnum",
  "int",
  "number",
  "typeSpec",
  "boolean",
];

const getOrderIndex = (f) => {
  let idx = orderOfField.indexOf(f.typeName);

  // Config fields are matched by their typeName, or "typeEnum" if applicable
  const key = f.typeEnum ? "typeEnum" : f.typeName;
  idx = orderOfField.indexOf(key);
  if (idx !== -1) return idx;

  const key2 = f.typeSpec ? "typeSpec" : f.typeName;
  idx = orderOfField.indexOf(key2);
  if (idx !== -1) return idx;

  if (idx !== -1) return idx;
  // Anything not listed in orderOfField goes last, in original relative order
  return orderOfField.length;
};

export function ContentDialogue({
  type,
  setWrapper,
  initSection,
  indexSection,
  ButtonToPress,
  wrapperName,
  openFromOutside = 0,
  onCloseFromOutise = null,
}) {
  const { i18nRef } = useContext(i18nContext);
  const { debugRef } = useContext(debugContext);
  const [currentSectionsSignature, setCurrentSectionsSignature] = useState([]);
  const [currentSections, setCurrentSections] = useState([]);
  const [bRanges, setBRanges] = useState([]);
  const [open, setOpen] = useState(false);

  const [isRessourcesStep2Complete, setIsRessourcesStep2Complete] =
    useState(false);
  const [isRessourcesStep3Complete, setIsRessourcesStep3Complete] =
    useState(false);
  const [summary, setSummary] = useState({});

  const steps = [
    doI18n("pages:core-client_pdf_publisher:choose_layout", i18nRef.current),
    doI18n("pages:core-client_pdf_publisher:choose_documents", i18nRef.current),
    doI18n(
      "pages:core-client_pdf_publisher:configure_section",
      i18nRef.current,
    ),
  ];
  useEffect(() => {
    if (openFromOutside >= 1) {
      setOpen(true);
    }
  }, [openFromOutside]);

  const isStepValid = (step) => {
    switch (step) {
      case 0:
        return currentSections.length > 0;
      case 1:
        return isRessourcesStep2Complete;
      case 2:
        return bRanges.length > 0 && isRessourcesStep3Complete;
      default:
        return true;
    }
  };
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
    if (open) {
      if (type === "add") {
        setCurrentSectionsSignature([]);
        setCurrentSections([]);
        setBRanges([]);
      }

      if (type === "edit" && initSection) {
        let initSection_ = JSON.parse(JSON.stringify(initSection));
        setCurrentSections(initSection_.sections);
        setBRanges(initSection_.ranges ?? []);
      }
    }
  }, [open]);

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            {wrapperName === "bcvWrapper" ? (
              <BRangesPicker
                bRanges={bRanges}
                setBRanges={setBRanges}
                currentSections={currentSections}
              />
            ) : (
              <></>
            )}

            <SelectSection
              wrapperName={wrapperName}
              currentSections={currentSections}
              setCurrentSections={setCurrentSections}
            />
          </>
        );
      case 1:
        return (
          <RessourceSelection
            bRanges={bRanges}
            currentSections={currentSections}
            setCurrentSections={setCurrentSections}
            currentSectionsSignature={currentSectionsSignature}
            setIsRessourcesStepComplete={setIsRessourcesStep2Complete}
            summary={summary}
          />
        );
      case 2:
        return (
          <ConfigSection
            summary={summary}
            currentSections={currentSections}
            setCurrentSections={setCurrentSections}
            currentSectionsSignature={currentSectionsSignature}
            setIsRessourcesStepComplete={setIsRessourcesStep3Complete}
          />
        );
      default:
        return null;
    }
  };
  const sortFields = (fields) => {
    return fields
      .map((f, originalIndex) => ({ f, originalIndex }))
      .sort((a, b) => {
        const diff = getOrderIndex(a.f) - getOrderIndex(b.f);
        return diff !== 0 ? diff : a.originalIndex - b.originalIndex;
      })
      .map(({ f }) =>
        f.typeSpec ? { ...f, typeSpec: sortFields(f.typeSpec) } : f,
      );
  };
  useEffect(() => {
    if (currentSections) {
      let signatures = [];
      currentSections.forEach((cs, id) => {
        const sig =
          sectionHandlerLookup[conversionSection[cs.type]].signature();

        const sortedFields = sortFields(sig.fields);

        signatures.push({ ...sig, fields: sortedFields });
      });

      setCurrentSectionsSignature(signatures);
    }
  }, [currentSections]);
  return (
    <Box>
      <>
        {ButtonToPress &&
          cloneElement(ButtonToPress, {
            onClick: () => setOpen(true),
          })}
      </>

      <PanDialog
        fullWidth={true}
        isOpen={open}
        closeFn={() => {
          setOpen(false);
          if (onCloseFromOutise) {
            onCloseFromOutise();
          }
        }}
        size="md"
        titleLabel={
          type === "edit"
            ? doI18n(
                "pages:core-client_pdf_publisher:edit_section",
                i18nRef.current,
              )
            : doI18n(
                "pages:core-client_pdf_publisher:add_section",
                i18nRef.current,
              )
        }
      >
        <DialogContent>
          <PanStepperPicker
            steps={steps}
            isStepValid={isStepValid}
            renderStepContent={renderStepContent}
            primaryButtonVariant="secondary"
            secondaryButtonVariant="secondary"
            primaryActionKey={
              type === "edit"
                ? "pages:core-client_pdf_publisher:edit_section"
                : null
            }
            handleCreate={() => {
              if (type === "edit") {
                setWrapper((prev) => {
                  let newPrev = [...prev];
                  let new_section = {
                    type: "bcvWrapper",
                    ranges: bRanges,
                    sections: [],
                  };
                  currentSections.forEach((n, id) => {
                    new_section.sections.push(n);
                  });
                  newPrev[indexSection] = new_section;
                  return newPrev;
                });
                setOpen(false);
              } else {
                setWrapper((prev) => {
                  let newPrev = [...prev];
                  let new_section = {
                    type: "bcvWrapper",
                    ranges: bRanges,
                    sections: [],
                  };
                  currentSections.forEach((n, id) => {
                    new_section.sections.push(n);
                  });
                  newPrev.push(new_section);
                  return newPrev;
                });
                setCurrentSections([]);
                setCurrentSectionsSignature([]);
                setOpen(false);
                if (onCloseFromOutise) {
                  onCloseFromOutise();
                }
              }
            }}
          />
        </DialogContent>
      </PanDialog>
    </Box>
  );
}
