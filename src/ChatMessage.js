import React from "react";
import { Box, Typography } from "@mui/material";

const ChatMessage = ({ message, sender, timestamp, isOwnMessage }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isOwnMessage ? "flex-end" : "flex-start",
        marginBottom: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: "70%",
          padding: 1.5,
          borderRadius: 2,
          backgroundColor: isOwnMessage ? "#3b82f6" : "#e0e7ff",
          color: isOwnMessage ? "#fff" : "#333",
          boxShadow: 1,
        }}
      >
        <Typography variant="body1">{message}</Typography>
        <Typography
          variant="caption"
          sx={{ display: "block", textAlign: "right" }}
        >
          {new Date(timestamp).toLocaleTimeString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default ChatMessage;
