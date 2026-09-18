import React, { useEffect, useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
} from "@mui/material";
export function SelectPicker({
  currentFieldValue,
  fieldInfo,
  require,
  currentIndex,
  setJsonSpec,
  lang,
}) {
  const [form, setForm] = useState(
    currentFieldValue || fieldInfo.suggestedDefault || "",
  );

  useEffect(() => {
    setJsonSpec(form);
  }, [form]);

  const handleChange = (event) => {
    const value = event.target.value;
    setForm(value);
    setJsonSpec(value);
  };

  const labelText = fieldInfo.label[lang]?.includes("#")
    ? fieldInfo.label[lang].replace("#", currentIndex)
    : fieldInfo.label[lang];

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
      {/* RIGHT: select */}
      <FormControl error={require && form === ""} sx={{ minWidth: 400 }}>
        <InputLabel id={`${fieldInfo.id}-label`}>{labelText}</InputLabel>

        <Select
          labelId={`${fieldInfo.id}-label`}
          value={form}
          label={labelText}
          onChange={handleChange}
        >
          <MenuItem value="">
            <em>Please Choose...</em>
          </MenuItem>

          {fieldInfo.typeEnum.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.label?.[lang]}
            </MenuItem>
          ))}
        </Select>

        {require && form === "" && (
          <FormHelperText>This field is required</FormHelperText>
        )}
      </FormControl>
    </Box>
  );
}
