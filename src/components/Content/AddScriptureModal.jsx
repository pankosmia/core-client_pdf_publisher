import {
  Button,
  Typography,
  Box,
  DialogContent,
  Grid2,
  Fab,
} from "@mui/material";
import { useState, useContext, useEffect } from "react";
import { doI18n } from "pankosmia-lib/i18n";
import {
  PanDialog,
  debugContext,
  i18nContext,
  currentProjectContext,
  PanTable,
} from "pankosmia-rcl";
import { getJson } from "pankosmia-lib/http";
import { enqueueSnackbar } from "notistack";

export default function AddScriptureModal({
  selectedResources,
  setSelectedResources,
  ChangeInSection,
  type,
}) {
  const { debugRef } = useContext(debugContext);
  const { i18nRef } = useContext(i18nContext);
  const { currentProjectRef } = useContext(currentProjectContext);

  const [openResourcesDialog, setOpenResourcesDialog] = useState(false);

  const [isoThreeLookup, setIsoThreeLookup] = useState([]);
  const [isoOneToThreeLookup, setIsoOneToThreeLookup] = useState([]);

  const [projectSummaries, setProjectSummaries] = useState({});

  const [_selectedResources, _setSelectedResources] = useState([]);
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
  useEffect(() => {
    getProjectSummaries().then();
  }, []);

  useEffect(() => {
    fetch("/api/app-resources/lookups/iso639-1-to-3.json") // ISO_639-1 codes mapped to ISO_639-3 codes
      .then((r) => r.json())
      .then((data) => setIsoOneToThreeLookup(data));
  }, []);

  useEffect(() => {
    fetch("/api/app-resources/lookups/iso639-3.json") // ISO_639-3 2025-02-21 from https://hisregistries.org/rol/ plus zht, zhs, nep
      .then((r) => r.json())
      .then((data) => setIsoThreeLookup(data));
  }, []);

  const columns = [
    {
      field: "name",
      headerName: doI18n("library:pankosmia-rcl:row_name", i18nRef.current),
      // minWidth: 110,
      flex: 1,
    },
    {
      field: "description",
      headerName: doI18n(
        "library:pankosmia-rcl:row_description",
        i18nRef.current,
      ),
      // minWidth: 130,
      flex: 1,
    },
    {
      field: "source",
      headerName: doI18n("library:pankosmia-rcl:row_source", i18nRef.current),
      // minWidth: 110,
      flex: 0.5,
    },
    {
      field: "language",
      headerName: doI18n("library:pankosmia-rcl:row_language", i18nRef.current),
      // minWidth: 100,
      flex: 0.5,
    },
    {
      field: "select",
      flex: 0.5,
    },
  ];
  const rows = Object.entries(projectSummaries)
    .map((e) => {
      return { ...e[1], path: e[0] };
    })
    .filter((r) => type.includes(projectSummaries[r.path].flavor))

    .map((rep, n) => {
      return {
        ...rep,
        id: n,
        path: rep.path,
        name: `${rep.name} (${rep.abbreviation})`,
        description: rep.description !== rep.name ? rep.description : "",
        source: rep.path.startsWith("_local_")
          ? rep.path.startsWith("_local_/_sideloaded_")
            ? doI18n("pages:content:local_resource", i18nRef.current)
            : doI18n("pages:content:local_project", i18nRef.current)
          : `${rep.path.split("/")[1]} (${rep.path.split("/")[0]})`,
        type: rep.flavor,
        language:
          isoThreeLookup?.[
            isoOneToThreeLookup[rep.language_code] ?? rep.language_code
          ]?.en ?? rep.language_code,
        select: (
          <Button
            onClick={() => {
              ChangeInSection(rep.path);
              setOpenResourcesDialog(false);
            }}
          >
            Click here to add
          </Button>
        ),
      };
    });
  return (
    <>
      <Button
        sx={{
          marginX: 1,
        }}
        variant="contained"
        onClick={() => setOpenResourcesDialog(true)}
      >
        <Typography variant="body">
          {doI18n("pages:core-client_pdf_publisher:select", i18nRef.current)}
        </Typography>
      </Button>
      <PanDialog
        size="xl"
        isOpen={openResourcesDialog}
        closeFn={() => setOpenResourcesDialog(false)}
        titleLabel={``}
      >
        <DialogContent>
          <Box sx={{ m: 2 }}>
            <Grid2 item size={12}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <PanTable showColumnFilters columns={columns} rows={rows} />
                </Box>
              </Box>
            </Grid2>
          </Box>
        </DialogContent>
      </PanDialog>
    </>
  );
}
