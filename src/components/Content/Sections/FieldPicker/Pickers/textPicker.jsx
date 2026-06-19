import { useState, useEffect } from "react";
import { Box, TextField, Typography } from "@mui/material";

export function TextPicker({
  currentFieldValue,
  setJsonSpec,
  fieldInfo,
  lang,
  require,
}) {
  const [text, setText] = useState(
    currentFieldValue ?? fieldInfo?.suggestedDefault ?? "",
  );

  useEffect(() => {
    setJsonSpec(text);
  }, [text]);

  const resetField = () => {
    setText(fieldInfo?.suggestedDefault || "");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
        width: "100%",
      }}
    >
      <Typography
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {fieldInfo.label?.[lang]}

        {require && (
          <span
            style={{ color: "red", fontWeight: 600 }}
            title="Required field"
          >
            *
          </span>
        )}
      </Typography>
      <TextField
        sx={{ marginLeft: "auto", minWidth: 200 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        size="small"
        variant="outlined"
      />
    </Box>
  );
}
