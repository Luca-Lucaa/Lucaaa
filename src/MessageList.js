import React, { useEffect, useState } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { supabase } from "./supabaseClient";

const MessageList = ({ loggedInUser, selectedUser }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetchMessages();
  }, [loggedInUser, selectedUser]);

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

  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Chatverlauf mit {selectedUser}
      </Typography>
      <List>
        {messages.map((msg) => (
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
    </div>
  );
};

export default MessageList;
