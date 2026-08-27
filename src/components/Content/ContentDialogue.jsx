import {
  PanDialog,
  i18nContext,
  PanStepperPicker,
  debugContext,
} from "pankosmia-rcl";

import { DialogContent, Box } from "@mui/material";
import { useState, useContext, useEffect, cloneElement, useRef } from "react";
import { doI18n } from "pankosmia-lib/i18n";
import { SelectSection } from "./Sections/SelectSection";
import { sectionHandlerLookup } from "../../pdf-gen/sectionHandlerLookup";
import { conversionSection } from "../../pdf-gen/helpers/constants";
import { RessourceSelection } from "./RessourceSelection/RessourceSelection";
import { ConfigSection } from "./Sections/ConfigSection";
import { BRangesPicker } from "./Sections/BRangesPicker";
import { getJson } from "pankosmia-lib/http";
import { ImportDocument, saveFile } from "./RessourceSelection/ImportDocument";
import { enqueueSnackbar } from "notistack";

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

function DifferentWrapperSituationEdit(
  wrapperName,
  setWrapper,
  bRanges,
  currentSections,
  indexSection,
) {
  switch (wrapperName) {
    case "bcvWrapper":
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
      break;
    default:
      let unitSection = currentSections[0];
      setWrapper((prev) => {
        let newPrev = [...prev];
        newPrev[indexSection] = unitSection;
        return newPrev;
      });
  }
}

function DifferentWrapperSituationNew(
  wrapperName,
  setWrapper,
  bRanges,
  currentSections,
) {
  switch (wrapperName) {
    case "bcvWrapper":
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
      break;
    default:
      let unitSection = currentSections[0];
      setWrapper((prev) => {
        let newPrev = [...prev];
        newPrev.push(unitSection);
        return newPrev;
      });
  }
}

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
  const contentRef = useRef(null);
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
    wrapperName === "bcvWrapper"
      ? doI18n("pages:core-client_pdf_publisher:choose_layout", i18nRef.current)
      : doI18n(
          "pages:core-client_pdf_publisher:choose_layout_free_format",
          i18nRef.current,
        ),
    doI18n("pages:core-client_pdf_publisher:choose_documents", i18nRef.current),
    doI18n(
      "pages:core-client_pdf_publisher:configure_section",
      i18nRef.current,
    ),
  ];
  const [documentInfo, setDocumentInfo] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  useEffect(() => {
    if (openFromOutside >= 1) {
      setOpen(true);
    }
  }, [openFromOutside]);

  const isStepValid = (step) => {
    switch (step) {
      case 0:
        if (wrapperName === "bcvWrapper") {
          return currentSections.length > 0 && bRanges.length > 0;
        } else {
          return currentSections.length > 0;
        }
      case 1:
        return isRessourcesStep2Complete;
      case 2:
        return wrapperName === "bcvWrapper"
          ? bRanges.length > 0 && isRessourcesStep3Complete
          : isRessourcesStep3Complete;
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
      if (summariesResponse.ok) {
        setSummary(summariesResponse.json);
      } else {
        enqueueSnackbar(
          doI18n(`pages:core-client_pdf_publisher:errorGet`, i18nRef.current) +
            " /api/burrito/metadata/summaries" +
            `${summariesResponse.status}): ${summariesResponse.error}`,
          { variant: "error" },
        );
      }
    };
    getProjectSummaries();
  }, []);

  useEffect(() => {
    if (open) {
      if (type === "add") {
        setCurrentSectionsSignature([]);
        setCurrentSections([]);
        setBRanges([]);
        setCurrentStep(0);
      }

      if (type === "edit" && initSection) {
        if (wrapperName === "bcvWrapper") {
          let initSection_ = JSON.parse(JSON.stringify(initSection));
          setCurrentSections(initSection_.sections);
          setBRanges(initSection_.ranges ?? []);
        } else {
          let initSection_ = JSON.parse(JSON.stringify(initSection));
          setCurrentSections([initSection_]);
          setBRanges([]);
        }
      }
    }
  }, [open]);
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        setCurrentStep(0);

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
              wrapperName={
                wrapperName === "bcvWrapper"
                  ? wrapperName
                  : "markdownPdfWrapper"
              }
              currentSections={currentSections}
              setCurrentSections={setCurrentSections}
            />
          </>
        );
      case 1:
        setCurrentStep(1);

        return wrapperName === "bcvWrapper" ? (
          <RessourceSelection
            bRanges={bRanges}
            currentSections={currentSections}
            setCurrentSections={setCurrentSections}
            currentSectionsSignature={currentSectionsSignature}
            setIsRessourcesStepComplete={setIsRessourcesStep2Complete}
            summary={summary}
          />
        ) : (
          <ImportDocument
            documentType={currentSections[0].type}
            setIsRessourcesStepComplete={setIsRessourcesStep2Complete}
            setCurrentSections={setCurrentSections}
            currentSections={currentSections}
            setDocumentInfo={setDocumentInfo}
          />
        );
      case 2:
        setCurrentStep(2);
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
        const sig = sectionHandlerLookup[cs.type].signature();

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
        <DialogContent
          sx={{
            overflowY: "auto",
            overflowX: "hidden",
          }}
          ref={contentRef}
        >
          <PanStepperPicker
            steps={steps}
            isStepValid={isStepValid}
            renderStepContent={(step) => {
              if (step === 2) {
                if (documentInfo) {
                  saveFile(
                    documentInfo[0],
                    documentInfo[1],
                    documentInfo[2],
                    documentInfo[3],
                  );
                }
              }
              if (contentRef.current && currentStep != step) {
                contentRef.current.scrollTop = 0;
              }

              return renderStepContent(step);
            }}
            primaryButtonVariant="secondary"
            secondaryButtonVariant="secondary"
            handleClose={() => {
              setOpen(false);
              if (onCloseFromOutise) {
                onCloseFromOutise();
              }
            }}
            primaryActionKey={
              type === "edit"
                ? "pages:core-client_pdf_publisher:edit_section"
                : null
            }
            handleCreate={() => {
              if (type === "edit") {
                DifferentWrapperSituationEdit(
                  wrapperName,
                  setWrapper,
                  bRanges,
                  currentSections,
                  indexSection,
                );
                setOpen(false);
              } else {
                DifferentWrapperSituationNew(
                  wrapperName,
                  setWrapper,
                  bRanges,
                  currentSections,
                );
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
