import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2563eb" },
    secondary: { main: "#14b8a6" },
    background: {
      default: "#ffffff",  // 👈 fondo de página MUI
      paper: "#ffffff",    // 👈 fondos de <Paper/>
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
    },
    divider: "#e2e8f0",
  },
  typography: {
    fontFamily: [
      "system-ui","-apple-system","Segoe UI","Roboto","Ubuntu","Cantarell",
      "Helvetica Neue","Arial","Noto Sans","Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"
    ].join(","),
    button: { textTransform: "none", fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    /* belt-and-suspenders: fuerza el body blanco con CssBaseline */
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#ffffff" },
      },
    },
  },
});

export default theme;
