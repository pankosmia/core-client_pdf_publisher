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
    currentFieldValue ?? fieldInfo?.suggestedDefault ?? "",
  );

  const handleChange = (event) => {
    let newValue = event.target.value;

    if (fieldInfo.minValue != null) {
      const intVal = parseInt(newValue, 10);
      if (!isNaN(intVal)) {
        if (intVal < fieldInfo.minValue) newValue = fieldInfo.minValue;
        if (intVal > fieldInfo.maxValue) newValue = fieldInfo.maxValue;
      } else {
        newValue = "";
      }
    }

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

  const rangeText =
    fieldInfo.minValue != null
      ? ` (${fieldInfo.minValue}-${fieldInfo.maxValue})`
      : "";

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
        <InputLabel htmlFor={inputId}>
          {labelText}
          {rangeText}
        </InputLabel>

        <OutlinedInput
          id={inputId}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          label={`${labelText}${rangeText}`}
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
            min: fieldInfo.minValue,
            max: fieldInfo.maxValue,
            step: 1,
          }}
        />

        {hasError && <FormHelperText>This field is required</FormHelperText>}
      </FormControl>
    </Box>
  );
}
