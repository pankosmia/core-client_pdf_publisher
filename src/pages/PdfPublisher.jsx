import { useState, useEffect, useContext, useRef } from "react";
// import {PdfGen} from "jxl-pdf"
import { getJson, postJson } from "pankosmia-lib/http";
import { doI18n } from "pankosmia-lib/i18n";
import deepEqual from "deep-equal";
import "react-pdf/dist/Page/TextLayer.css";
import { originatePdfs } from "../pdf-gen/originatePdfs";
import { assemblePdfs } from "../pdf-gen/assemblePdf";
import pages from "../pdf-gen/Css/Ressources/pages.json";
import fonts from "../pdf-gen/Css/Ressources/fonts.json";
import sizes from "../pdf-gen/Css/Ressources/sizes.json";
import { setupCSS } from "../pdf-gen/doCss";
import {
  Button,
  Box,
  Grid,
  AppBar,
  Typography,
  Divider,
  IconButton,
  AccordionSummary,
  Accordion,
  AccordionDetails,
  Chip,
  Tooltip,
  CircularProgress,
  DialogContent,
  DialogContentText,
} from "@mui/material";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { SelectOption } from "../components/SelectOptions";
import EditIcon from "@mui/icons-material/Edit";
import {
  i18nContext,
  Header,
  currentProjectContext,
  debugContext,
  PanDialog,
  PanDialogActions,
} from "pankosmia-rcl";
import { ContentDialogue } from "../components/Content/ContentDialogue";
import { Delete, DragIndicator, ExpandMore, Save } from "@mui/icons-material";
import ArrowLeft from "../components/utils/arrow";
import { sectionHandlerLookup } from "../pdf-gen/sectionHandlerLookup";
import FloatingTextMenu from "../components/SpeedDial/FloatingTextMenu";
import FirefoxInstaller from "../components/FirefoxInstaller";
import { useSnackbar } from "notistack";
import {
  checkPathBooks,
  checkPathsSections,
} from "../components/RessourcesChecker/checkSpecs";
import { typeThatNeedRessourceSelection } from "../pdf-gen/helpers/constants";
import { BcvWrapperOverview } from "../components/Overview/BcvWrapperOverview";
import { FreeFormatOverview } from "../components/Overview/FreeFormatOverview";

function countSteps(specs) {
  let numberSteps = 0;
  specs.sections.forEach((s) => {
    if (s.type === "bcvWrapper") {
      s.ranges.forEach((r) => {
        s.sections.forEach((ss) => {
          numberSteps += 2; // for creating & assembling
        });
      });
    } else {
      numberSteps += 2;
    }
  });
  numberSteps += 3;

  return numberSteps;
}

