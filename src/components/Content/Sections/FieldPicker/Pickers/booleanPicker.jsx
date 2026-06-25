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
      }}
    >
      {/* LEFT: label */}
      <Typography sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {fieldInfo.label[lang]?.includes("#")
          ? fieldInfo.label[lang].replace("#", currentIndex)
          : fieldInfo.label[lang]}
      </Typography>

      {/* RIGHT: checkbox */}
      <Checkbox
        sx={{ marginLeft: "auto" }}
        checked={selected}
        onChange={() => setSelected((prev) => !prev)}
      />
    </Box>
  );
}
