// src/main.tsx
import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { lightTheme, darkTheme } from "./app/theme";

function Root() {
  // 1) Modo inicial: localStorage -> preferencia del sistema -> "light"
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const saved = (localStorage.getItem("themeMode") as "light" | "dark" | null);
  const [mode, setMode] = useState<"light" | "dark">(saved ?? (prefersDark ? "dark" : "light"));

  // 2) Alternar y persistir
  const toggleTheme = () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    localStorage.setItem("themeMode", next);
  };

  // 3) Memo del theme
  const theme = useMemo(() => (mode === "light" ? lightTheme : darkTheme), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          {/* Pasamos el modo y el toggle a tu App (o directamente al Header) */}
          <App mode={mode} toggleTheme={toggleTheme} />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
