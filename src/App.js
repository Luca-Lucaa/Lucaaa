import React, { useState, useEffect, Suspense, lazy, useCallback, useMemo } from "react";
import {
  Container,
  Typography,
  Grid,
  AppBar,
  Toolbar,
  Button,
  Snackbar,
  Box,
  Alert,
  TextField,
  Badge,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import BackupIcon from "@mui/icons-material/Backup";
import DescriptionIcon from "@mui/icons-material/Description";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { styled, ThemeProvider, createTheme } from "@mui/material/styles";
import { supabase } from "./supabaseClient";
import ChatMessage from "./ChatMessage";
import { useMessages, handleError } from "./utils";
import { USER_CREDENTIALS, USER_EMOJIS, THEME_CONFIG, GUIDES } from "./config";
import { useSnackbar } from "./useSnackbar";

const LoginForm = lazy(() => import("./LoginForm"));
const EntryList = lazy(() => import("./EntryList"));
const AdminDashboard = lazy(() => import("./AdminDashboard"));

const StyledContainer = styled(Container)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  minHeight: "100vh",
  padding: "20px",
  color: theme.palette.text.primary,
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
}));

const theme = createTheme(THEME_CONFIG);

const CustomSnackbar = ({ open, message, onClose, severity }) => (
  <Snackbar open={open} autoHideDuration={4000} onClose={onClose}>
    <Alert onClose={onClose} severity={severity} sx={{ width: "100%" }}>
      {message}
    </Alert>
  </Snackbar>
);

