import React from "react";
import { Typography, List, ListItem, ListItemText, Divider } from "@mui/material";
import { useMessages } from "./utils";

const MessageList = ({ loggedInUser, selectedUser }) => {
  const { messages } = useMessages(loggedInUser, selectedUser);

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
                secondary={`Von: ${msg.sender} am ${new Date(msg.created_at).toLocaleString()}`}
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
