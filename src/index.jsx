import { createRoot } from "react-dom/client";
import { SpaContainer } from "pankosmia-rcl";
import { createHashRouter, Outlet, RouterProvider } from "react-router-dom";
import "./index.css";
import { PdfPublisher } from "./pages/PdfPublisher";
import { SnackbarProvider, MaterialDesignContent } from "notistack";
import { styled } from "@mui/material/styles";

/* ---------------- ROUTER ---------------- */

const router = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [{ path: "/", element: <PdfPublisher /> }],
  },
]);

/* ---------------- APP LAYOUT ---------------- */

function AppLayout() {
  /* ---------------- LOAD THEME JSON ---------------- */

  const CustomSnackbarContent = styled(MaterialDesignContent)(() => ({
    "&.notistack-MuiContent-error": {
      backgroundColor: "#FDEDED",
      color: "#D32F2F",
    },
    "&.notistack-MuiContent-info": {
      backgroundColor: "#E5F6FD",
      color: "#0288D1",
    },
    "&.notistack-MuiContent-warning": {
      backgroundColor: "#FFF4E5",
      color: "#EF6C00",
    },
    "&.notistack-MuiContent-success": {
      backgroundColor: "#EDF7ED",
      color: "#2E7D32",
    },
  }));

  return (
    <SnackbarProvider
      Components={{
        error: CustomSnackbarContent,
        info: CustomSnackbarContent,
        warning: CustomSnackbarContent,
        success: CustomSnackbarContent,
      }}
      maxSnack={6}
    >
      <Outlet />
    </SnackbarProvider>
  );
}

/* ---------------- BOOTSTRAP ---------------- */

createRoot(document.getElementById("root")).render(
  <SpaContainer>
    <RouterProvider router={router} />
  </SpaContainer>,
);

// "endpoints": {
//   "textTranslation": {
//     "create_document": [
//       {
//         "doc": "Create document for textTranslation Project",
//         "placeHolders": {},
//         "label": "pages:core-contenthandler_text_translation:Test_Pdf",
//         "url": "/pptrTest"
//       }
//     ]
//   }
// },
