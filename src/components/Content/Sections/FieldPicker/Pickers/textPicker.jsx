import { useState, useEffect } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText,
} from "@mui/material";

export function TextPicker({
  currentFieldValue,
  setJsonSpec,
  fieldInfo,
  lang,
  currentIndex,
  require,
}) {
  const [text, setText] = useState(
    currentFieldValue ?? fieldInfo?.suggestedDefault ?? "",
  );

  useEffect(() => {
    setJsonSpec(text);
  }, [text]);

  const labelText = fieldInfo.label[lang]?.includes("#")
    ? fieldInfo.label[lang].replace("#", currentIndex)
    : fieldInfo.label[lang];

  const inputId = `${fieldInfo.id}-input`;

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
      <FormControl sx={{ minWidth: 400 }}>
        <InputLabel htmlFor={inputId}>{labelText}</InputLabel>

        <OutlinedInput
          id={inputId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          label={labelText}
        />
      </FormControl>
    </Box>
  );
}
