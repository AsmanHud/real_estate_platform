import { Routes, Route } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ListingsPage from "./ListingsPage";
import ListingDetailsPage from "./ListingDetailsPage";

const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f7f7f5",
      paper: "#ffffff",
    },
    primary: {
      main: "#d92228",
      dark: "#b91c1c",
    },
    text: {
      primary: "#1f2933",
      secondary: "#5f6b7a",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontSize: "2rem",
      fontWeight: 700,
      letterSpacing: 0,
    },
    h2: {
      fontSize: "1.5rem",
      fontWeight: 700,
      letterSpacing: 0,
    },
    h3: {
      fontSize: "1.125rem",
      fontWeight: 700,
      letterSpacing: 0,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 700,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<ListingsPage />} />
        <Route path="/listing/:id" element={<ListingDetailsPage />} />
      </Routes>
    </ThemeProvider>
  );
}
