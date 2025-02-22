import React, { useState, useEffect, useMemo } from "react";
import {
  Typography,
  TextField,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Select,
  MenuItem,
  Fade,
  Snackbar,
  Alert,
  AppBar,
  Toolbar,
  Grid,
  useMediaQuery,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BackupIcon from "@mui/icons-material/Backup";
import { supabase } from "./supabaseClient";
import { useTheme } from "@mui/material/styles";

// Helper functions
const formatDate = (date) => {
  if (!date || isNaN(new Date(date).getTime())) return "NaN.NaN.NaN";
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}.${d.getFullYear()}`;
};

const generateUsername = (owner) => {
  const randomNum = Math.floor(100 + Math.random() * 900);
  if (owner === "Scholli") return `${randomNum}-telucod-5`;
  if (owner === "Jamaica05") return `${randomNum}-pricod-4`;
  if (owner === "Admin") return `${randomNum}-adlucod-0`;
  return `${randomNum}-siksuk`;
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const ImportBackup = ({ setSnackbarOpen, setSnackbarMessage }) => {
  const [file, setFile] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleFileChange = (event) => setFile(event.target.files[0]);

  const importBackup = async () => {
    if (!file) {
      setSnackbarMessage("Bitte wählen Sie eine Datei aus.");
      setSnackbarOpen(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        for (const entry of jsonData) {
          const { error } = await supabase.from("entries").insert([entry]).select();
          if (error) throw error;
        }
        setSnackbarMessage("Backup erfolgreich importiert!");
        setSnackbarOpen(true);
      } catch (error) {
        setSnackbarMessage("Fehler beim Importieren des Backups.");
        setSnackbarOpen(true);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 1 }}>
      <input type="file" accept=".json" onChange={handleFileChange} style={{ width: isMobile ? "100%" : "auto" }} />
      <Button variant="contained" color="primary" onClick={importBackup} fullWidth={isMobile}>
        Backup importieren
      </Button>
    </Box>
  );
};

const EntryList = ({ entries, setEntries, role, loggedInUser }) => {
  const [openCreateEntryDialog, setOpenCreateEntryDialog] = useState(false);
  const [openManualEntryDialog, setOpenManualEntryDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [selectedUser, setSelectedUser] = useState("");
  const [newEntry, setNewEntry] = useState({
    username: "",
    password: "",
    aliasNotes: "",
    type: "Premium",
    status: "Inaktiv",
    paymentStatus: "Nicht gezahlt",
    createdAt: new Date(),
    validUntil: new Date(new Date().getFullYear(), 11, 31),
    owner: loggedInUser,
    extensionHistory: [],
    bougetList: "",
  });
  const [manualEntry, setManualEntry] = useState({
    username: "",
    password: "",
    aliasNotes: "",
    type: "Premium",
    validUntil: new Date(new Date().getFullYear(), 11, 31),
    owner: loggedInUser,
    extensionHistory: [],
    bougetList: "",
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("entries").select("*");
        if (error) throw error;
        setEntries(data);
      } catch (error) {
        setSnackbarMessage("Fehler beim Abrufen der Einträge.");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, []);

  const handleOpenCreateEntryDialog = () => {
    const username = generateUsername(loggedInUser);
    const randomPassword = Math.random().toString(36).slice(-8);
    setNewEntry({
      ...newEntry,
      username,
      password: randomPassword,
    });
    setOpenCreateEntryDialog(true);
  };

  const handleOpenManualEntryDialog = () => setOpenManualEntryDialog(true);

  const createEntry = async () => {
    if (!newEntry.aliasNotes.trim() || !newEntry.username.trim()) {
      setSnackbarMessage("Bitte Spitzname und Benutzername eingeben.");
      setSnackbarOpen(true);
      return;
    }
    try {
      const { data, error } = await supabase.from("entries").insert([newEntry]).select();
      if (error) throw error;
      setEntries((prev) => [data[0], ...prev]);
      setOpenCreateEntryDialog(false);
      setSnackbarMessage("Neuer Abonnent erfolgreich angelegt!");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("Fehler beim Hinzufügen des Eintrags.");
      setSnackbarOpen(true);
    }
  };

  const handleAddManualEntry = async () => {
    if (!manualEntry.username || !manualEntry.password || !manualEntry.aliasNotes) {
      setSnackbarMessage("Bitte füllen Sie alle Felder aus.");
      setSnackbarOpen(true);
      return;
    }
    const newManualEntry = {
      ...manualEntry,
      status: "Aktiv",
      paymentStatus: "Gezahlt",
      createdAt: new Date(),
      note: "Dieser Abonnent besteht bereits",
    };
    try {
      const { data, error } = await supabase.from("entries").insert([newManualEntry]).select();
      if (error) throw error;
      setEntries((prev) => [data[0], ...prev]);
      setOpenManualEntryDialog(false);
      setSnackbarMessage("Bestehender Abonnent erfolgreich eingepflegt!");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("Fehler beim Hinzufügen des manuellen Eintrags.");
      setSnackbarOpen(true);
    }
  };

  const changePaymentStatus = async (entryId, paymentStatus) => {
    try {
      const { error } = await supabase.from("entries").update({ paymentStatus }).eq("id", entryId);
      if (error) throw error;
      setEntries((prev) => prev.map((entry) => (entry.id === entryId ? { ...entry, paymentStatus } : entry)));
    } catch (error) {
      setSnackbarMessage("Fehler beim Aktualisieren des Zahlungsstatus.");
      setSnackbarOpen(true);
    }
  };

  const changeStatus = async (entryId, newStatus) => {
    try {
      const { error } = await supabase.from("entries").update({ status: newStatus }).eq("id", entryId);
      if (error) throw error;
      setEntries((prev) => prev.map((entry) => (entry.id === entryId ? { ...entry, status: newStatus } : entry)));
      setSnackbarMessage(`Status erfolgreich auf "${newStatus}" geändert.`);
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("Fehler beim Ändern des Status.");
      setSnackbarOpen(true);
    }
  };

  const deleteEntry = async (entryId) => {
    try {
      const { error } = await supabase.from("entries").delete().eq("id", entryId);
      if (error) throw error;
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    } catch (error) {
      setSnackbarMessage("Fehler beim Löschen des Eintrags.");
      setSnackbarOpen(true);
    }
  };

  const requestExtension = async (entryId) => {
    try {
      const { error } = await supabase
        .from("entries")
        .update({ extensionRequest: { pending: true, approved: false } })
        .eq("id", entryId);
      if (error) throw error;
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId ? { ...entry, extensionRequest: { pending: true, approved: false } } : entry
        )
      );
      setSnackbarMessage("Anfrage zur Verlängerung gesendet.");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("Fehler beim Senden der Anfrage.");
      setSnackbarOpen(true);
    }
  };

  const approveExtension = async (entryId) => {
    const entry = entries.find((entry) => entry.id === entryId);
    const newValidUntil = new Date(entry.validUntil);
    newValidUntil.setFullYear(newValidUntil.getFullYear() + 1);
    const updatedEntry = {
      validUntil: newValidUntil,
      extensionRequest: { pending: false, approved: true, approvalDate: new Date() },
      extensionHistory: [...(entry.extensionHistory || []), { approvalDate: new Date(), validUntil: newValidUntil }],
    };
    try {
      const { error } = await supabase.from("entries").update(updatedEntry).eq("id", entryId);
      if (error) throw error;
      setEntries((prev) => prev.map((entry) => (entry.id === entryId ? { ...entry, ...updatedEntry } : entry)));
      setSnackbarMessage("Verlängerung genehmigt.");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("Fehler beim Genehmigen der Verlängerung.");
      setSnackbarOpen(true);
    }
  };

  const getStatusColor = (status) => (status === "Aktiv" ? "green" : status === "Inaktiv" ? "red" : "black");
  const getPaymentStatusColor = (paymentStatus) =>
    paymentStatus === "Gezahlt" ? "green" : paymentStatus === "Nicht gezahlt" ? "red" : "black";

  const filterEntries = useMemo(() => {
    return entries
      .filter((entry) =>
        role === "Admin" ? (selectedUser ? entry.owner === selectedUser : true) : entry.owner === loggedInUser
      )
      .filter((entry) =>
        [entry.username, entry.aliasNotes].some((field) =>
          field?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        )
      );
  }, [entries, role, selectedUser, loggedInUser, debouncedSearchTerm]);

  const uniqueOwners = [...new Set(entries.map((entry) => entry.owner))];
  const countEntriesByOwner = (owner) => entries.filter((entry) => entry.owner === owner).length;

  const exportEntries = () => {
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
  };

  const entryCount = countEntriesByOwner(loggedInUser);
  const motivationMessage = entryCount >= 25
    ? "🎉 Wow! 25+ Einträge! Deine Kreativität kennt keine Grenzen!"
    : entryCount >= 20
    ? "🎉 Großartig! 20+ Einträge! Nur noch 5 bis zu 25!"
    : entryCount >= 15
    ? "🎉 Fantastisch! 15+ Einträge! Nur noch 5 bis zu 20!"
    : entryCount >= 10
    ? "🎉 Super! 10+ Einträge! Auf dem Weg zu 15!"
    : entryCount > 0
    ? `🎉 ${entryCount} Einträge! Weiter so zum nächsten Meilenstein!`
    : "🎉 Starte jetzt mit deinem ersten Eintrag!";

  return (
    <Box sx={{ padding: isMobile ? 1 : 2, maxWidth: "100%", overflowX: "hidden" }}>
      <AppBar position="static" sx={{ mb: 2 }}>
        <Toolbar sx={{ flexDirection: isMobile ? "column" : "row", gap: 1, py: 1 }}>
          {role === "Admin" && (
            <>
              <ImportBackup setSnackbarOpen={setSnackbarOpen} setSnackbarMessage={setSnackbarMessage} />
              <Button
                variant="contained"
                color="secondary"
                startIcon={<BackupIcon />}
                onClick={exportEntries}
                fullWidth={isMobile}
              >
                Backup erstellen
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6}>
          <Button
            onClick={handleOpenCreateEntryDialog}
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            fullWidth
          >
            Neuer Abonnent
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            onClick={handleOpenManualEntryDialog}
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            fullWidth
          >
            Bestehender Abonnent
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ mb: 2, textAlign: isMobile ? "center" : "right" }}>
        <Typography variant="h6">🎉 {entryCount} Einträge erstellt!</Typography>
        {entryCount > 0 && (
          <Fade in={true} timeout={1000}>
            <Typography variant="body2" color="success.main">
              {motivationMessage}
            </Typography>
          </Fade>
        )}
      </Box>

      {role === "Admin" && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Ersteller filtern:</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {uniqueOwners.map((owner) => (
              <Button
                key={owner}
                variant={selectedUser === owner ? "contained" : "outlined"}
                onClick={() => setSelectedUser(owner)}
                size={isMobile ? "small" : "medium"}
              >
                {owner} ({countEntriesByOwner(owner)})
              </Button>
            ))}
            <Button variant="outlined" onClick={() => setSelectedUser("")} size={isMobile ? "small" : "medium"}>
              Alle
            </Button>
          </Box>
        </Box>
      )}

      <TextField
        label="🔍 Suche Benutzername/Spitzname"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Divider sx={{ my: 2 }} />

      {loading ? (
        <Typography textAlign="center">🚀 Lade Einträge...</Typography>
      ) : filterEntries.length > 0 ? (
        filterEntries.map((entry) => (
          <Accordion key={entry.id} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ width: "100%" }}>
                <Typography variant="subtitle1">
                  <strong>{entry.username}</strong> | {entry.aliasNotes}
                  {entry.note && <span style={{ color: "red" }}> ({entry.note})</span>}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Erstellt von: {entry.owner}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={1}>
                <Grid item xs={6}><Typography><strong>Typ:</strong> {entry.type}</Typography></Grid>
                <Grid item xs={6}><Typography><strong>Passwort:</strong> {entry.password}</Typography></Grid>
                <Grid item xs={12}><Typography><strong>Bouget-Liste:</strong> {entry.bougetList}</Typography></Grid>
                <Grid item xs={6}><Typography color={getStatusColor(entry.status)}><strong>Status:</strong> {entry.status}</Typography></Grid>
                <Grid item xs={6}><Typography color={getPaymentStatusColor(entry.paymentStatus)}><strong>Zahlung:</strong> {entry.paymentStatus}</Typography></Grid>
                <Grid item xs={6}><Typography><strong>Erstellt:</strong> {formatDate(entry.createdAt)}</Typography></Grid>
                <Grid item xs={6}><Typography><strong>Gültig bis:</strong> {formatDate(entry.validUntil)}</Typography></Grid>
              </Grid>
              <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Button variant="contained" color="primary" onClick={() => requestExtension(entry.id)} size={isMobile ? "small" : "medium"}>
                  +1 Jahr
                </Button>
                {role === "Admin" && (
                  <>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => changeStatus(entry.id, entry.status === "Aktiv" ? "Inaktiv" : "Aktiv")}
                      size={isMobile ? "small" : "medium"}
                    >
                      {entry.status === "Aktiv" ? "Inaktiv" : "Aktiv"}
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() =>
                        changePaymentStatus(entry.id, entry.paymentStatus === "Gezahlt" ? "Nicht gezahlt" : "Gezahlt")
                      }
                      size={isMobile ? "small" : "medium"}
                    >
                      {entry.paymentStatus === "Gezahlt" ? "Nicht gezahlt" : "Gezahlt"}
                    </Button>
                    <Button variant="contained" color="error" onClick={() => deleteEntry(entry.id)} startIcon={<DeleteIcon />} size={isMobile ? "small" : "medium"}>
                      Löschen
                    </Button>
                    <Button variant="contained" color="success" onClick={() => approveExtension(entry.id)} size={isMobile ? "small" : "medium"}>
                      Genehmigen
                    </Button>
                  </>
                )}
              </Box>
              {role === "Admin" && entry.extensionHistory?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2"><strong>Verlängerungen:</strong></Typography>
                  {entry.extensionHistory.map((ext, idx) => (
                    <Typography key={idx} variant="body2">
                      {formatDate(ext.approvalDate)} - {formatDate(ext.validUntil)}
                    </Typography>
                  ))}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <Typography textAlign="center">🚀 Keine Einträge gefunden.</Typography>
      )}

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Dialog open={openCreateEntryDialog} onClose={() => setOpenCreateEntryDialog(false)} fullScreen={isMobile}>
        <DialogTitle>Neuer Abonnent</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Spitzname/Notizen"
                fullWidth
                value={newEntry.aliasNotes}
                onChange={(e) => setNewEntry({ ...newEntry, aliasNotes: e.target.value })}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Bouget-Liste"
                fullWidth
                value={newEntry.bougetList}
                onChange={(e) => setNewEntry({ ...newEntry, bougetList: e.target.value })}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <Select
                fullWidth
                value={newEntry.type}
                onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                variant="outlined"
              >
                <MenuItem value="Premium">Premium</MenuItem>
                <MenuItem value="Basic">Basic</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Benutzername" fullWidth value={newEntry.username} disabled variant="outlined" />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Passwort" fullWidth type="password" value={newEntry.password} disabled variant="outlined" />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2">
                <strong>Erstellt:</strong> {formatDate(new Date())} | <strong>Gültig bis:</strong> {formatDate(newEntry.validUntil)}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateEntryDialog(false)} color="secondary" fullWidth={isMobile}>Abbrechen</Button>
          <Button onClick={createEntry} color="primary" fullWidth={isMobile}>Hinzufügen</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openManualEntryDialog} onClose={() => setOpenManualEntryDialog(false)} fullScreen={isMobile}>
        <DialogTitle>Bestehender Abonnent</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Benutzername"
                fullWidth
                value={manualEntry.username}
                onChange={(e) => setManualEntry({ ...manualEntry, username: e.target.value })}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Passwort"
                fullWidth
                type="password"
                value={manualEntry.password}
                onChange={(e) => setManualEntry({ ...manualEntry, password: e.target.value })}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Spitzname/Notizen"
                fullWidth
                value={manualEntry.aliasNotes}
                onChange={(e) => setManualEntry({ ...manualEntry, aliasNotes: e.target.value })}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Bouget-Liste"
                fullWidth
                value={manualEntry.bougetList}
                onChange={(e) => setManualEntry({ ...manualEntry, bougetList: e.target.value })}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <Select
                fullWidth
                value={manualEntry.type}
                onChange={(e) => setManualEntry({ ...manualEntry, type: e.target.value })}
                variant="outlined"
              >
                <MenuItem value="Premium">Premium</MenuItem>
                <MenuItem value="Basic">Basic</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Gültig bis"
                fullWidth
                type="date"
                value={manualEntry.validUntil.toISOString().split("T")[0]}
                onChange={(e) => setManualEntry({ ...manualEntry, validUntil: new Date(e.target.value) })}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenManualEntryDialog(false)} color="secondary" fullWidth={isMobile}>Abbrechen</Button>
          <Button onClick={handleAddManualEntry} color="primary" fullWidth={isMobile}>Hinzufügen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EntryList;
