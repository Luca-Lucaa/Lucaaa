import React, { useMemo, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { supabase } from "./supabaseClient";
import { formatDate, handleError } from "./utils";
import { useSnackbar } from "./useSnackbar";
import { OWNER_COLORS } from "./config";

const AdminDashboard = ({
  entries,
  loggedInUser,
  setOpenCreateDialog,
  setOpenManualDialog,
  setEntries,
}) => {
  const [extensionDialogOpen, setExtensionDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [newValidUntil, setNewValidUntil] = useState("");
  const { showSnackbar } = useSnackbar();

  const stats = useMemo(() => {
    const owners = [...new Set(entries.map((e) => e.owner))];
    const result = {
      totalEntries: entries.length,
      activeEntries: entries.filter((e) => e.status === "Aktiv").length,
      paidEntries: entries.filter((e) => e.paymentStatus === "Gezahlt").length,
      totalFees: entries.reduce((sum, e) => sum + (e.admin_fee || 0), 0),
      byOwner: owners.map((owner) => ({
        owner,
        count: entries.filter((e) => e.owner === owner).length,
        fees: entries
          .filter((e) => e.owner === owner)
          .reduce((sum, e) => sum + (e.admin_fee || 0), 0),
      })),
      pendingExtensions: entries.filter((e) => e.extensionRequest?.pending),
    };
    return result;
  }, [entries]);

  const handleApproveExtension = useCallback(
    async () => {
      if (!selectedEntry || !newValidUntil) {
        showSnackbar("Bitte ein Gültigkeitsdatum auswählen.", "error");
        return;
      }
      const selectedDate = new Date(newValidUntil);
      const currentDate = new Date();
      if (selectedDate < currentDate) {
        showSnackbar("Das Datum muss in der Zukunft liegen.", "error");
        return;
      }

      const updatedEntry = {
        validUntil: selectedDate.toISOString(),
        extensionRequest: {
          pending: false,
          approved: true,
          approvalDate: new Date().toISOString(),
        },
        extensionHistory: [
          ...(selectedEntry.extensionHistory || []),
          {
            approvalDate: new Date().toISOString(),
            validUntil: selectedDate.toISOString(),
          },
        ],
      };

      try {
        const { data, error } = await supabase
          .from("entries")
          .update(updatedEntry)
          .eq("id", selectedEntry.id)
          .select()
          .single();
        if (error) throw error;
        setEntries((prev) =>
          prev.map((e) => (e.id === selectedEntry.id ? { ...e, ...data } : e))
        );
        showSnackbar("Verlängerung genehmigt.");
        setExtensionDialogOpen(false);
        setSelectedEntry(null);
        setNewValidUntil("");
      } catch (error) {
        handleError(error, showSnackbar);
      }
    },
    [selectedEntry, newValidUntil, setEntries, showSnackbar]
  );

  const handleRejectExtension = useCallback(
    async () => {
      if (!selectedEntry) return;
      try {
        const { error } = await supabase
          .from("entries")
          .update({ extensionRequest: { pending: false, approved: false } })
          .eq("id", selectedEntry.id);
        if (error) throw error;
        setEntries((prev) =>
          prev.map((e) =>
            e.id === selectedEntry.id
              ? { ...e, extensionRequest: { pending: false, approved: false } }
              : e
          )
        );
        showSnackbar("Verlängerung abgelehnt.");
        setExtensionDialogOpen(false);
        setSelectedEntry(null);
        setNewValidUntil("");
      } catch (error) {
        handleError(error, showSnackbar);
      }
    },
    [selectedEntry, setEntries, showSnackbar]
  );

  return (
    <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
        Admin-Dashboard
      </Typography>
      <Grid container spacing={1} alignItems="center">
        <Grid item xs={6} sm={3} md={2}>
          <Card sx={{ borderRadius: 1, boxShadow: 1, p: 1 }}>
            <CardContent sx={{ p: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Gesamt
              </Typography>
              <Typography variant="h6" color="primary">
                {stats.totalEntries}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <Card sx={{ borderRadius: 1, boxShadow: 1, p: 1 }}>
            <CardContent sx={{ p: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Aktiv
              </Typography>
              <Typography variant="h6" color="success.main">
                {stats.activeEntries}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <Card sx={{ borderRadius: 1, boxShadow: 1, p: 1 }}>
            <CardContent sx={{ p: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Gezahlt
              </Typography>
              <Typography variant="h6" color="success.main">
                {stats.paidEntries}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <Card sx={{ borderRadius: 1, boxShadow: 1, p: 1 }}>
            <CardContent sx={{ p: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Gebühren
              </Typography>
              <Typography variant="h6" color="primary">
                {stats.totalFees}$ €
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateDialog(true)}
              sx={{ borderRadius: 1, flexGrow: 1 }}
            >
              Neu
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => setOpenManualDialog(true)}
              sx={{ borderRadius: 1, flexGrow: 1 }}
            >
              Bestehend
            </Button>
          </Box>
        </Grid>
      </Grid>
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Ausstehende Verlängerungsanfragen
        </Typography>
        {stats.pendingExtensions.length > 0 ? (
          <Grid container spacing={1}>
            {stats.pendingExtensions.map((entry) => (
              <Grid item xs={12} sm={6} md={4} key={entry.id}>
                <Card sx={{ borderRadius: 1, boxShadow: 1, p: 1 }}>
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="body2">
                      <strong>{entry.aliasNotes}</strong> ({entry.username})
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Ersteller: {entry.owner}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Gültig bis: {formatDate(entry.validUntil)}
                    </Typography>
                  </CardContent>
                  <Box sx={{ display: "flex", gap: 1, p: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => {
                        setSelectedEntry(entry);
                        setNewValidUntil(
                          new Date(entry.validUntil).toISOString().split("T")[0]
                        );
                        setExtensionDialogOpen(true);
                      }}
                    >
                      Genehmigen
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      startIcon={<CancelIcon />}
                      onClick={() => {
                        setSelectedEntry(entry);
                        handleRejectExtension();
                      }}
                    >
                      Ablehnen
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography>Keine ausstehenden Anfragen.</Typography>
        )}
      </Box>
      <Dialog
        open={extensionDialogOpen}
        onClose={() => setExtensionDialogOpen(false)}
      >
        <DialogTitle>Verlängerung genehmigen</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Wähle das neue Gültigkeitsdatum für{" "}
            <strong>{selectedEntry?.aliasNotes}</strong>:
          </Typography>
          <TextField
            label="Neues Gültigkeitsdatum"
            type="date"
            fullWidth
            value={newValidUntil}
            onChange={(e) => setNewValidUntil(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          {selectedEntry && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Aktuelles Gültigkeitsdatum: {formatDate(selectedEntry.validUntil)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setExtensionDialogOpen(false)}
            color="secondary"
          >
            Abbrechen
          </Button>
          <Button onClick={handleApproveExtension} color="success">
            Genehmigen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
