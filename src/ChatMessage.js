import React from "react";
import { Box, Typography, IconButton, Menu, MenuItem, Badge } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const ChatMessage = ({ message, sender, timestamp, isOwnMessage, reactions, onReact, onMenuOpen, parentMessage }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const formattedTimestamp = new Date(timestamp).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
    onMenuOpen(event);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Sicherstellen, dass reactions ein Objekt ist
  const safeReactions = reactions || {};

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isOwnMessage ? "flex-end" : "flex-start",
        marginBottom: 2,
        width: "100%",
      }}
    >
      {parentMessage && (
        <Box
          sx={{
            backgroundColor: "grey.100",
            padding: 1,
            borderRadius: 1,
            marginBottom: 1,
            width: "100%",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Antwort auf: {parentMessage.sender} - {parentMessage.message}
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          maxWidth: "70%",
          padding: 1.5,
          borderRadius: 2,
          backgroundColor: isOwnMessage ? "primary.main" : "grey.200",
          color: isOwnMessage ? "primary.contrastText" : "text.primary",
          boxShadow: 1,
          position: "relative",
        }}
      >
        <Typography variant="body1">{message}</Typography>
        <Typography variant="caption" sx={{ display: "block", textAlign: "right" }}>
          {sender} - {formattedTimestamp}
        </Typography>
        {Object.entries(safeReactions).length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5, mt: 0.5 }}>
            {Object.entries(safeReactions).map(([emoji, count]) => (
              <Badge key={emoji} badgeContent={count} color="secondary">
                <span role="img" aria-label={emoji}>
                  {emoji}
                </span>
              </Badge>
            ))}
          </Box>
        )}
        <IconButton
          size="small"
          onClick={handleMenuOpen}
          sx={{ position: "absolute", top: 0, right: 0 }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { onReact("👍"); handleMenuClose(); }}>👍 Like</MenuItem>
        <MenuItem onClick={() => { onReact("❤️"); handleMenuClose(); }}>❤️ Liebe</MenuItem>
        <MenuItem onClick={() => { onReact("😂"); handleMenuClose(); }}>😂 Lachen</MenuItem>
      </Menu>
    </Box>
  );
};

export default ChatMessage;
