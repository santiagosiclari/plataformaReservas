// src/app/theme.ts
import { createTheme } from "@mui/material/styles";

// Colores compartidos
const commonTypography = {
  fontFamily: [
    "system-ui", "-apple-system", "Segoe UI", "Roboto", "Ubuntu", "Cantarell",
    "Helvetica Neue", "Arial", "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"
  ].join(","),
  button: { textTransform: "none", fontWeight: 700 },
} as const;

// 🌞 Claro
export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2563eb" },
    secondary: { main: "#14b8a6" },
    background: {
      default: "#ffffff",   // = var(--bg) claro
      paper: "#ffffff",     // = var(--panel) claro
    },
    text: {
      primary: "#0f172a",   // = var(--text) claro
      secondary: "#475569", // = var(--muted) claro
    },
    divider: "#e2e8f0",     // = var(--border) claro
  },
  typography: commonTypography,
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Solo estilos globales; el gradiente lo maneja tu CSS
        body: {
          backgroundColor: "#ffffff",
          color: "#0f172a",
        },
      },
    },
  },
});

// 🌙 Oscuro
export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#3b82f6" },   // o #60a5fa si preferís más claro
    secondary: { main: "#14b8a6" },
    background: {
      default: "#0b0c10",  // match con tu gradiente base
      paper: "#111218",
    },
    text: {
      primary: "#e8eaf0",
      secondary: "#a7adba",
    },
    divider: "#20232b",
  },
  typography: commonTypography,
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#0b0c10",
          color: "#e8eaf0",
        },
      },
    },
  },
});
