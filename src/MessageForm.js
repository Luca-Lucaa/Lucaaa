import React, { useState } from "react";
import { TextField, Button, Box } from "@mui/material";
import { supabase } from "./supabaseClient";
import { handleError } from "./utils";

const MessageForm = ({ loggedInUser, receiver }) => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setError("Nachricht darf nicht leer sein.");
      return;
    }
    try {
      const { error } = await supabase
        .from("messages")
        .insert([{ sender: loggedInUser, receiver, message }]);
      if (error) throw error;
      setMessage("");
      setError(null);
    } catch (error) {
      handleError(error);
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
        error={!!error}
        helperText={error}
      />
      <Button variant="contained" color="primary" onClick={handleSendMessage}>
        Senden
      </Button>
    </Box>
  );
};

export default MessageForm;