const App = () => {
  const [loggedInUser, setLoggedInUser] = useState(() => localStorage.getItem("loggedInUser") || null);
  const [role, setRole] = useState(() => localStorage.getItem("role") || null);
  const [selectedUser, setSelectedUser] = useState(role === "Admin" ? "Scholli" : "Admin");
  const [newMessage, setNewMessage] = useState("");
  const [entries, setEntries] = useState([]);
  const [file, setFile] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [guidesAnchorEl, setGuidesAnchorEl] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openManualDialog, setOpenManualDialog] = useState(false);

  const { messages, unreadCount, markAsRead } = useMessages(loggedInUser, selectedUser);
  const { snackbarOpen, snackbarMessage, snackbarSeverity, showSnackbar, closeSnackbar } = useSnackbar();

  const handleLogin = useCallback((username, password) => {
    if (USER_CREDENTIALS[username] === password) {
      setLoggedInUser(username);
      setRole(username === "Admin" ? "Admin" : "Friend");
      localStorage.setItem("loggedInUser", username);
      localStorage.setItem("role", username === "Admin" ? "Admin" : "Friend");
      setSelectedUser(username === "Admin" ? "Scholli" : "Admin");
      showSnackbar(`✅ Willkommen, ${username}!`);
    } else {
      showSnackbar("❌ Ungültige Zugangsdaten", "error");
    }
  }, [showSnackbar]);

  const handleLogout = useCallback(() => {
    setLoggedInUser(null);
    setRole(null);
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("role");
    showSnackbar("🔓 Erfolgreich abgemeldet!");
  }, [showSnackbar]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim()) {
      showSnackbar("❌ Nachricht darf nicht leer sein", "error");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert([{ sender: loggedInUser, receiver: selectedUser, message: newMessage, read: false }]);
      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      handleError(error, showSnackbar);
    } finally {
      setIsLoading(false);
    }
  }, [newMessage, loggedInUser, selectedUser, showSnackbar]);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("entries").select("*");
      if (error) throw error;
      setEntries(data);
    } catch (error) {
      handleError(error, showSnackbar);
    } finally {
      setIsLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    if (loggedInUser) {
      fetchEntries();
    }
  }, [loggedInUser, fetchEntries]);

  const exportEntries = useCallback(() => {
    const dataStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup_entries.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSnackbar("Backup erfolgreich erstellt!");
    setMenuAnchorEl(null);
  }, [entries, showSnackbar]);

  const handleFileChange = useCallback((event) => {
    setFile(event.target.files[0]);
  }, []);

  const importBackup = useCallback(async () => {
    if (!file) {
      showSnackbar("Bitte wählen Sie eine Datei aus.", "error");
      return;
    }
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        for (const entry of jsonData) {
          const { error } = await supabase.from("entries").insert([entry]);
          if (error) throw error;
        }
        setEntries((prev) => [...prev, ...jsonData]);
        showSnackbar("Backup erfolgreich importiert!");
        setFile(null);
        setImportDialogOpen(false);
      } catch (error) {
        handleError(error, showSnackbar);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  }, [file, showSnackbar]);

  const handleMenuClick = useCallback((event) => {
    setMenuAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
    setGuidesAnchorEl(null);
  }, []);

  const handleImportOpen = useCallback(() => {
    setImportDialogOpen(true);
    setMenuAnchorEl(null);
  }, []);

  const handleGuidesClick = useCallback((event) => {
    setGuidesAnchorEl(event.currentTarget || menuAnchorEl);
  }, [menuAnchorEl]);

  const handleGuidesClose = useCallback(() => {
    setGuidesAnchorEl(null);
  }, []);

  const handleGuideDownload = useCallback((path) => {
    window.open(path, "_blank");
    setGuidesAnchorEl(null);
    setMenuAnchorEl(null);
  }, []);

  const themeInstance = useTheme();
  const isMobile = useMediaQuery(themeInstance.breakpoints.down("sm"));

  useEffect(() => {
    if (selectedUser && messages.length > 0) {
      markAsRead();
    }
  }, [selectedUser, messages, markAsRead]);

  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  return (
    <ThemeProvider theme={theme}>
      <StyledContainer maxWidth="xl">
        <StyledAppBar position="static">
          <Toolbar>
            <Typography variant="h6">Luca-TV</Typography>
            {loggedInUser && (
              <Typography
                variant="h6"
                sx={{ marginLeft: "auto", marginRight: 2, fontSize: { xs: "14px", sm: "16px" } }}
              >
                {USER_EMOJIS[loggedInUser]} {loggedInUser}
              </Typography>
            )}
            {loggedInUser && (
              <Box sx={{ marginRight: 2 }}>
                {isMobile ? (
                  <IconButton variant="contained" color="secondary" onClick={handleMenuClick} sx={{ p: 0.5 }}>
                    <MenuIcon />
                  </IconButton>
                ) : (
                  <>
                    {role === "Admin" && (
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<BackupIcon />}
                        onClick={handleMenuClick}
                        sx={{ mr: 1, borderRadius: 2 }}
                      >
                        Backup
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<DescriptionIcon />}
                      onClick={handleGuidesClick}
                      sx={{ borderRadius: 2 }}
                    >
                      Anleitungen
                    </Button>
                  </>
                )}
                {isMobile ? (
                  <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
                    {role === "Admin" && (
                      <>
                        <MenuItem onClick={exportEntries}>Backup erstellen</MenuItem>
                        <MenuItem onClick={handleImportOpen}>Backup importieren</MenuItem>
                      </>
                    )}
                    <MenuItem
                      onClick={() => {
                        handleGuidesClick({ currentTarget: menuAnchorEl });
                        setMenuAnchorEl(null);
                      }}
                    >
                      Anleitungen
                    </MenuItem>
                  </Menu>
                ) : (
                  <>
                    <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
                      {role === "Admin" && (
                        <>
                          <MenuItem onClick={exportEntries}>Backup erstellen</MenuItem>
                          <MenuItem onClick={handleImportOpen}>Backup importieren</MenuItem>
                        </>
                      )}
                    </Menu>
                    <Menu anchorEl={guidesAnchorEl} open={Boolean(guidesAnchorEl)} onClose={handleGuidesClose}>
                      {GUIDES.map((guide) => (
                        <MenuItem key={guide.name} onClick={() => handleGuideDownload(guide.path)}>
                          {guide.name}
                        </MenuItem>
                      ))}
                    </Menu>
                  </>
                )}
              </Box>
            )}
            {loggedInUser && (
              <Button
                onClick={handleLogout}
                color="inherit"
                sx={{ fontSize: { xs: "12px", sm: "16px" }, borderRadius: 2 }}
              >
                🔓 Logout
              </Button>
            )}
          </Toolbar>
        </StyledAppBar>
        <Suspense fallback={<div>🔄 Lade...</div>}>
          {isLoading && <Typography sx={{ mt: 2 }}>🔄 Lade Daten...</Typography>}
          {!loggedInUser ? (
            <Grid container justifyContent="center" sx={{ mt: 4 }}>
              <Grid item xs={12} sm={6} md={4}>
                <LoginForm handleLogin={handleLogin} />
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Accordion expanded={chatExpanded} onChange={() => setChatExpanded(!chatExpanded)} sx={{ mb: 2, borderRadius: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Chat mit {selectedUser}</Typography>
                  {role === "Admin" && (
                    <Box sx={{ display: "flex", gap: 1, ml: 2 }}>
                      <Badge badgeContent={unreadCount["Scholli"] || 0} color="error">
                        <Button
                          variant={selectedUser === "Scholli" ? "contained" : "outlined"}
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser("Scholli");
                          }}
                          sx={{ minWidth: 0, p: 0.5, borderRadius: 2 }}
                        >
                          Scholli {USER_EMOJIS["Scholli"]}
                        </Button>
                      </Badge>
                      <Badge badgeContent={unreadCount["Jamaica05"] || 0} color="error">
                        <Button
                          variant={selectedUser === "Jamaica05" ? "contained" : "outlined"}
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser("Jamaica05");
                          }}
                          sx={{ minWidth: 0, p: 0.5, borderRadius: 2 }}
                        >
                          Jamaica05 {USER_EMOJIS["Jamaica05"]}
                        </Button>
                      </Badge>
                    </Box>
                  )}
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, mb: 2 }}>
                      <TextField
                        label="Neue Nachricht"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={2}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        disabled={isLoading}
                        sx={{ backgroundColor: "white", borderRadius: 2 }}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={sendMessage}
                        sx={{ width: { xs: "100%", sm: "auto" }, borderRadius: 2, alignSelf: "flex-end" }}
                        disabled={isLoading || !newMessage.trim()}
                      >
                        {isLoading ? "Sende..." : "Senden"}
                      </Button>
                    </Box>
                    <Box sx={{ maxHeight: "50vh", overflowY: "auto" }}>
                      {reversedMessages.map((msg) => (
                        <ChatMessage
                          key={msg.id}
                          message={msg.message}
                          sender={msg.sender}
                          timestamp={msg.created_at}
                          isOwnMessage={msg.sender === loggedInUser}
                        />
                      ))}
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
              {role === "Admin" ? (
                <>
                  <AdminDashboard
                    entries={entries}
                    loggedInUser={loggedInUser}
                    setOpenCreateDialog={setOpenCreateDialog}
                    setOpenManualDialog={setOpenManualDialog}
                    setEntries={setEntries}
                  />
                  <EntryList
                    role={role}
                    loggedInUser={loggedInUser}
                    entries={entries}
                    setEntries={setEntries}
                    openCreateDialog={openCreateDialog}
                    setOpenCreateDialog={setOpenCreateDialog}
                    openManualDialog={openManualDialog}
                    setOpenManualDialog={setOpenManualDialog}
                  />
                </>
              ) : (
                <EntryList
                  role={role}
                  loggedInUser={loggedInUser}
                  entries={entries}
                  setEntries={setEntries}
                  openCreateDialog={openCreateDialog}
                  setOpenCreateDialog={setOpenCreateDialog}
                  openManualDialog={openManualDialog}
                  setOpenManualDialog={setOpenManualDialog}
                />
              )}
            </Box>
          )}
        </Suspense>
        <CustomSnackbar
          open={snackbarOpen}
          message={snackbarMessage}
          onClose={closeSnackbar}
          severity={snackbarSeverity}
        />
        <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
          <DialogTitle>Backup importieren</DialogTitle>
          <DialogContent>
            <input type="file" accept=".json" onChange={handleFileChange} disabled={isLoading} />
            {file && (
              <Typography sx={{ mt: 2 }}>
                Ausgewählte Datei: {file.name}
              </Typography>
            )}
            {isLoading && <Typography>🔄 Importiere...</Typography>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setImportDialogOpen(false)} color="secondary" disabled={isLoading}>
              Abbrechen
            </Button>
            <Button onClick={importBackup} color="primary" disabled={isLoading || !file}>
              {isLoading ? "Importiere..." : "Importieren"}
            </Button>
          </DialogActions>
        </Dialog>
      </StyledContainer>
    </ThemeProvider>
  );
};

export default App;