export function PdfPublisher() {
  const { debugRef } = useContext(debugContext);
  const { i18nRef } = useContext(i18nContext);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { currentProjectRef } = useContext(currentProjectContext);
  // fake selected project
  const [messageSnackbar, setMessageSnackbar] = useState("this message");
  const [projectSummaries, setProjectSummaries] = useState({});
  const [headerInfo, setHeaderInfo] = useState(null);
  const [wrappers, setWrappers] = useState([]);
  const [lang, setlang] = useState("");
  const [fontFamilyCorrespondance, setFontFamilyCorrespondance] =
    useState(null);
  const [projectSpecs, setProjectSpecs] = useState(null);

  const [numberOfStepsToValidate, setNumberOfStepsToValidate] = useState(0);
  const [currentNumberOfStepsValidated, setCurrentNumberOfStepsValidated] =
    useState(0);
  const [disablePrintButton, setDisablePrintButton] = useState(false);
  const [firefoxModalOpen, setFirefoxModalOpen] = useState(false);

  const { printButtonRef } = useRef(null);
  const hash = window.location.hash;
  const query = hash.includes("?") ? hash.split("?") : "";
  const typePageQuery = new URLSearchParams(query[1]);
  const returnType = typePageQuery.get("returnTypePage");
  useEffect(() => {
    const isElectron = !!window.electronAPI;
    if (isElectron) {
      if (
        !(
          !projectSpecs ||
          deepEqual(projectSpecs, {
            global: JSON.parse(headerInfo),
            sections: wrappers,
          })
        )
      ) {
        window.electronAPI.setCanClose(false);
      } else {
        window.electronAPI.setCanClose(true);
      }
    }
  }, [projectSpecs, headerInfo, wrappers]);
  useEffect(() => {
    window?.electronAPI?.checkFirefoxInstalled().then((installed) => {
      setFirefoxModalOpen(installed ? false : true);
    });
  }, [firefoxModalOpen]);

  const handleClose = () => {
    window?.electronAPI?.checkFirefoxInstalled().then((installed) => {
      if (installed) {
        setFirefoxModalOpen(false);
      } else {
        if (returnType === "dashboard") {
          setTimeout(() => {
            window.location.href = "/clients/main";
          });
        } else {
          setTimeout(() => {
            window.location.href = "/clients/content";
          });
        }
      }
    });
  };

  useEffect(() => {
    async function getSpecs() {
      if (currentProjectRef.current) {
        let ingredients = await getJson(
          `/api/burrito/paths/${currentProjectRef.current.organization}/${currentProjectRef.current.source}/${currentProjectRef.current.project}`,
        );
        if (ingredients.ok) {
          if (ingredients.json.includes("specs.json")) {
            let response = await getJson(
              `/api/burrito/ingredient/raw/${currentProjectRef.current.organization}/${currentProjectRef.current.source}/${currentProjectRef.current.project}?ipath=specs.json`,
            );
            if (response.ok) {
              let sections = response.json.sections;

              setProjectSpecs({ ...response.json, sections: sections });
            } else {
              setProjectSpecs({
                global: {
                  sizes: "9on11",
                  fonts: "allGentium",
                  pages: "A4P",
                  verbose: false,
                },
                sections: [],
              });
              enqueueSnackbar(
                doI18n(
                  `pages:core-client_pdf_publisher:errorGet`,
                  i18nRef.current,
                ) +
                  ` /api/burrito/ingredient/raw/${currentProjectRef.current.organization}/${currentProjectRef.current.source}/${currentProjectRef.current.project}?ipath=specs.json` +
                  `${response.status}): ${response.error}`,
                { variant: "error" },
              );
            }
          } else {
            setProjectSpecs({
              global: {
                sizes: "9on11",
                fonts: "allGentium",
                pages: "A4P",
                verbose: false,
              },
              sections: [],
            });
          }
        } else {
          enqueueSnackbar(
            doI18n(
              `pages:core-client_pdf_publisher:errorGet`,
              i18nRef.current,
            ) +
              `/api/burrito/paths/${currentProjectRef.current.organization}/${currentProjectRef.current.source}/${currentProjectRef.current.project}` +
              `${response.status}): ${response.error}`,
            { variant: "error" },
          );
        }
      }
    }
    getSpecs();
  }, [currentProjectRef.current]);

  useEffect(() => {
    if (projectSpecs) {
      setWrappers(projectSpecs.sections);
      setHeaderInfo(JSON.stringify(projectSpecs.global));
    } else {
      setHeaderInfo(
        '{"sizes":"9on11","fonts":"allGentium","pages":"EXECUTIVE", "verbose":false}',
      );
    }
  }, [projectSpecs]);

  useEffect(() => {
    let cores = {};
    document.fonts.ready.then(() => {
      document.fonts.forEach((f) => {
        const cleanFamily = f.family
          .replace(/['"]/g, "") // remove quotes " or '
          .trim() // remove leading/trailing spaces
          .replace(/\s+/g, " "); // normalize multiple spaces
        cores[cleanFamily.replaceAll(" ", "")] = cleanFamily;
      });

      setFontFamilyCorrespondance(cores);
    });
  }, []);

  const jsonWithHeaderChoice = {
    pages: Object.entries(pages).map(([key, value]) => ({
      value: key,
      label: value.label.en,
    })),
    sizes: Object.entries(sizes).map(([key, value]) => ({
      value: key,
      label: value.label.en,
    })),
    verbose: [true, false],
  };

  async function PrintPdf() {
    setDisablePrintButton(true);
    let header = JSON.parse(headerInfo);
    let font = await getJson("/api/settings/typography/");
    if (font.ok) {
      let newFont = {};
      let fontArray = font.json.font_set
        .replace("fonts-", "")
        .split("Pankosmia")
        .slice(1)
        .map((e) => "Pankosmia" + e)
        .map((f) => fontFamilyCorrespondance[f]);
      Object.entries(fonts[header.fonts]).forEach(([k, v]) => {
        newFont[k] = fontArray;
      });
      const config = {
        global: header,
        sections: wrappers,
      };
      const options = {
        verbose: config.global.verbose,
        steps: ["originate", "assemble"],
        pageFormat: pages[config.global.pages],
        fonts: newFont,
        fontFamily: fontArray,
        fontSizes: sizes[config.global.sizes],
        referencePunctuation: config.global.referencePunctuation || {
          bookChapter: " ",
          chapterVerse: ":",
          verseRange: "-",
        },
        configContent: config,
        cssLookUp: null,
      };

      let cssLookUp = await setupCSS({
        pageFormat: options.pageFormat,
        fonts: options.fonts,
        fontSizes: options.fontSizes,
      });
      options.cssLookUp = cssLookUp;

      const totalSteps = countSteps(config);

      function doPdfCallback(e) {
        if (e.level <= 2) {
          setCurrentNumberOfStepsValidated((prev) => {
            const next = prev + 1;
            setMessageSnackbar(
              doI18n("pages:core-client_pdf_publisher:step", i18nRef.current)
                .replace("##CURRENT##", next)
                .replace("##GLOBAL##", totalSteps),
            );

            return next;
          });
        }
      }
      setNumberOfStepsToValidate(totalSteps);
      let manifest = await originatePdfs(options, doPdfCallback, i18nRef);
      await assemblePdfs(options, doPdfCallback, manifest);
      setNumberOfStepsToValidate(0);
      setCurrentNumberOfStepsValidated(0);
      enqueueSnackbar(
        doI18n(`pages:core-client_pdf_publisher:print_succes`, i18nRef.current),
        { variant: "success" },
      );
    } else {
      enqueueSnackbar(
        doI18n(`pages:core-client_pdf_publisher:errorGet`, i18nRef.current) +
          ` /api/settings/typography/` +
          `${font.status}): ${font.error}`,
        { variant: "error" },
      );
    }
    setDisablePrintButton(false);
  }

  useEffect(() => {
    const getProjectSummaries = async () => {
      const summariesResponse = await getJson(
        "/api/burrito/metadata/summaries",
        debugRef.current,
      );
      if (summariesResponse.ok) {
        setProjectSummaries(summariesResponse.json);
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
    async function getLang() {
      let langs = await getJson(`/api/settings/languages`);
      if (langs.ok) {
        setlang(langs.json[0]);
      } else {
        enqueueSnackbar(
          doI18n(`pages:core-client_pdf_publisher:errorGet`, i18nRef.current) +
            " /api/settings/languages" +
            `${langs.status}): ${langs.error}`,
          { variant: "error" },
        );
      }
    }
    getLang();
  }, []);
  const handleChangeHeaderInfo = (type, value) => {
    const data = JSON.parse(headerInfo);
    data[type] = value;
    setHeaderInfo(JSON.stringify(data));
  };
  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const remove = (index) => {
    setWrappers((prev) => prev.filter((_, i) => i !== index));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const newOrder = reorder(
      wrappers,
      result.source.index,
      result.destination.index,
    );

    setWrappers(newOrder);
  };
  return (
    <Box>
      <PanDialog
        titleLabel={doI18n(
          `pages:core-client_pdf_publisher:Firefox_not_installed`,
          i18nRef.current,
        )}
        isOpen={firefoxModalOpen}
        closeFn={() => setFirefoxModalOpen(false)}
        size="sm"
      >
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {doI18n(
              `pages:core-client_pdf_publisher:need_firefox`,
              i18nRef.current,
            )}
          </DialogContentText>
          <FirefoxInstaller />
        </DialogContent>
        <PanDialogActions
          onlyCloseButton
          closeFn={() => handleClose()}
          closeLabel="Close"
        />
      </PanDialog>
      <Header
        titleKey={`${doI18n("pages:core-client_pdf_publisher:title", i18nRef.current)}`}
        currentId="core-contenthandler_text_translation"
        requireNet={false}
      />
      <AppBar
        position="static"
        sx={{ backgroundColor: "#f5f5f5", marginBottom: 2 }}
      ></AppBar>
      <Box sx={{ height: 48 }}>
        <IconButton
          disabled={
            !projectSpecs ||
            deepEqual(projectSpecs, {
              global: JSON.parse(headerInfo),
              sections: wrappers,
            })
          }
          onClick={async () => {
            const body = {
              payload: JSON.stringify(
                {
                  global: JSON.parse(headerInfo),
                  sections: wrappers,
                },
                null,
                2,
              ),
            };
            let response = await postJson(
              `/api/burrito/ingredient/raw/${currentProjectRef.current.organization}/${currentProjectRef.current.source}/${currentProjectRef.current.project}?ipath=specs.json`,
              JSON.stringify(body),
            );
            if (response.ok) {
              setProjectSpecs({
                global: JSON.parse(headerInfo),
                sections: wrappers,
              });
              enqueueSnackbar(
                doI18n(
                  `pages:core-client_pdf_publisher:save_success`,
                  i18nRef.current,
                ),
                { variant: "success" },
              );
            } else {
              enqueueSnackbar(
                doI18n(
                  `pages:core-client_pdf_publisher:save_error`,
                  i18nRef.current,
                ) + response.error,
                { variant: "error" },
              );
            }
          }}
          sx={{
            pl: 2,
            alignSelf: "center",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Save />
        </IconButton>

        <Divider />
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "2fr 10fr",
          width: "100%",
          padding: 5,
          alignItems: "start",
          height: "calc(100vh - 112px)",
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: "bold", pb: 2 }} variant="subtitle2">
            {doI18n(
              `pages:core-client_pdf_publisher:general_setting`,
              i18nRef.current,
            )}
          </Typography>

          <Box sx={{ marginBottom: 2 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2, // adjust spacing here
              }}
            >
              {headerInfo && (
                <SelectOption
                  title="Paper size"
                  type="pages"
                  selected={JSON.parse(headerInfo).pages}
                  option={jsonWithHeaderChoice.pages}
                  handleChange={handleChangeHeaderInfo}
                />
              )}
              {headerInfo && (
                <SelectOption
                  title="Font size"
                  type="sizes"
                  selected={JSON.parse(headerInfo).sizes}
                  option={jsonWithHeaderChoice.sizes}
                  handleChange={handleChangeHeaderInfo}
                />
              )}
            </Box>
          </Box>
        </Box>
        <Box>
          <Typography sx={{ fontWeight: "bold", pb: 2 }} variant="subtitle2">
            {doI18n(
              `pages:core-client_pdf_publisher:pdf_sections`,
              i18nRef.current,
            )}
          </Typography>
          <Box sx={{ overflowY: "auto", maxHeight: "calc(100vh - 202px)" }}>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="wrappers">
                {(provided) => (
                  <Box {...provided.droppableProps} ref={provided.innerRef}>
                    {wrappers.map((w, id) => (
                      <Draggable
                        key={w.id || id}
                        draggableId={(w.id || id).toString()}
                        index={id}
                      >
                        {(provided, snapshot) => (
                          <Accordion
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            sx={{
                              mb: 2,
                              "&.Mui-expanded:last-of-type": {
                                mb: 2,
                              },
                            }}
                          >
                            {/* HEADER */}
                            <AccordionSummary
                              expandIcon={<ExpandMore />}
                              sx={{
                                display: "flex",
                                alignItems: "center",
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
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                              >
                                <DragIndicator />
                              </Box>

                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <Typography sx={{ fontWeight: 600 }}>
                                  {doI18n(
                                    `pages:core-client_pdf_publisher:${w.type}`,
                                    i18nRef.current,
                                  )}
                                </Typography>
                                {w.type === "bcvWrapper" && (
                                  <Typography sx={{ color: "text.secondary" }}>
                                    {w.ranges.length}{" "}
                                    {doI18n(
                                      `pages:core-client_pdf_publisher:books`,
                                      i18nRef.current,
                                    )}{" "}
                                    {doI18n(
                                      `pages:core-client_pdf_publisher:as`,
                                      i18nRef.current,
                                    )}{" "}
                                    {w.sections.map((s, id) => {
                                      if (id === w.sections.length - 1) {
                                        return `${doI18n(
                                          `pages:core-client_pdf_publisher:${s.type + "Section"}`,
                                          i18nRef.current,
                                        )}`;
                                      }
                                      return `${doI18n(
                                        `pages:core-client_pdf_publisher:${s.type + "Section"}`,
                                        i18nRef.current,
                                      )}, `;
                                    })}
                                  </Typography>
                                )}
                                {w.type === "markdown" && (
                                  <Typography sx={{ color: "text.secondary" }}>
                                    {w.content.md.name.split("/")[1]}
                                  </Typography>
                                )}
                                {w.type === "pdf" && (
                                  <Typography sx={{ color: "text.secondary" }}>
                                    {w.content.pdf.name.split("/")[1]}
                                  </Typography>
                                )}
                              </Box>
                            </AccordionSummary>

                            {/* BODY */}
                            <AccordionDetails>
                              <Grid container size={12}>
                                {/* LEFT ICON COLUMN */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    textAlign: "center",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexDirection: "row",
                                      flexWrap: "wrap",
                                      padding: 2,
                                      gap: 1,
                                      width: "100%",
                                      justifyContent: "start",
                                    }}
                                  >
                                    {w?.ranges &&
                                      w.ranges.map((book, idss) => (
                                        <Chip
                                          key={idss}
                                          label={book}
                                          variant="outlined"
                                        />
                                      ))}
                                  </Box>
                                  <ArrowLeft show={w?.sections?.length > 1}>
                                    {w.type === "bcvWrapper" &&
                                      w.sections.map((s, idss) => (
                                        <BcvWrapperOverview
                                          section={s}
                                          bRanges={w.ranges}
                                          id={idss}
                                          lang={lang}
                                          i18nRef={i18nRef}
                                          projectSummaries={projectSummaries}
                                        />
                                      ))}
                                    {(w.type === "pdf" ||
                                      w.type === "markdown") && (
                                      <FreeFormatOverview
                                        section={w}
                                        lang={lang}
                                        i18nRef={i18nRef}
                                        projectSummaries={projectSummaries}
                                      />
                                    )}
                                  </ArrowLeft>
                                </Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                    width: "100%",
                                    gap: 1,
                                  }}
                                >
                                  <ContentDialogue
                                    type={"edit"}
                                    initSection={wrappers[id]}
                                    setWrapper={setWrappers}
                                    wrapperName={wrappers[id].type}
                                    indexSection={id}
                                    ButtonToPress={
                                      <IconButton>
                                        <EditIcon />
                                      </IconButton>
                                    }
                                  />

                                  <IconButton onClick={() => remove(id)}>
                                    <Delete />
                                  </IconButton>
                                </Box>
                              </Grid>
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </DragDropContext>
            <FloatingTextMenu i18nRef={i18nRef} setWrappers={setWrappers} />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1, // spacing between button and text
            }}
          >
            {(() => {
              const notInViewer = !(window?.electronAPI && window?.api);
              const sectionsHaveIssues =
                !notInViewer &&
                !wrappers.every(
                  (w) =>
                    checkPathsSections(
                      projectSummaries,
                      w?.sections,
                      typeThatNeedRessourceSelection,
                    ) &&
                    checkPathBooks(
                      projectSummaries,
                      w.sections,
                      w.ranges,
                      typeThatNeedRessourceSelection,
                    ),
                );

              const isDisabled = notInViewer || sectionsHaveIssues;

              const tooltipTitle = notInViewer
                ? doI18n(
                    `pages:core-client_pdf_publisher:print_disabled_not_viewer`,
                    i18nRef.current,
                  )
                : sectionsHaveIssues
                  ? doI18n(
                      `pages:core-client_pdf_publisher:print_disabled_sections_issue`,
                      i18nRef.current,
                    )
                  : "";

              return (
                <Box
                  sx={{
                    position: "fixed",
                    right: 64,
                    bottom: 24,
                    zIndex: 1300,
                  }}
                >
                  <Tooltip title={isDisabled ? tooltipTitle : ""}>
                    <span>
                      <Button
                        disabled={
                          isDisabled ||
                          currentNumberOfStepsValidated <
                            numberOfStepsToValidate ||
                          disablePrintButton
                        }
                        sx={{ textTransform: "none" }}
                        variant="contained"
                        onClick={async () => {
                          await PrintPdf();
                        }}
                      >
                        <Box>
                          {disablePrintButton ? (
                            <Box>
                              <Typography
                                sx={{
                                  color: "text.secondary",
                                  textAlign: "center",
                                }}
                              >
                                {messageSnackbar}
                              </Typography>
                              <CircularProgress size={16} color="inherit" />
                            </Box>
                          ) : (
                            <Typography>
                              {doI18n(
                                `pages:core-client_pdf_publisher:print`,
                                i18nRef.current,
                              )}
                            </Typography>
                          )}
                        </Box>
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              );
            })()}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
