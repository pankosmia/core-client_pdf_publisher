import { useState, useCallback, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Stack,
  CircularProgress,
  TextField,
  Tabs,
  Tab,
  Link,
  Divider,
  Button,
  Tooltip,
} from "@mui/material";
import {
  CloudUpload,
  InsertDriveFile,
  Close,
  NoteAdd,
  Save,
  InfoOutlined,
} from "@mui/icons-material";
import { useFilePicker } from "use-file-picker";
import { i18nContext } from "pankosmia-rcl";
import ReactMarkdown from "react-markdown";
import { doI18n } from "pankosmia-lib/i18n";
import { postText } from "pankosmia-lib/http";
import { currentProjectContext } from "pankosmia-rcl";
import { v4 as uuidv4 } from "uuid";
import { useSnackbar } from "notistack";
const sanitizeFileName = (name) => name.replace(/\s+/g, "_");

export async function saveFile(localPath, fileBlob, name, folder) {
  const fd = new FormData();

  fd.append("file", fileBlob, name);

  return await fetch(
    `/api/burrito/ingredient/bytes/${localPath}?ipath=${folder}/${name}`,
    {
      method: "POST",
      body: fd,
    },
  );
}

const acceptByType = {
  pdf: ".pdf",
  markdown: ".md",
};

// Map markdown elements to MUI components for consistent app styling
const markdownComponents = {
  h1: ({ children }) => (
    <Typography variant="h4" gutterBottom>
      {children}
    </Typography>
  ),
  h2: ({ children }) => (
    <Typography variant="h5" gutterBottom>
      {children}
    </Typography>
  ),
  h3: ({ children }) => (
    <Typography variant="h6" gutterBottom>
      {children}
    </Typography>
  ),
  p: ({ children }) => (
    <Typography variant="body1" sx={{ mb: 1.5 }}>
      {children}
    </Typography>
  ),
  a: ({ href, children }) => (
    <Link href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </Link>
  ),
  li: ({ children }) => (
    <Typography component="li" variant="body1" sx={{ mb: 0.5 }}>
      {children}
    </Typography>
  ),
  hr: () => <Divider sx={{ my: 2 }} />,
  code: ({ inline, children }) =>
    inline ? (
      <Typography
        component="code"
        sx={{
          fontFamily: "monospace",
          backgroundColor: "action.hover",
          px: 0.5,
          borderRadius: 0.5,
        }}
      >
        {children}
      </Typography>
    ) : (
      <Box
        component="pre"
        sx={{
          fontFamily: "monospace",
          backgroundColor: "action.hover",
          p: 2,
          borderRadius: 1,
          overflowX: "auto",
        }}
      >
        <code>{children}</code>
      </Box>
    ),
};

