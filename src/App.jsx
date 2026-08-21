import { useContext, useState, useCallback, useEffect } from "react";
import { Button, Chip, Grid } from "@mui/material";
import { doI18n } from "pankosmia-lib/i18n";
import { i18nContext } from "pankosmia-rcl";
import { useNavigate } from "react-router-dom";

function App() {
  const [maxWindowHeight, setMaxWindowHeight] = useState(
    window.innerHeight - 64,
  );
  const handleWindowResize = useCallback((event) => {
    setMaxWindowHeight(window.innerHeight - 64);
  }, []);
  const { i18nRef } = useContext(i18nContext);
  const navigate = useNavigate();

  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [handleWindowResize]);

  return (
    <Grid container spacing={2} sx={{ maxHeight: maxWindowHeight }}>
      <Grid size={12}>
        <h1>
          {doI18n(
            "pages:contenthandler-template:stub_content",
            i18nRef.current,
          )}
        </h1>
      </Grid>
      <Chip
        label="bouton create"
        color="secondary"
        variant="outlined"
        onClick={() => navigate("createPage")}
      />
      <Chip
        label="bouton update"
        color="secondary"
        variant="outlined"
        onClick={() => navigate("updatePage")}
      />
    </Grid>
  );
}

export default App;
