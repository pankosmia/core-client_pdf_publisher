import React, { useState, useEffect } from "react";
import { Box, TextField, Typography } from "@mui/material";

export function IntPicker({
  currentFieldValue,
  fieldInfo,
  setJsonSpec,
  lang,
  require,
}) {
  const [value, setValue] = useState(
    currentFieldValue || fieldInfo.suggestedDefault || "",
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
        {fieldInfo.minValue != null && (
          <span>
            ({fieldInfo.minValue}-{fieldInfo.maxValue})
          </span>
        )}
        {require && <span style={{ color: "red", fontWeight: 600 }}>*</span>}
      </Typography>

      {/* RIGHT: input */}
      <TextField
        sx={{ marginLeft: "auto", minWidth: 120 }}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        type="number"
        variant="standard"
        inputProps={{
          min: fieldInfo.minValue,
          max: fieldInfo.maxValue,
          step: 1,
        }}
      />
    </Box>
  );
}
