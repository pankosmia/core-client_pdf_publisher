import { PanDialog, i18nContext, PanStepperPicker } from "pankosmia-rcl";

import { DialogContent, Box } from "@mui/material";
import { useState, useContext, useEffect, cloneElement } from "react";
import { doI18n } from "pithekos-lib";
import { SelectSection } from "./Sections/SelectSection";
import { sectionHandlerLookup } from "../../pdf-gen/sectionHandlerLookup";
import { conversionSection } from "../../pdf-gen/helpers/constants";
import { RessourceSelection } from "./Sections/RessourceSelection";
import { ConfigSection } from "./Sections/ConfigSection";
import { BRangesPicker } from "./Sections/BRangesPicker";

export function ContentDialogue({
  type,
  setWrapper,
  initSection,
  indexSection,
  ButtonToPress,
}) {
  const { i18nRef } = useContext(i18nContext);

  const [currentSectionsSignature, setCurrentSectionsSignature] = useState([]);
  const [currentSections, setCurrentSections] = useState([]);
  const [bRanges, setBRanges] = useState([]);
  const [open, setOpen] = useState(false);

  const [isRessourcesStep2Complete, setIsRessourcesStep2Complete] =
    useState(false);
  const [isRessourcesStep3Complete, setIsRessourcesStep3Complete] =
    useState(false);

  const steps = [
    doI18n("pages:core-client_pdf_publisher:choose_layout", i18nRef.current),
    doI18n("pages:core-client_pdf_publisher:choose_documents", i18nRef.current),
    doI18n(
      "pages:core-client_pdf_publisher:configure_section",
      i18nRef.current,
    ),
  ];
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
  console.log(currentSections);

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
            <BRangesPicker
              bRanges={bRanges}
              setBRanges={setBRanges}
              currentSections={currentSections}
            />
            <SelectSection
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
          />
        );
      case 2:
        return (
          <ConfigSection
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

  useEffect(() => {
    if (currentSections) {
      let signatures = [];
      currentSections.forEach((cs, id) => {
        signatures.push(
          sectionHandlerLookup[conversionSection[cs.type]].signature(),
        );
      });

      setCurrentSectionsSignature(signatures);
    }
  }, [currentSections]);

  return (
    <Box>
      <>
        {cloneElement(ButtonToPress, {
          onClick: () => setOpen(true),
        })}
      </>

      <PanDialog
        fullWidth={true}
        isOpen={open}
        closeFn={() => setOpen(false)}
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
              }
            }}
          />
        </DialogContent>
      </PanDialog>
    </Box>
  );
}
