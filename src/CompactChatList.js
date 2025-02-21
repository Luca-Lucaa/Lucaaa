import React, { useState } from "react";
import {
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Typography,
  Box,
  TextField,
  IconButton,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { supabase } from "./supabaseClient"; // Importiere den Supabase-Client

const CompactChatList = ({ messages, loggedInUser }) => {
  const [showAll, setShowAll] = useState(false); // Zustand für das Anzeigen aller Nachrichten
  const [newMessage, setNewMessage] = useState(""); // Zustand für die neue Nachricht

  // Funktion zum Senden einer neuen Nachricht
  const sendMessage = async () => {
    if (!newMessage.trim()) return; // Leere Nachrichten ignorieren

    try {
      // Nachricht an Supabase senden
      const { error } = await supabase
        .from("messages")
        .insert([
          { sender: loggedInUser, receiver: "Admin", message: newMessage },
        ]);

      if (error) {
        console.error("Fehler beim Senden der Nachricht:", error);
      } else {
        setNewMessage(""); // Eingabefeld leeren
      }
    } catch (error) {
      console.error("Fehler beim Senden der Nachricht:", error);
    }
  };

  // Nur die letzten 5 Nachrichten anzeigen, es sei denn, "Alle anzeigen" ist aktiviert
  const displayedMessages = showAll ? messages : messages.slice(-5);

  return (
    <Box sx={{ marginBottom: 2 }}>
      <Typography variant="h6" gutterBottom>
        Chatverlauf
      </Typography>

      {/* Chatverlauf anzeigen */}
      <List>
        {displayedMessages.map((msg) => (
          <React.Fragment key={msg.id}>
            <ListItem>
              <ListItemText
                primary={msg.message}
                secondary={`Von: ${msg.sender} am ${new Date(
                  msg.created_at
                ).toLocaleString()}`}
              />
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>

      {/* Button zum Laden älterer Nachrichten */}
      {messages.length > 5 && (
        <Button
          onClick={() => setShowAll(!showAll)}
          variant="outlined"
          fullWidth
          sx={{ marginTop: 2 }}
        >
          {showAll ? "Weniger anzeigen" : "Alle Nachrichten anzeigen"}
        </Button>
      )}

      {/* Eingabefeld für neue Nachrichten */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", marginTop: 2 }}>
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
        <IconButton onClick={sendMessage} color="primary">
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default CompactChatList;
