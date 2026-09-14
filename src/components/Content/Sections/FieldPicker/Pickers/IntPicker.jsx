import { useState, useEffect } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText,
} from "@mui/material";

export function IntPicker({
  currentFieldValue,
  fieldInfo,
  setJsonSpec,
  lang,
  require,
  currentIndex,
}) {
  const [value, setValue] = useState(
    currentFieldValue ?? fieldInfo?.suggestedDefault ?? 0,
  );

  const handleChange = (event) => {
    let newValue = event.target.value;
    setValue(newValue);
  };

  useEffect(() => {
    setJsonSpec(value);
  }, [value]);

  const handleBlur = (event) => {
    const newValue = event.target.value.trim();
    setValue(newValue);
  };

  const labelText = fieldInfo.label[lang]?.includes("#")
    ? fieldInfo.label[lang].replace("#", currentIndex)
    : fieldInfo.label[lang];

  const inputId = `${fieldInfo.id}-input`;
  const hasError = require && value === "";

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
      <FormControl error={hasError} sx={{ minWidth: 400 }}>
        <InputLabel htmlFor={inputId}>{labelText}</InputLabel>

        <OutlinedInput
          id={inputId}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          label={`${labelText}`}
          type="number"
          sx={{
            "& input[type=number]": {
              MozAppearance: "textfield",
            },
            "& input[type=number]::-webkit-inner-spin-button": {
              opacity: 1,
              display: "block",
            },
          }}
          inputProps={{
            step: 1,
          }}
        />

        {hasError && <FormHelperText>This field is required</FormHelperText>}
      </FormControl>
    </Box>
  );
}
