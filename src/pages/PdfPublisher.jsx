import { useState, useEffect, useContext } from "react";
// import {PdfGen} from "jxl-pdf"
import { getJson, doI18n, getAndSetJson } from "pithekos-lib";
import { debugContext } from "pankosmia-rcl";
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
  Toolbar,
  Typography,
  Card,
  CardContent,
  Divider,
  IconButton,
  AccordionSummary,
  Accordion,
  AccordionDetails,
  Chip,
  SpeedDial,
  SpeedDialAction,
} from "@mui/material";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { useLocation } from "react-router-dom";
import { iconBySection } from "../pdf-gen/helpers/constants";
import { SelectOption } from "../components/SelectOptions";
import EditIcon from "@mui/icons-material/Edit";
import { i18nContext, Header } from "pankosmia-rcl";
import Bcv from "../components/icons/sectionIcons/bcv";
import fontsJson from "../components/fieldPicker/fonts.json";
import { ContentDialogue } from "../components/Content/ContentDialogue";
import {
  Add,
  Delete,
  DragIndicator,
  ExpandMore,
  Save,
} from "@mui/icons-material";
import Arrow from "../components/utils/arrow";
import ArrowLeft from "../components/utils/arrow";
import { sectionHandlerLookup } from "../pdf-gen/sectionHandlerLookup";
import FloatingTextMenu from "../components/SpeedDial/FloatingTextMenu";

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

export function PdfPublisher() {
  const { debugRef } = useContext(debugContext);
  const { i18nRef } = useContext(i18nContext);
  // fake selected project
  const [projectSummaries, setProjectSummaries] = useState({});

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [wrappers, setWrappers] = useState([]);
  // console.log(projectSummaries);
  const [lang, setlang] = useState("");

  // const jsonWithHeaderChoice = PdfGen.pageInfo();

  const jsonWithHeaderChoice = {
    pages: Object.entries(pages).map(([key, value]) => ({
      value: key,
      label: value.label.en,
    })),
    fonts: Object.entries(fontsJson).map(([key, value]) => ({
      value: key,
      label: value.label.en,
    })),
    label_fonts: Object.entries(fontsJson).map(([key, value]) => ({
      value: key,
      label: value.label.en,
    })),
    sizes: Object.entries(sizes).map(([key, value]) => ({
      value: key,
      label: value.label.en,
    })),
    verbose: [true, false],
  };

  const actionsSpeedDial = [
    { name: "Bcv", onClick: () => console.log("Edit") },
    { name: "Simple", onClick: () => console.log("Duplicate") },
    { name: "Obs", onClick: () => console.log("Delete") },
  ];
  // the selected headerInfo
  const [headerInfo, setHeaderInfo] = useState(
    '{"sizes":"9on11","fonts":"allGentium","pages":"EXECUTIVE", "verbose":false}',
  );
  let parseHeaderInfo = JSON.parse(headerInfo);

  async function PrintPdf() {
    let header = JSON.parse(headerInfo);
    let wrapperToPrint = JSON.parse(JSON.stringify(wrappers));
    let newWrapper = wrapperToPrint.map((w) => {
      let new_section = [];
      w.sections.forEach((n) => {
        const { type, id, ...content } = n;
        new_section.push({
          type: type.replace("Section", ""),
          id,
          content,
        });
      });
      w.sections = new_section;
      return w;
    });

    let font = await getJson("/api/settings/typography/");
    let newFont = {};

    let fontFam = Object.entries(fonts[header.fonts]).forEach(([k, v]) => {
      newFont[k] = font.json.font_set;
    });

    const config = {
      global: {
        fonts: header.fonts,
        pages: header.pages,
        sizes: header.sizes,
        verbose: header.verbose,
      },
      sections: newWrapper,
    };

    const options = {
      verbose: config.global.verbose,
      steps: ["originate", "assemble"],
      pageFormat: pages[config.global.pages],
      fonts: newFont,
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
  console.log(wrappers);
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

          <Box container spacing={2} sx={{ marginBottom: 2 }}>
            <Box
              size={8}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2, // adjust spacing here
              }}
            >
              <SelectOption
                title="Paper size"
                type="pages"
                option={jsonWithHeaderChoice.pages}
                handleChange={handleChangeHeaderInfo}
              />
              <SelectOption
                title="Font family"
                type="fonts"
                option={jsonWithHeaderChoice.label_fonts}
                handleChange={handleChangeHeaderInfo}
              />
              <SelectOption
                title="Font size"
                type="sizes"
                option={jsonWithHeaderChoice.sizes}
                handleChange={handleChangeHeaderInfo}
              />
            </Box>
            <Box>
              {Object.entries(fontsJson[parseHeaderInfo.fonts])
                .filter(([key]) =>
                  ["heading", "body", "body2", "greek", "footnote"].includes(
                    key,
                  ),
                )
                .map(([key, value], id) => (
                  <Typography key={id} sx={{ fontFamily: value }}>
                    {key}: preview
                  </Typography>
                ))}
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
                                size={10}
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
                                    <Chip label={book} variant="outlined" />
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
                                              {Object.entries(s)
                                                .filter(([e]) =>
                                                  allowedSelected.includes(e),
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
                                                      sx={{
                                                        justifyContent: "left",
                                                        paddingLeft: 2,
                                                        display: "flex",
                                                      }}
                                                      key={idt}
                                                      variant="body2"
                                                      color="text.secondary"
                                                    >
                                                      {field?.label?.[lang]}:{" "}
                                                      {
                                                        projectSummaries[value]
                                                          ?.name
                                                      }
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
          {/* <ContentDialogue
            type={"add"}
            setWrapper={setWrappers}
            ButtonToPress={
              <Button variant="contained" startIcon={}>
                {doI18n(
                  `pages:core-client_pdf_publisher:add_section`,
                  i18nRef.current,
                )}
              </Button>
            }
          /> */}
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
        </Box>
      </Box>
    </Box>
  );
}
