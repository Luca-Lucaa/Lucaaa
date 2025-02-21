// theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2", // Hauptfarbe
    },
    secondary: {
      main: "#dc004e", // Sekundärfarbe
    },
    success: {
      main: "#4caf50", // Erfolgsfarbe
    },
    error: {
      main: "#f44336", // Fehlerfarbe
    },
    background: {
      default: "#f0f0f0", // Hintergrundfarbe
      paper: "#ffffff", // Hintergrundfarbe für Papierelemente
    },
  },
});

export default theme;
