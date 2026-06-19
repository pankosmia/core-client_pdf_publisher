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

      {/* RIGHT: select */}
      <FormControl
        size="small"
        error={require && form === ""}
        sx={{ marginLeft: "auto", minWidth: 220 }}
      >
        <InputLabel id={`${fieldInfo.id}-label`}>Please Choose...</InputLabel>

        <Select
          labelId={`${fieldInfo.id}-label`}
          value={form}
          label="Please Choose..."
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
