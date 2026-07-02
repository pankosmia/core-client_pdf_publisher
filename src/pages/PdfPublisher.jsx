import { useState, useEffect, useContext } from "react";
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
  Grid2,
  AppBar,
  Typography,
  Divider,
  IconButton,
  AccordionSummary,
  Accordion,
  AccordionDetails,
  Chip,
} from "@mui/material";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { convertionTypes, iconBySection } from "../pdf-gen/helpers/constants";
import { SelectOption } from "../components/SelectOptions";
import EditIcon from "@mui/icons-material/Edit";
import {
  i18nContext,
  Header,
  currentProjectContext,
  debugContext,
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
import { InfoRessource } from "../components/RessourcesChecker/InfoRessource";
import { typeThatNeedRessourceSelection } from "../pdf-gen/helpers/constants";

export function PdfPublisher() {
  const { debugRef } = useContext(debugContext);
  const { i18nRef } = useContext(i18nContext);
  const { enqueueSnackbar } = useSnackbar();
  const { currentProjectRef } = useContext(currentProjectContext);
  // fake selected project
  const [projectSummaries, setProjectSummaries] = useState({});
  const [headerInfo, setHeaderInfo] = useState(null);
  const [wrappers, setWrappers] = useState([]);
  const [lang, setlang] = useState("");

  const [fontFamilyCorrespondance, setFontFamilyCorrespondance] =
    useState(null);
  const [projectSpecs, setProjectSpecs] = useState(null);
  // const jsonWithHeaderChoice = PdfGen.pageInfo();
  useEffect(() => {
    async function getSpecs() {
      if (currentProjectRef.current) {
        let response = await getJson(
          `/api/burrito/ingredient/raw/${currentProjectRef.current.organization}/${currentProjectRef.current.source}/${currentProjectRef.current.project}?ipath=specs.json`,
        );
        if (response.ok) {
          let sections = response.json.sections.map((wrapper) => ({
            ...wrapper,
            sections: wrapper.sections.map((section) => ({
              ...section,
              type: `${section.type}Section`,
            })),
          }));

          setProjectSpecs({ ...response.json, sections: sections });
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
    let header = JSON.parse(headerInfo);
    let wrapperToPrint = wrappers.map((wrapper) => ({
      ...wrapper,
      sections: wrapper.sections.map((section) => ({
        ...section,
        type: `${section.type}`.replace("Section", ""),
      })),
    }));

    let font = await getJson("/api/settings/typography/");
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
      sections: wrapperToPrint,
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
    let manifest = await originatePdfs(options, null);
    await assemblePdfs(options, null, manifest);
  }

  useEffect(() => {
    const getProjectSummaries = async () => {
      const summariesResponse = await getJson(
        "/api/burrito/metadata/summaries",
        debugRef.current,
      );
      if (summariesResponse.ok) {
        setProjectSummaries(summariesResponse.json);
      }
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
      <Header
        titleKey={`${doI18n("pages:content:title", i18nRef.current)}`}
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
            let newWrappers = wrappers.map((wrapper) => ({
              ...wrapper,
              sections: wrapper.sections.map((section) => ({
                ...section,
                type: `${section.type}`.replace("Section", ""),
              })),
            }));
            const body = {
              payload: JSON.stringify({
                global: JSON.parse(headerInfo),
                sections: newWrappers,
              }),
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
          gridTemplateColumns: "2fr 9fr 1fr",
          width: "100%",
          padding: 5,
          alignItems: "start",
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

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="wrappers">
              {(provided) => (
                <Box
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{ marginBottom: 2 }}
                >
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
                            opacity: snapshot.isDragging ? 0.8 : 1,
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

                            {/* Optional title */}
                            <Typography sx={{ fontWeight: 600 }}>
                              Wrapper {id + 1}
                            </Typography>
                          </AccordionSummary>

                          {/* BODY */}
                          <AccordionDetails>
                            <Grid2 container size={12}>
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
                                  {w.ranges.map((book, idss) => (
                                    <Chip
                                      key={idss}
                                      label={book}
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                                <ArrowLeft show={w.sections.length > 1}>
                                  {w.sections.map((s, idss) => {
                                    const Icon = iconBySection[s.type];

                                    return (
                                      <Box
                                        key={idss}
                                        sx={{
                                          width: "100%",
                                          py: 1,
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 2,
                                          }}
                                        >
                                          {/* ICON */}
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

                                          {/* CONTENT */}
                                          <Box
                                            sx={{
                                              flex: 1,
                                              display: "flex",
                                              flexDirection: "column",
                                            }}
                                          >
                                            <Typography
                                              component="div"
                                              sx={{
                                                height: 48,
                                                display: "flex",
                                                alignItems: "center",
                                                fontWeight: 500,
                                              }}
                                            >
                                              {doI18n(
                                                `pages:core-client_pdf_publisher:${s.type}`,
                                                i18nRef.current,
                                              )}
                                            </Typography>

                                            {/* DETAILS */}
                                            <Box
                                              sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 0.5,
                                              }}
                                            >
                                              {Object.entries(s.content)
                                                .filter(([e]) =>
                                                  typeThatNeedRessourceSelection.includes(
                                                    e,
                                                  ),
                                                )
                                                .map(([e, value], idt) => {
                                                  const field =
                                                    sectionHandlerLookup[
                                                      s.type.replace(
                                                        "Section",
                                                        "",
                                                      )
                                                    ]
                                                      .signature()
                                                      .fields.find(
                                                        (f) => f.id === e,
                                                      );
                                                  return (
                                                    <Typography
                                                      component="div"
                                                      key={idt}
                                                      variant="body2"
                                                      color="text.secondary"
                                                      sx={{
                                                        justifyContent: "left",
                                                        paddingLeft: 2,
                                                        display: "flex",
                                                      }}
                                                    >
                                                      {field.typeSpec ? (
                                                        <Box
                                                          sx={{
                                                            gap: 0.5,
                                                            display: "flex",
                                                            flexDirection:
                                                              "column",
                                                          }}
                                                        >
                                                          {value.map(
                                                            (
                                                              typespec,
                                                              idTypeSpec,
                                                            ) =>
                                                              Object.entries(
                                                                typespec,
                                                              )
                                                                .filter(
                                                                  ([
                                                                    typeSpecFilter,
                                                                  ]) =>
                                                                    typeThatNeedRessourceSelection.includes(
                                                                      typeSpecFilter,
                                                                    ),
                                                                )
                                                                .map(
                                                                  ([k, v]) => (
                                                                    <Typography
                                                                      key={idt}
                                                                      variant="body2"
                                                                      color="text.secondary"
                                                                      sx={{
                                                                        justifyContent:
                                                                          "left",
                                                                        display:
                                                                          "flex",
                                                                      }}
                                                                    >
                                                                      {field?.typeSpec
                                                                        ?.find(
                                                                          (e) =>
                                                                            e.id ===
                                                                            k,
                                                                        )
                                                                        .label?.[
                                                                          lang
                                                                        ].replace(
                                                                          "#",
                                                                          idTypeSpec +
                                                                            1,
                                                                        )}{" "}
                                                                      :
                                                                      {
                                                                        <>
                                                                          {
                                                                            field
                                                                              ?.label?.[
                                                                              lang
                                                                            ]
                                                                          }
                                                                          :
                                                                          <InfoRessource
                                                                            summary={
                                                                              projectSummaries
                                                                            }
                                                                            pathElem={
                                                                              v
                                                                            }
                                                                            flavors={
                                                                              convertionTypes[
                                                                                field
                                                                                  .id
                                                                              ]
                                                                            }
                                                                            bRanges={
                                                                              w.ranges
                                                                            }
                                                                            i18nRef={
                                                                              i18nRef
                                                                            }
                                                                            icons={
                                                                              false
                                                                            }
                                                                            typographyVariant={
                                                                              "body2"
                                                                            }
                                                                          />
                                                                        </>
                                                                      }
                                                                    </Typography>
                                                                  ),
                                                                ),
                                                          )}
                                                        </Box>
                                                      ) : (
                                                        <>
                                                          {field?.label?.[lang]}{" "}
                                                          :
                                                          <InfoRessource
                                                            summary={
                                                              projectSummaries
                                                            }
                                                            pathElem={value}
                                                            flavors={
                                                              convertionTypes[
                                                                field.id
                                                              ]
                                                            }
                                                            bRanges={w.ranges}
                                                            i18nRef={i18nRef}
                                                            icons={false}
                                                            typographyVariant={
                                                              "body2"
                                                            }
                                                          />
                                                        </>
                                                      )}
                                                    </Typography>
                                                  );
                                                })}
                                            </Box>
                                          </Box>
                                        </Box>
                                      </Box>
                                    );
                                  })}
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
                            </Grid2>
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
          <Button
            disabled={
              !wrappers.every(
                (w) =>
                  checkPathsSections(
                    projectSummaries,
                    w.sections,
                    typeThatNeedRessourceSelection,
                  ) &&
                  checkPathBooks(
                    projectSummaries,
                    w.sections,
                    w.ranges,
                    typeThatNeedRessourceSelection,
                  ),
              )
            }
            variant="contained"
            onClick={async () => {
              await PrintPdf();
            }}
          >
            {doI18n(`pages:core-client_pdf_publisher:print`, i18nRef.current)}
          </Button>

          <Typography sx={{ color: "text.secondary", textAlign: "center" }}>
            {doI18n(
              `pages:core-client_pdf_publisher:remember_save`,
              i18nRef.current,
            )}
          </Typography>
          <FirefoxInstaller />
        </Box>
      </Box>
    </Box>
  );
}
