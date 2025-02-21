import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { styled } from "@mui/system";
// Stile definieren
const StyledCard = styled(Card)({
  backgroundColor: "#93c5fd",
  borderRadius: "15px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
});
const StyledButton = styled(Button)({
  borderRadius: "20px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
});
const StyledTextField = styled(TextField)({
  backgroundColor: "#fff",
  borderRadius: "10px",
  marginBottom: "10px",
});
const StyledTitle = styled(Typography)({
  color: "#1e3a8a",
  marginBottom: "20px",
});
// LoginForm-Komponente
const LoginForm = ({ handleLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  return (
    <StyledCard>
      <CardContent>
        <StyledTitle variant="h5" component="h2" align="center">
          Willkommen bei Luca-TV
        </StyledTitle>
        <StyledTextField
          label="👤 Benutzername"
          variant="outlined"
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <StyledTextField
          label="🔑 Passwort"
          type={showPassword ? "text" : "password"}
          variant="outlined"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </CardContent>
      <CardActions>
        <StyledButton
          onClick={() => handleLogin(username, password)}
          variant="contained"
          color="primary"
          fullWidth
        >
          🚀 Login
        </StyledButton>
      </CardActions>
    </StyledCard>
  );
};
export default LoginForm;