export function ImportDocument({
  documentType,
  currentSections,
  setCurrentSections,
  setIsRessourcesStepComplete,
  setDocumentInfo,
}) {
  const { i18nRef } = useContext(i18nContext);
  const { enqueueSnackbar } = useSnackbar();

  const { currentProjectRef } = useContext(currentProjectContext);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [markdownContent, setMarkdownContent] = useState("");
  const [tab, setTab] = useState(0); // 0 = edit, 1 = preview

  const { openFilePicker, filesContent, plainFiles, loading, errors, clear } =
    useFilePicker({
      accept: acceptByType[documentType] ?? "*",
      readAs: "Text",
    });

  const handleNewFile = useCallback(
    async (file) => {
      const cleanName = sanitizeFileName(file.name);
      const renamedFile =
        cleanName === file.name
          ? file
          : new File([file], cleanName, { type: file.type });

      setSelectedFile(renamedFile);

      if (documentType === "markdown") {
        const text = await renamedFile.text();
        setMarkdownContent(text);
      }
    },
    [documentType],
  );

  // Start a brand-new, empty markdown document
  const handleCreateNew = useCallback(() => {
    const emptyFile = new File([""], `${uuidv4()}.md`, {
      type: "text/markdown",
    });
    setSelectedFile(emptyFile);
    setMarkdownContent("");
    setTab(0);
  }, []);

  // Sync click-picker result into local state
  useEffect(() => {
    if (plainFiles && plainFiles.length > 0) {
      const file = plainFiles[0];
      const cleanName = sanitizeFileName(file.name);
      const renamedFile =
        cleanName === file.name
          ? file
          : new File([file], cleanName, { type: file.type });

      setSelectedFile(renamedFile);

      if (documentType === "markdown" && filesContent?.[0]) {
        setMarkdownContent(filesContent[0].content ?? "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plainFiles, filesContent]);

  useEffect(() => {
    if (documentType === "markdown" && selectedFile) {
      const updatedFile = new File([markdownContent], selectedFile.name, {
        type: "text/markdown",
      });
      setSelectedFile(updatedFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markdownContent]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;

    handleNewFile(dropped);
  };

  const handleClick = () => {
    openFilePicker();
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setMarkdownContent("");
    clear();
  };

  // New: preselect an already-saved document on mount / when it changes
  useEffect(() => {
    const docExtansion = acceptByType[documentType]?.replace(".", "");
    if (!docExtansion) return;

    const existing = currentSections?.[0]?.content?.[docExtansion];
    if (!existing?.src || !existing?.name) return; // nothing saved yet, keep dropzone

    const fileName = existing.name.split("/").pop();
    const url = `/api/burrito/ingredient/bytes/${existing.src}?ipath=${existing.name}`;

    if (documentType === "markdown") {
      fetch(url)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.text();
        })
        .then((text) => {
          setMarkdownContent(text);
          setSelectedFile(
            new File([text], fileName, { type: "text/markdown" }),
          );
        })
        .catch((error) => {
          enqueueSnackbar(
            `${doI18n(
              `pages:core-client_pdf_publisher:errorGet`,
              i18nRef.current,
            )}: ${error.message}`,
            { variant: "error" },
          );
        });
    } else if (documentType === "pdf") {
      fetch(url)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.blob();
        })
        .then((blob) => {
          setSelectedFile(
            new File([blob], fileName, { type: "application/pdf" }),
          );
        })
        .catch((error) => {
          enqueueSnackbar(
            `${doI18n(
              `pages:core-client_pdf_publisher:errorGet`,
              i18nRef.current,
            )}: ${error.message}`,
            { variant: "error" },
          );
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentType]);
  // endpoint (or storage mechanism) for persisting the document is decided.
  useEffect(() => {
    if (!selectedFile || !currentSections?.[0]) return;

    const docExtension = acceptByType[documentType]?.replace(".", "");
    if (!docExtension) return;

    const localPath =
      `${currentProjectRef.current.organization}/` +
      `${currentProjectRef.current.source}/` +
      `${currentProjectRef.current.project}`;

    const newName = `${docExtension}/${selectedFile.name}`;

    setCurrentSections((prev) => {
      if (!prev[0]) return prev;

      const existing = prev[0].content?.[docExtension];

      // IMPORTANT: don't create a new object if nothing changed
      if (existing?.src === localPath && existing?.name === newName) {
        return prev;
      }

      const copy = [...prev];

      copy[0] = {
        ...copy[0],
        content: {
          ...copy[0].content,
          [docExtension]: {
            src: localPath,
            name: newName,
          },
        },
      };

      return copy;
    });

    setIsRessourcesStepComplete(true);
    setDocumentInfo([localPath, selectedFile, selectedFile.name, docExtension]);
  }, [selectedFile, documentType, setCurrentSections]);
  return (
    <Box sx={{ mt: 1 }}>
      {!selectedFile && (
        <Stack spacing={1.5}>
          <Paper
            variant="outlined"
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              p: 4,
              textAlign: "center",
              cursor: "pointer",
              borderStyle: "dashed",
              borderWidth: 2,
              borderColor: isDragActive ? "primary.main" : "divider",
              backgroundColor: isDragActive
                ? "action.hover"
                : "background.paper",
              transition: "all 0.15s ease",
            }}
          >
            {loading ? (
              <CircularProgress size={28} />
            ) : (
              <Stack alignItems="center" spacing={1}>
                <CloudUpload sx={{ fontSize: 40, color: "text.secondary" }} />
                <Typography variant="body1">
                  {doI18n(
                    "pages:core-client_pdf_publisher:dragAndDrop",
                    i18nRef.current,
                  ).replace("%%DOCTYPE%%", documentType)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {doI18n(
                    "pages:core-client_pdf_publisher:singleFile",
                    i18nRef.current,
                  )}
                </Typography>
              </Stack>
            )}
          </Paper>

          {documentType === "markdown" && (
            <>
              <Divider>
                <Typography variant="caption" color="text.secondary">
                  {doI18n(
                    "pages:core-client_pdf_publisher:or",
                    i18nRef.current,
                  )}
                </Typography>
              </Divider>
              <Button
                variant="outlined"
                startIcon={<NoteAdd />}
                onClick={handleCreateNew}
                fullWidth
              >
                {doI18n(
                  "pages:core-client_pdf_publisher:createMarkdown",
                  i18nRef.current,
                )}
              </Button>
            </>
          )}
        </Stack>
      )}
      {errors.length > 0 && (
        <Typography
          color="error"
          variant="caption"
          sx={{ mt: 1, display: "block" }}
        >
          Something went wrong reading the file.
        </Typography>
      )}

      {selectedFile && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Paper
            variant="outlined"
            sx={{ display: "flex", alignItems: "center", gap: 1, p: 1 }}
          >
            <InsertDriveFile fontSize="small" />
            <Typography variant="body2" sx={{ flex: 1 }} noWrap>
              {selectedFile.name}
            </Typography>
            <IconButton size="small" onClick={handleRemove}>
              <Close fontSize="small" />
            </IconButton>
          </Paper>
        </Stack>
      )}

      {documentType === "markdown" && selectedFile && (
        <Box sx={{ mt: 2, border: 1, borderColor: "divider", borderRadius: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pr: 1,
            }}
          >
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 1 }}>
              <Tab
                label={doI18n(
                  "pages:core-client_pdf_publisher:edit",
                  i18nRef.current,
                )}
              />
              <Tab
                label={doI18n(
                  "pages:core-client_pdf_publisher:preview",
                  i18nRef.current,
                )}
              />
            </Tabs>
          </Box>

          <Box sx={{ p: 2 }}>
            {tab === 0 ? (
              <TextField
                multiline
                fullWidth
                minRows={12}
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                placeholder="Write markdown here..."
                autoFocus={markdownContent === ""}
              />
            ) : markdownContent ? (
              <ReactMarkdown components={markdownComponents}>
                {markdownContent}
              </ReactMarkdown>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {doI18n(
                  "pages:core-client_pdf_publisher:nothingToPreview",
                  i18nRef.current,
                )}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      {/* {selectedFile && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          <Button
            variant="contained"
            size="small"
            startIcon={<Save />}
            onClick={handleSave}
          >
            {doI18n("pages:core-client_pdf_publisher:save", i18nRef.current)}
          </Button>

          <Tooltip
            title={doI18n(
              "pages:core-client_pdf_publisher:saveRequiredForPrintTooltip",
              i18nRef.current,
            )}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 0.5,
                cursor: "default",
              }}
            >
              <InfoOutlined fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {doI18n(
                  "pages:core-client_pdf_publisher:saveRequiredForPrint",
                  i18nRef.current,
                )}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      )} */}
    </Box>
  );
}
