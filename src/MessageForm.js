import React, { useState } from "react";
import { TextField, Button, Box } from "@mui/material";
import { supabase } from "./supabaseClient";

const MessageForm = ({ loggedInUser, receiver }) => {
  const [message, setMessage] = useState("");

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert([{ sender: loggedInUser, receiver, message }]);

      if (error) {
        console.error("Fehler beim Senden der Nachricht:", error);
      } else {
        setMessage("");
      }
    } catch (error) {
      console.error("Fehler beim Senden der Nachricht:", error);
    }
  };

  return (
    <Box>
      <TextField
        label="Nachricht"
        variant="outlined"
        fullWidth
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        multiline
        rows={4}
        margin="normal"
      />
      <Button variant="contained" color="primary" onClick={handleSendMessage}>
        Senden
      </Button>
    </Box>
  );
};

export default MessageForm;
