import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2", // azul MUI por defecto
    },
    secondary: {
      main: "#9c27b0", // violeta
    },
  },
  shape: {
    borderRadius: 12,
  },
});

export default theme;
