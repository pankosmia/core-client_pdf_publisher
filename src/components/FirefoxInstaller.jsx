import { useState, useEffect } from "react";
import { Button, LinearProgress, Typography, Stack } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

function FirefoxInstaller() {
  const [status, setStatus] = useState("checking"); // checking | idle | downloading | complete | error
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  // Check on mount if Firefox is already installed
  useEffect(() => {
    let cancelled = false;

    window?.electronAPI?.checkFirefoxInstalled().then((installed) => {
      if (!cancelled) {
        setStatus(installed ? "complete" : "idle");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Register IPC listeners with cleanup
  useEffect(() => {
    const removeProgress = window?.electronAPI?.onDownloadProgress(
      (percent) => {
        setProgress(percent);
      },
    );

    const removeComplete = window?.electronAPI?.onDownloadComplete(
      (success, errorMessage) => {
        setStatus(success ? "complete" : "error");
        if (!success && errorMessage) {
          setErrorMessage(errorMessage);
        }
      },
    );

    return () => {
      if (window?.electronAPI) {
        removeProgress();
        removeComplete();
      }
    };
  }, []);

  const handleInstall = () => {
    setStatus("downloading");
    setProgress(0);
    window?.electronAPI?.downloadFirefox();
  };

  return (
    <Stack spacing={2} sx={{ maxWidth: 400 }}>
      <Button
        variant="contained"
        startIcon={
          status === "complete" ? (
            <CheckCircleIcon />
          ) : status === "error" ? (
            <ErrorIcon />
          ) : (
            <DownloadIcon />
          )
        }
        onClick={handleInstall}
        disabled={
          status === "checking" ||
          status === "downloading" ||
          status === "complete"
        }
        color={
          status === "complete"
            ? "success"
            : status === "error"
              ? "error"
              : "primary"
        }
      >
        {status === "checking" && "Checking…"}
        {status === "idle" && "Download Firefox Engine"}
        {status === "downloading" && "Downloading…"}
        {status === "complete" && "Installed"}
        {status === "error" && "Retry Download"}
      </Button>

      {status === "downloading" && (
        <>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" color="text.secondary">
            {progress}% complete
          </Typography>
        </>
      )}

      {status === "error" && (
        <Typography variant="body2" color="error">
          Download failed{errorMessage ? `: ${errorMessage}` : ""}. Please check
          your connection and try again.
        </Typography>
      )}

      {status === "idle" && (
        <Typography variant="caption" color="text.secondary">
          Approximately 80–100 MB download. Required for automation features.
        </Typography>
      )}
    </Stack>
  );
}

export default FirefoxInstaller;
