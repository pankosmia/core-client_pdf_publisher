import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";

export function InputPicker({
  currentFieldValue,
  doReset,
  fieldInfo,
  setJsonSpec,
  lang,
  require,
}) {
  const [input, setInput] = useState(
    currentFieldValue || fieldInfo.suggestedDefault || "",
  );

  useEffect(() => {
    setJsonSpec(input);
  }, [input]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const resetField = () => {
    setInput(fieldInfo.suggestedDefault || "");
  };

  useEffect(() => {
    resetField();
  }, [doReset]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        mt: 2,
        width: "100%",
      }}
    >
      {/* LEFT: label */}
      <Typography sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {fieldInfo.label?.[lang]}
        {require && <span style={{ color: "red", fontWeight: 600 }}>*</span>}
      </Typography>

      {/* RIGHT: input */}
      <TextField
        sx={{ marginLeft: "auto", minWidth: 200 }}
        id="filled-search"
        type="search"
        variant="filled"
        value={input}
        onChange={handleInputChange}
        error={input === ""}
        helperText={input === "" ? "*Required" : ""}
      />
    </Box>
  );
}
