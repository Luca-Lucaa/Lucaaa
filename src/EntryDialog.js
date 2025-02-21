import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Button,
  Typography,
} from "@mui/material";
const EntryDialog = ({ open, onClose, entryData, onSave }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Neuen Abonnenten anlegen</DialogTitle>
      <DialogContent>
        <TextField
          label="Spitzname, Notizen etc."
          fullWidth
          margin="normal"
          value={entryData.aliasNotes}
          onChange={(e) => onSave({ ...entryData, aliasNotes: e.target.value })}
        />
        <Select
          fullWidth
          margin="normal"
          value={entryData.type}
          onChange={(e) => onSave({ ...entryData, type: e.target.value })}
        >
          <MenuItem value="Premium">Premium</MenuItem>
          <MenuItem value="Basic">Basic</MenuItem>
        </Select>
        <TextField
          label="Benutzername"
          fullWidth
          margin="normal"
          value={entryData.username}
          A
          disabled
        />
        <TextField
          label="Passwort"
          fullWidth
          margin="normal"
          type="password"
          value={entryData.password}
          disabled
        />
        <Typography variant="body1">
          <strong>Aktuelles Datum:</strong> {new Date().toLocaleDateString()}
        </Typography>
        <Typography variant="body1">
          <strong>Gültig bis:</strong>{" "}
          {new Date(new Date().getFullYear(), 11, 31).toLocaleDateString()}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Abbrechen
        </Button>
        <Button onClick={() => onSave(entryData)} color="primary">
          Hinzufügen
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default EntryDialog;
