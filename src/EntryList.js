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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BackupIcon from "@mui/icons-material/Backup";
import { supabase } from "./supabaseClient";

// Helper functions
const formatDate = (date) => {
  if (!date || isNaN(new Date(date).getTime())) return "NaN.NaN.NaN";
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}.${d.getFullYear()}`;
};

const generateUsername = (owner) => {
  const randomNum = Math.floor(100 + Math.random() * 900); // Zufällige Zahl zwischen 100 und 900

  // Benutzername basierend auf dem Ersteller generieren
  if (owner === "Test") {
    return `${randomNum}-telucod-5`;
  } else if (owner === "Test1") {
    return `${randomNum}-pricod-4`;
  } else if (owner === "Admin") {
    return `${randomNum}-adlucod-0`;
  } else {
    // Fallback für unbekannte Ersteller
    return `${randomNum}-siksuk`;
  }
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const ImportBackup = ({ setSnackbarOpen, setSnackbarMessage }) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

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
          const { error } = await supabase
            .from("entries")
            .insert([entry])
            .select();

          if (error) {
            console.error("Fehler beim Importieren des Eintrags:", error);
          }
        }
        setSnackbarMessage("Backup erfolgreich importiert!");
        setSnackbarOpen(true);
      } catch (error) {
        console.error("Fehler beim Importieren des Backups: ", error);
        setSnackbarMessage("Fehler beim Importieren des Backups.");
        setSnackbarOpen(true);
      }
    };

    reader.readAsText(file);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <input type="file" accept=".json" onChange={handleFileChange} />
      <Button
        variant="contained"
        color="primary"
        onClick={importBackup}
        sx={{ marginLeft: 2 }}
      >
        Backup importieren
      </Button>
    </Box>
  );
};

const EntryList = ({ entries, setEntries, role, loggedInUser }) => {
  const [openCreateEntryDialog, setOpenCreateEntryDialog] = useState(false);
  const [openManualEntryDialog, setOpenManualEntryDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
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
    bougetList: "", // Neues Feld für die Bouget-Liste
  });
  const [manualEntry, setManualEntry] = useState({
    username: "",
    password: "",
    aliasNotes: "",
    validUntil: new Date(new Date().getFullYear(), 11, 31),
    owner: loggedInUser,
    extensionHistory: [],
    bougetList: "", // Neues Feld für die Bouget-Liste
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    setDebouncedSearchTerm(debouncedSearch);
  }, [debouncedSearch]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data: entriesData, error } = await supabase
        .from("entries")
        .select("*");

      if (error) {
        console.error("Fehler beim Abrufen der Einträge:", error);
        setSnackbarMessage("Fehler beim Abrufen der Einträge.");
        setSnackbarOpen(true);
      } else {
        setEntries(entriesData);
      }
    } catch (error) {
      console.error("Fehler beim Abrufen der Einträge: ", error);
      setSnackbarMessage("Fehler beim Abrufen der Einträge.");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleOpenCreateEntryDialog = () => {
    const username = generateUsername(loggedInUser); // Benutzername basierend auf dem Ersteller generieren
    const randomPassword = Math.random().toString(36).slice(-8); // Zufälliges Passwort generieren

    setNewEntry({
      username: username,
      password: randomPassword,
      aliasNotes: "",
      type: "Premium",
      status: "Inaktiv",
      paymentStatus: "Nicht gezahlt",
      createdAt: new Date(),
      validUntil: new Date(new Date().getFullYear(), 11, 31),
      owner: loggedInUser,
      extensionHistory: [],
      bougetList: "", // Neues Feld für die Bouget-Liste
    });

    setOpenCreateEntryDialog(true);
  };

  const handleOpenManualEntryDialog = () => {
    setManualEntry({
      username: "",
      password: "",
      aliasNotes: "",
      validUntil: new Date(new Date().getFullYear(), 11, 31),
      owner: loggedInUser,
      extensionHistory: [],
      bougetList: "", // Neues Feld für die Bouget-Liste
    });
    setOpenManualEntryDialog(true);
  };

  const createEntry = async () => {
    if (!newEntry.aliasNotes.trim() || !newEntry.username.trim()) {
      setSnackbarMessage("Bitte Spitzname und Benutzername eingeben.");
      setSnackbarOpen(true);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("entries")
        .insert([newEntry])
        .select();

      if (error) {
        console.error("Fehler beim Hinzufügen des Eintrags:", error);
        setSnackbarMessage("Fehler beim Hinzufügen des Eintrags.");
        setSnackbarOpen(true);
      } else {
        setEntries((prevEntries) => [data[0], ...prevEntries]);
        setOpenCreateEntryDialog(false);
        setSnackbarMessage("Neuer Abonnent erfolgreich angelegt!");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Eintrags: ", error);
      setSnackbarMessage("Fehler beim Hinzufügen des Eintrags.");
      setSnackbarOpen(true);
    }
  };

  const handleAddManualEntry = async () => {
    if (
      !manualEntry.username ||
      !manualEntry.password ||
      !manualEntry.aliasNotes
    ) {
      setSnackbarMessage("Bitte füllen Sie alle Felder aus.");
      setSnackbarOpen(true);
      return;
    }

    const validUntilDate = new Date(manualEntry.validUntil);
    const newManualEntry = {
      username: manualEntry.username,
      password: manualEntry.password,
      aliasNotes: manualEntry.aliasNotes,
      validUntil: validUntilDate,
      owner: loggedInUser,
      status: "Aktiv",
      paymentStatus: "Gezahlt",
      createdAt: new Date(),
      note: "Dieser Abonnent besteht bereits",
      extensionHistory: [],
      bougetList: manualEntry.bougetList, // Neues Feld für die Bouget-Liste
    };

    try {
      const { data, error } = await supabase
        .from("entries")
        .insert([newManualEntry])
        .select();

      if (error) {
        console.error("Fehler beim Hinzufügen des manuellen Eintrags:", error);
        setSnackbarMessage("Fehler beim Hinzufügen des manuellen Eintrags.");
        setSnackbarOpen(true);
      } else {
        setEntries((prevEntries) => [data[0], ...prevEntries]);
        setOpenManualEntryDialog(false);
        setSnackbarMessage("Bestehender Abonnent erfolgreich eingepflegt!");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Fehler beim Hinzufügen des manuellen Eintrags: ", error);
      setSnackbarMessage("Fehler beim Hinzufügen des manuellen Eintrags.");
      setSnackbarOpen(true);
    }
  };

  const changePaymentStatus = async (entryId, paymentStatus) => {
    try {
      const { error } = await supabase
        .from("entries")
        .update({ paymentStatus })
        .eq("id", entryId);

      if (error) {
        console.error("Fehler beim Aktualisieren des Zahlungsstatus:", error);
        setSnackbarMessage("Fehler beim Aktualisieren des Zahlungsstatus.");
        setSnackbarOpen(true);
      } else {
        setEntries((prevEntries) =>
          prevEntries.map((entry) =>
            entry.id === entryId ? { ...entry, paymentStatus } : entry
          )
        );
      }
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Zahlungsstatus: ", error);
      setSnackbarMessage("Fehler beim Aktualisieren des Zahlungsstatus.");
      setSnackbarOpen(true);
    }
  };

  const changeStatus = async (entryId, newStatus) => {
    try {
      const { error } = await supabase
        .from("entries")
        .update({ status: newStatus })
        .eq("id", entryId);

      if (error) {
        console.error("Fehler beim Ändern des Status:", error);
        setSnackbarMessage("Fehler beim Ändern des Status.");
        setSnackbarOpen(true);
      } else {
        setEntries((prevEntries) =>
          prevEntries.map((entry) =>
            entry.id === entryId ? { ...entry, status: newStatus } : entry
          )
        );
        setSnackbarMessage(`Status erfolgreich auf "${newStatus}" geändert.`);
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Fehler beim Ändern des Status: ", error);
      setSnackbarMessage("Fehler beim Ändern des Status.");
      setSnackbarOpen(true);
    }
  };

  const deleteEntry = async (entryId) => {
    try {
      const { error } = await supabase
        .from("entries")
        .delete()
        .eq("id", entryId);

      if (error) {
        console.error("Fehler beim Löschen des Eintrags:", error);
        setSnackbarMessage("Fehler beim Löschen des Eintrags.");
        setSnackbarOpen(true);
      } else {
        setEntries((prevEntries) =>
          prevEntries.filter((entry) => entry.id !== entryId)
        );
      }
    } catch (error) {
      console.error("Fehler beim Löschen des Eintrags: ", error);
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

      if (error) {
        console.error("Fehler beim Senden der Verlängerungsanfrage:", error);
        setSnackbarMessage("Fehler beim Senden der Anfrage.");
        setSnackbarOpen(true);
      } else {
        setEntries((prevEntries) =>
          prevEntries.map((entry) =>
            entry.id === entryId
              ? {
                  ...entry,
                  extensionRequest: { pending: true, approved: false },
                }
              : entry
          )
        );
        setSnackbarMessage("Anfrage zur Verlängerung gesendet.");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Fehler beim Senden der Verlängerungsanfrage: ", error);
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
      extensionRequest: {
        pending: false,
        approved: true,
        approvalDate: new Date(),
      },
      extensionHistory: [
        ...(entry.extensionHistory || []),
        {
          approvalDate: new Date(),
          validUntil: newValidUntil,
        },
      ],
    };

    try {
      const { error } = await supabase
        .from("entries")
        .update(updatedEntry)
        .eq("id", entryId);

      if (error) {
        console.error("Fehler beim Genehmigen der Verlängerung:", error);
        setSnackbarMessage("Fehler beim Genehmigen der Verlängerung.");
        setSnackbarOpen(true);
      } else {
        setEntries((prevEntries) =>
          prevEntries.map((entry) =>
            entry.id === entryId ? { ...entry, ...updatedEntry } : entry
          )
        );
        setSnackbarMessage("Verlängerung genehmigt.");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Fehler beim Genehmigen der Verlängerung: ", error);
      setSnackbarMessage("Fehler beim Genehmigen der Verlängerung.");
      setSnackbarOpen(true);
    }
  };

  const getStatusColor = (status) => {
    return status === "Aktiv"
      ? "green"
      : status === "Inaktiv"
      ? "red"
      : "black";
  };

  const getPaymentStatusColor = (paymentStatus) => {
    return paymentStatus === "Gezahlt"
      ? "green"
      : paymentStatus === "Nicht gezahlt"
      ? "red"
      : "black";
  };

  const filterEntries = useMemo(() => {
    return entries
      .filter((entry) =>
        role === "Admin"
          ? selectedUser
            ? entry.owner === selectedUser
            : true
          : entry.owner === loggedInUser
      )
      .filter(
        (entry) =>
          (entry.username && entry.username.includes(debouncedSearchTerm)) ||
          (entry.aliasNotes && entry.aliasNotes.includes(debouncedSearchTerm))
      );
  }, [entries, role, selectedUser, loggedInUser, debouncedSearchTerm]);

  const uniqueOwners = [...new Set(entries.map((entry) => entry.owner))];
  const countEntriesByOwner = (owner) => {
    return entries.filter((entry) => entry.owner === owner).length;
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

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
  let motivationMessage = "";
  if (entryCount >= 10 && entryCount < 15) {
    motivationMessage =
      "🎉 Super! Du hast bereits 10 Einträge erreicht! Mach weiter so, du bist auf dem besten Weg zu 15!";
  } else if (entryCount >= 15 && entryCount < 20) {
    motivationMessage =
      "🎉 Fantastisch! 15 Einträge sind erreicht! Nur noch 5 bis zu 20! Lass uns das schaffen!";
  } else if (entryCount >= 20 && entryCount < 25) {
    motivationMessage =
      "🎉 Großartig! Du hast 20 Einträge! Nur noch 5 bis zu 25! Weiter so!";
  } else if (entryCount >= 25) {
    motivationMessage =
      "🎉 Wow! Du hast 25 Einträge erreicht! Deine Kreativität kennt keine Grenzen! Mach weiter so!";
  } else if (entryCount > 0) {
    motivationMessage = `🎉 Du hast ${entryCount} Einträge erstellt! Weiter so, der nächste Meilenstein ist 5!`;
  } else {
    motivationMessage =
      "🎉 Du hast noch keine Einträge erstellt. Lass uns mit dem ersten Eintrag beginnen!";
  }

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          {role === "Admin" && (
            <>
              <ImportBackup
                setSnackbarOpen={setSnackbarOpen}
                setSnackbarMessage={setSnackbarMessage}
              />
              <Button
                variant="contained"
                color="secondary"
                startIcon={<BackupIcon />}
                onClick={exportEntries}
                sx={{ marginLeft: 2 }}
              >
                Backup erstellen
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          marginBottom: 3,
          marginTop: 3,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Button
            onClick={handleOpenCreateEntryDialog}
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
          >
            Abonnent anlegen
          </Button>
          <Button
            onClick={handleOpenManualEntryDialog}
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
          >
            Bestehenden Abonnenten einpflegen
          </Button>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="h6">
            🎉 Du hast {countEntriesByOwner(loggedInUser)} Einträge erstellt!
          </Typography>
          {entryCount >= 5 && (
            <Fade in={true} timeout={1000}>
              <Typography variant="body2" color="success.main">
                {motivationMessage}
              </Typography>
            </Fade>
          )}
        </Box>
      </Box>
      {role === "Admin" && (
        <Box sx={{ marginBottom: 3 }}>
          <Typography variant="h6">Ersteller filtern:</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {uniqueOwners.map((owner, index) => (
              <Button
                key={index}
                variant="outlined"
                onClick={() => setSelectedUser(owner)}
                color={selectedUser === owner ? "primary" : "default"}
              >
                {owner} ({countEntriesByOwner(owner)})
              </Button>
            ))}
            <Button variant="outlined" onClick={() => setSelectedUser("")}>
              Alle anzeigen
            </Button>
          </Box>
        </Box>
      )}
      <TextField
        label="🔍 Suchen nach Benutzername oder Spitzname"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ marginBottom: 3 }}
      />
      <Divider style={{ margin: "20px 0" }} />
      {loading ? (
        <Typography>🚀 Lade Einträge...</Typography>
      ) : filterEntries.length > 0 ? (
        filterEntries.map((entry, index) => (
          <Accordion key={index} sx={{ marginBottom: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>
                <strong>Erstellt von:</strong> {entry.owner} <br />
                <strong> Benutzername:</strong> {entry.username} |{" "}
                <strong> Passwort:</strong> {entry.password} |{" "}
                <strong> Spitzname:</strong> {entry.aliasNotes}
                {entry.note && (
                  <span style={{ color: "red" }}> ({entry.note})</span>
                )}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography style={{ color: "black" }}>
                <strong>Typ:</strong> {entry.type}
              </Typography>
              <Typography style={{ color: "black" }}>
                <strong>Bouget-Liste:</strong> {entry.bougetList}
              </Typography>
              <Typography style={{ color: getStatusColor(entry.status) }}>
                <strong>Status:</strong> {entry.status}
              </Typography>
              <Typography
                style={{ color: getPaymentStatusColor(entry.paymentStatus) }}
              >
                <strong>Zahlung:</strong> {entry.paymentStatus}
              </Typography>
              <Typography style={{ color: "black" }}>
                <strong>Erstellt am:</strong> {formatDate(entry.createdAt)}
              </Typography>
              <Typography style={{ color: "black" }}>
                <strong>Gültig bis:</strong> {formatDate(entry.validUntil)}
                {entry.extensionRequest && entry.extensionRequest.pending && (
                  <span style={{ color: "orange" }}>
                    {" "}
                    (Anfrage beim Admin gestellt)
                  </span>
                )}
                {entry.extensionRequest && entry.extensionRequest.approved && (
                  <span style={{ color: "green" }}>
                    {" "}
                    (Verlängerung genehmigt)
                  </span>
                )}
              </Typography>
              <Button
                onClick={async () => {
                  await requestExtension(entry.id);
                }}
                variant="contained"
                color="primary"
                sx={{ marginTop: 2 }}
              >
                +1 Jahr verlängern
              </Button>
              {role === "Admin" && (
                <Box sx={{ marginTop: 2 }}>
                  <Button
                    onClick={() =>
                      changeStatus(
                        entry.id,
                        entry.status === "Aktiv" ? "Inaktiv" : "Aktiv"
                      )
                    }
                    variant="contained"
                    color="secondary"
                    sx={{ marginRight: 1 }}
                  >
                    {entry.status === "Aktiv" ? "Setze Inaktiv" : "Setze Aktiv"}
                  </Button>
                  <Button
                    onClick={() =>
                      changePaymentStatus(
                        entry.id,
                        entry.paymentStatus === "Gezahlt"
                          ? "Nicht gezahlt"
                          : "Gezahlt"
                      )
                    }
                    variant="contained"
                    color="secondary"
                    sx={{ marginRight: 1 }}
                  >
                    {entry.paymentStatus === "Gezahlt"
                      ? "Setze Nicht gezahlt"
                      : "Setze Gezahlt"}
                  </Button>
                  <Button
                    onClick={() => deleteEntry(entry.id)}
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                  >
                    Löschen
                  </Button>
                  <Button
                    onClick={() => approveExtension(entry.id)}
                    variant="contained"
                    color="success"
                    sx={{ marginLeft: 1 }}
                  >
                    Verlängerung genehmigen
                  </Button>
                </Box>
              )}
              {role === "Admin" && (
                <Box sx={{ marginTop: 2 }}>
                  <Typography variant="body2">
                    <strong>Verlängerungshistorie:</strong>
                  </Typography>
                  {entry.extensionHistory &&
                  entry.extensionHistory.length > 0 ? (
                    entry.extensionHistory.map((extension, idx) => {
                      const approvalDate = extension.approvalDate
                        ? formatDate(extension.approvalDate)
                        : "NaN.NaN.NaN";
                      const validUntil = extension.validUntil
                        ? formatDate(extension.validUntil)
                        : "NaN.NaN.NaN";
                      return (
                        <Typography key={idx} variant="body2">
                          Verlängerung genehmigt am: {approvalDate} | Gültig
                          bis: {validUntil}
                        </Typography>
                      );
                    })
                  ) : (
                    <Typography variant="body2">
                      Keine Verlängerungen vorhanden.
                    </Typography>
                  )}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <Typography>🚀 Keine passenden Einträge gefunden.</Typography>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Dialog
        open={openCreateEntryDialog}
        onClose={() => setOpenCreateEntryDialog(false)}
      >
        <DialogTitle>Neuen Abonnenten anlegen</DialogTitle>
        <DialogContent>
          <TextField
            label="Spitzname, Notizen etc."
            fullWidth
            margin="normal"
            sx={{ backgroundColor: "#f0f8ff", borderRadius: "5px" }}
            value={newEntry.aliasNotes}
            onChange={(e) =>
              setNewEntry({ ...newEntry, aliasNotes: e.target.value })
            }
          />
          <TextField
            label="Bouget-Liste (z.B. GER, CH, USA, XXX usw... oder Alles)"
            fullWidth
            margin="normal"
            sx={{ backgroundColor: "#f0f8ff", borderRadius: "5px" }}
            value={newEntry.bougetList}
            onChange={(e) =>
              setNewEntry({ ...newEntry, bougetList: e.target.value })
            }
          />
          <Select
            fullWidth
            margin="normal"
            value={newEntry.type}
            onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
          >
            <MenuItem value="Premium">Premium</MenuItem>
            <MenuItem value="Basic">Basic</MenuItem>
          </Select>
          <TextField
            label="Benutzername"
            fullWidth
            margin="normal"
            value={newEntry.username}
            disabled
          />
          <TextField
            label="Passwort"
            fullWidth
            margin="normal"
            type="password"
            value={newEntry.password}
            disabled
          />
          <Typography variant="body1">
            <strong>Aktuelles Datum:</strong> {formatDate(new Date())}
          </Typography>
          <Typography variant="body1">
            <strong>Gültig bis:</strong> {formatDate(newEntry.validUntil)}{" "}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Benutzername und Passwort werden automatisch generiert.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenCreateEntryDialog(false)}
            color="secondary"
          >
            Abbrechen
          </Button>
          <Button onClick={createEntry} color="primary">
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openManualEntryDialog}
        onClose={() => setOpenManualEntryDialog(false)}
      >
        <DialogTitle>Bestehenden Abonnenten einpflegen</DialogTitle>
        <DialogContent>
          <TextField
            label="Benutzername"
            fullWidth
            margin="normal"
            value={manualEntry.username}
            onChange={(e) =>
              setManualEntry({ ...manualEntry, username: e.target.value })
            }
          />
          <TextField
            label="Passwort"
            fullWidth
            margin="normal"
            type="password"
            value={manualEntry.password}
            onChange={(e) =>
              setManualEntry({ ...manualEntry, password: e.target.value })
            }
          />
          <TextField
            label="Spitzname, Notizen etc."
            fullWidth
            margin="normal"
            value={manualEntry.aliasNotes}
            onChange={(e) =>
              setManualEntry({ ...manualEntry, aliasNotes: e.target.value })
            }
          />
          <TextField
            label="Bouget-Liste (z.B. GER, CH, USA, XXX usw... oder Alles)"
            fullWidth
            margin="normal"
            value={manualEntry.bougetList}
            onChange={(e) =>
              setManualEntry({ ...manualEntry, bougetList: e.target.value })
            }
          />
          <TextField
            label="Gültig bis"
            fullWidth
            margin="normal"
            type="date"
            value={manualEntry.validUntil.toISOString().split("T")[0]}
            onChange={(e) =>
              setManualEntry({
                ...manualEntry,
                validUntil: new Date(e.target.value),
              })
            }
          />
          <Typography variant="body1">
            <strong>Aktuelles Datum:</strong> {formatDate(new Date())}
          </Typography>
          <Typography variant="body1">
            <strong>Gültig bis:</strong> {formatDate(manualEntry.validUntil)}{" "}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Hier trägst du deine bereits aktiven Mitglieder ein.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenManualEntryDialog(false)}
            color="secondary"
          >
            Abbrechen
          </Button>
          <Button onClick={handleAddManualEntry} color="primary">
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default EntryList;
