import { useState, useEffect } from "react";
import { Checkbox, Box, Typography } from "@mui/material";

export function BooleanPicker({
  currentFieldValue,
  setJsonSpec,
  fieldInfo,
  lang,
  require,
  currentIndex,
}) {
  const [selected, setSelected] = useState(
    currentFieldValue ?? fieldInfo.suggestedDefault ?? false,
  );

  useEffect(() => {
    setJsonSpec(selected);
  }, [selected]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        mt: 2,
        width: "100%",
        borderRadius: 1,
        cursor: "pointer",
        transition: "background-color 0.15s ease, transform 0.1s ease",

        "&:hover": {
          backgroundColor: "action.hover",
        },

        "&:active": {
          backgroundColor: "action.selected",
          transform: "scale(0.99)",
        },
      }}
      onClick={() => setSelected((prev) => !prev)}
    >
      <Checkbox
        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        checked={selected}
        onChange={() => setSelected((prev) => !prev)}
      />
      {/* LEFT: label */}
      <Typography sx={{}}>
        {fieldInfo.label[lang]?.includes("#")
          ? fieldInfo.label[lang].replace("#", currentIndex)
          : fieldInfo.label[lang]}
      </Typography>

      {/* RIGHT: checkbox */}
    </Box>
  );
}
