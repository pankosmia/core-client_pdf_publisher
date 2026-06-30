import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";

export function SelectOption({ title, type, option, handleChange, selected }) {
  const [selectedValue, setSelectedValue] = useState(selected || option[0]);

  useEffect(() => {
    setSelectedValue(selected);
  }, [selected]);
  const handleSelectChange = (e) => {
    const value = e.target.value;
    setSelectedValue(value);
    handleChange(type, value);
  };

  return (
    <Box>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel id={`${type}-label`}>{title}</InputLabel>
        <Select
          labelId={`${type}-label`}
          value={selectedValue}
          onChange={handleSelectChange}
          label={title}
        >
          {option.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
