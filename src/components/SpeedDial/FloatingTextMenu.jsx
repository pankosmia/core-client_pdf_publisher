import * as React from "react";
import Fab from "@mui/material/Fab";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import { Button } from "@mui/material";
import { ContentDialogue } from "../Content/ContentDialogue";
import { doI18n } from "pithekos-lib";
import { useState } from "react";
const actions = [
  { name: "bcvWrapper" },
  { name: "obsWrapper" },
  { name: "markdownWrapper" },
  { name: "pdfWrapper" },
];

export default function FloatingTextMenu({ i18nRef, setWrappers }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [openFromOutside, setOpenFromOustide] = useState(0);
  const open = Boolean(anchorEl);
  return (
    <Box>
      <Fab
        size="small"
        color="primary"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          marginTop: 2,
          width: 40,
          height: 40,
          minHeight: 40,
          boxShadow: 2,
        }}
      >
        <AddIcon sx={{ fontSize: 18 }} />
      </Fab>

      {/* compact menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        {actions.map((action) => (
          <MenuItem
            key={action.name}
            onClick={() => {
              setSelectedAction(action.name);
              setOpenFromOustide((prev) => prev + 1);
              setAnchorEl(null);
            }}
            sx={{
              minHeight: 32,
            }}
          >
            {doI18n(
              `pages:core-client_pdf_publisher:${action.name}`,
              i18nRef.current,
            )}
          </MenuItem>
        ))}
      </Menu>
      {selectedAction && (
        <ContentDialogue
          type="add"
          wrapperName={selectedAction}
          setWrapper={setWrappers}
          openFromOutside={openFromOutside}
          onCloseFromOutise={() => setSelectedAction(null)}
        />
      )}
    </Box>
  );
}
