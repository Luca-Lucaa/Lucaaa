import React, { useState, useEffect, Suspense, lazy } from "react";
import {
  Container,
  Typography,
  Grid,
  AppBar,
  Toolbar,
  Button,
  Snackbar,
  Box,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { styled, ThemeProvider, createTheme } from "@mui/material/styles";
import { supabase } from "./supabaseClient";
import ChatMessage from "./ChatMessage"; // Importiere die ChatMessage-Komponente

// Dynamischer Import der Komponenten
const LoginForm = lazy(() => import("./LoginForm"));
const EntryList = lazy(() => import("./EntryList"));

// Styling
const StyledContainer = styled(Container)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  minHeight: "100vh",
  padding: "20px",
  color: theme.palette.text.primary,
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
}));

// Benutzer-Emojis
const userEmojis = {
  Admin: "👑",
  Test: "🚀",
  Test1: "🎩",
};

// Erstellen des Themes
const theme = createTheme({
  palette: {
    primary: {
      main: "#3b82f6", // Ihre Hauptfarbe
    },
    secondary: {
      main: "#dc004e", // Ihre Sekundärfarbe
    },
    background: {
      default: "#e0e7ff", // Hintergrundfarbe der Anwendung
      paper: "#ffffff", // Hintergrundfarbe für Papierelemente
    },
    text: {
      primary: "#333", // Textfarbe
    },
  },
});

const App = () => {
  // Zustand für Benutzer & Rollen
  const [loggedInUser, setLoggedInUser] = useState(
    () => localStorage.getItem("loggedInUser") || null
  );
  const [role, setRole] = useState(() => localStorage.getItem("role") || null);
  const [entries, setEntries] = useState([]); // Einträge werden jetzt von Supabase abgerufen
  const [messages, setMessages] = useState([]); // Zustand für Nachrichten
  const [selectedUser, setSelectedUser] = useState("Admin"); // Zustand für den ausgewählten Chat-Partner
  const [newMessage, setNewMessage] = useState(""); // Zustand für die neue Nachricht

  // Zustand für Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Nachrichten von Supabase abrufen
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender.eq.${loggedInUser},receiver.eq.${selectedUser}),and(sender.eq.${selectedUser},receiver.eq.${loggedInUser})`
        )
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Fehler beim Abrufen der Nachrichten:", error);
      } else {
        setMessages(data);
      }
    } catch (error) {
      console.error("Fehler beim Abrufen der Nachrichten:", error);
    }
  };

  // Realtime-Updates für Nachrichten
  useEffect(() => {
    if (loggedInUser) {
      // Abonniere Änderungen in der `messages`-Tabelle
      const subscription = supabase
        .channel("messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            // Neue Nachricht zur Liste hinzufügen
            setMessages((prevMessages) => [...prevMessages, payload.new]);
          }
        )
        .subscribe();

      // Initiale Nachrichten laden
      fetchMessages();

      // Abonnement beenden, wenn die Komponente unmountet
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [loggedInUser, selectedUser]);

  // Login-Logik
  const handleLogin = (username, password) => {
    const users = { Admin: "Admin", Test: "Test", Test1: "Test1" };
    if (users[username] === password) {
      setLoggedInUser(username);
      setRole(username === "Admin" ? "Admin" : "Friend");

      // Zustand im localStorage speichern
      localStorage.setItem("loggedInUser", username);
      localStorage.setItem("role", username === "Admin" ? "Admin" : "Friend");

      // Snackbar anzeigen
      setSnackbarMessage(`✅ Willkommen, ${username}!`);
      setSnackbarOpen(true);
    } else {
      // Snackbar für falsches Passwort anzeigen
      setSnackbarMessage("❌ Ungültige Zugangsdaten");
      setSnackbarOpen(true);
    }
  };

  // Logout-Logik
  const handleLogout = () => {
    setLoggedInUser(null);
    setRole(null);

    // Zustand aus localStorage entfernen
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("role");

    // Snackbar anzeigen
    setSnackbarMessage("🔓 Erfolgreich abgemeldet!");
    setSnackbarOpen(true);
  };

  // Funktion zum Senden einer Nachricht
  const sendMessage = async () => {
    if (!newMessage.trim()) return; // Leere Nachrichten ignorieren

    try {
      const { error } = await supabase.from("messages").insert([
        {
          sender: loggedInUser,
          receiver: selectedUser,
          message: newMessage,
        },
      ]);

      if (error) {
        console.error("Fehler beim Senden der Nachricht:", error);
        setSnackbarMessage("Fehler beim Senden der Nachricht.");
        setSnackbarOpen(true);
      } else {
        setNewMessage(""); // Eingabefeld leeren
      }
    } catch (error) {
      console.error("Fehler beim Senden der Nachricht:", error);
      setSnackbarMessage("Fehler beim Senden der Nachricht.");
      setSnackbarOpen(true);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <StyledContainer>
        <StyledAppBar position="static">
          <Toolbar>
            <Typography variant="h6">Eintragsverwaltung</Typography>
            {loggedInUser && (
              <Typography
                variant="h6"
                style={{ marginLeft: "auto", marginRight: "20px" }}
              >
                {userEmojis[loggedInUser]} {loggedInUser}
              </Typography>
            )}
            {loggedInUser && (
              <Button onClick={handleLogout} color="inherit">
                🔓 Logout
              </Button>
            )}
          </Toolbar>
        </StyledAppBar>
        <Suspense fallback={<div>🔄 Lade...</div>}>
          {!loggedInUser ? (
            <Grid
              container
              justifyContent="center"
              style={{ marginTop: "20px" }}
            >
              <Grid item xs={12} sm={6} md={4}>
                <LoginForm handleLogin={handleLogin} />
              </Grid>
            </Grid>
          ) : (
            <>
              {/* Chat nach oben versetzen */}
              <Box
                sx={{
                  marginTop: 2,
                  marginBottom: 2,
                  border: "1px solid #ccc",
                  borderRadius: 2,
                  padding: 2,
                  backgroundColor: "#fff",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Chatverlauf mit {selectedUser}
                </Typography>

                {/* Auswahl des Chat-Partners (nur für Admin) */}
                {role === "Admin" && (
                  <Select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    fullWidth
                    sx={{ marginBottom: 2 }}
                  >
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="Test">Test</MenuItem>
                    <MenuItem value="Test1">Test1</MenuItem>
                  </Select>
                )}

                {/* Scrollbarer Bereich für den Chatverlauf */}
                <Box
                  sx={{
                    maxHeight: "300px", // Maximale Höhe des Chatverlaufs
                    overflowY: "auto", // Scrollen aktivieren
                    marginBottom: 2,
                  }}
                >
                  {messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg.message}
                      sender={msg.sender}
                      timestamp={msg.created_at}
                      isOwnMessage={msg.sender === loggedInUser}
                    />
                  ))}
                </Box>

                {/* Eingabefeld für neue Nachrichten */}
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField
                    label="Neue Nachricht"
                    variant="outlined"
                    fullWidth
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        sendMessage(); // Nachricht mit Enter senden
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={sendMessage}
                  >
                    Senden
                  </Button>
                </Box>
              </Box>

              {/* EntryList-Komponente */}
              <EntryList
                entries={entries}
                setEntries={setEntries}
                role={role}
                loggedInUser={loggedInUser}
              />
            </>
          )}
        </Suspense>
        {/* Snackbar für Login-Feedback */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </StyledContainer>
    </ThemeProvider>
  );
};

export default App;
