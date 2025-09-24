import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import theme from "./app/theme"; // tu archivo de tema MUI

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* reset de estilos */}
      <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
