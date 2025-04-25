import React, { useState } from "react";
import {
  List,
  ListItem,
  Divider,
  Button,
  Typography,
  Box,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Badge,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import MoreVertIcon from "@mui/icons-material/MoreVert"; // Für das Kontextmenü
import { supabase } from "./supabaseClient";
import { handleError } from "./utils";
import ChatMessage from "./ChatMessage"; // Importiere die angepasste ChatMessage-Komponente

const CompactChatList = ({ messages: initialMessages, loggedInUser }) => {
  const [showAll, setShowAll] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState(null); // Zustand für die Antwortnachricht
  const [anchorEl, setAnchorEl] = useState(null); // Für das Kontextmenü
  const [selectedMessageId, setSelectedMessageId] = useState(null); // Ausgewählte Nachricht für Reaktion/Antwort

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const { error } = await supabase.from("messages").insert([
        {
          sender: loggedInUser,
          receiver: "Admin",
          message: newMessage,
          parent_message_id: replyTo ? replyTo.id : null, // Verknüpfung zur Antwort
        },
      ]);
      if (error) throw error;
      setNewMessage("");
      setReplyTo(null); // Antwort zurücksetzen nach Senden
    } catch (error) {
      handleError(error);
    }
  };

  const addReaction = async (messageId, emoji) => {
    try {
      const { data: message } = await supabase
        .from("messages")
        .select("reactions")
        .eq("id", messageId)
        .single();
      const currentReactions = message.reactions || {};
      const updatedReactions = {
        ...currentReactions,
        [emoji]: (currentReactions[emoji] || 0) + 1,
      };
      await supabase
        .from("messages")
        .update({ reactions: updatedReactions })
        .eq("id", messageId);
      handleMenuClose(); // Menü schließen nach Reaktion
    } catch (error) {
      handleError(error);
    }
  };

  const handleMenuOpen = (event, messageId) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessageId(messageId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMessageId(null);
  };

  const handleReply = (message) => {
    setReplyTo(message);
    handleMenuClose();
  };

  const displayedMessages = showAll ? initialMessages : initialMessages.slice(-5);

  return (
    <Box sx={{ marginBottom: 2 }}>
      <Typography variant="h6" gutterBottom>
        Chat
      </Typography>
      <List>
        {displayedMessages.map((msg) => (
          <React.Fragment key={msg.id}>
            <ListItem>
              <ChatMessage
                message={msg.message}
                sender={msg.sender}
                timestamp={msg.created_at}
                isOwnMessage={msg.sender === loggedInUser}
                reactions={msg.reactions || {}}
                onReact={(emoji) => addReaction(msg.id, emoji)}
                onMenuOpen={(e) => handleMenuOpen(e, msg.id)}
                parentMessage={msg.parent_message_id ? initialMessages.find(m => m.id === msg.parent_message_id) : null}
              />
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
      {initialMessages.length > 5 && (
        <Button
          onClick={() => setShowAll(!showAll)}
          variant="outlined"
          fullWidth
          sx={{ marginTop: 2 }}
        >
          {showAll ? "Weniger anzeigen" : "Alle Nachrichten anzeigen"}
        </Button>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 2 }}>
        {replyTo && (
          <Box
            sx={{
              backgroundColor: "grey.100",
              padding: 1,
              borderRadius: 1,
              marginBottom: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Antwort auf: {replyTo.sender} - {replyTo.message}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            label="Neue Nachricht"
            variant="outlined"
            fullWidth
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <IconButton onClick={sendMessage} color="primary" disabled={!newMessage.trim()}>
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <MenuItem onClick={() => handleReply(displayedMessages.find(m => m.id === selectedMessageId))}>
          Antworten
        </MenuItem>
        <MenuItem onClick={() => addReaction(selectedMessageId, "👍")}>👍 Like</MenuItem>
        <MenuItem onClick={() => addReaction(selectedMessageId, "❤️")}>❤️ Liebe</MenuItem>
        <MenuItem onClick={() => addReaction(selectedMessageId, "😂")}>😂 Lachen</MenuItem>
      </Menu>
    </Box>
  );
};

export default CompactChatList;
