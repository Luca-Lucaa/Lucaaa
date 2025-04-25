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

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: "#f0f9ff",
  borderRadius: "20px",
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
  padding: "10px",
  maxWidth: "400px",
  margin: "auto",
  [theme.breakpoints.down("sm")]: {
    maxWidth: "90%",
    padding: "5px",
  },
}));

const StyledButton = styled(Button)({
  borderRadius: "25px",
  padding: "10px 20px",
  backgroundColor: "#60a5fa",
  "&:hover": { backgroundColor: "#3b82f6" },
});

const StyledTextField = styled(TextField)({
  backgroundColor: "#fff",
  borderRadius: "10px",
  marginBottom: "15px",
});

const StyledTitle = styled(Typography)({
  color: "#1e40af",
  marginBottom: "20px",
  fontWeight: "bold",
});

const LoginForm = ({ handleLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <StyledCard>
      <CardContent>
        <StyledTitle variant="h5" align="center">
          🌟 Willkommen bei Luca-TV-PT.2
        </StyledTitle>
        <StyledTextField
          label="👤 Benutzername"
          variant="outlined"
          fullWidth
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <StyledTextField
          label="🔑 Passwort"
          type={showPassword ? "text" : "password"}
          variant="outlined"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
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
          fullWidth
        >
          🚀 Login
        </StyledButton>
      </CardActions>
    </StyledCard>
  );
};

export default LoginForm;
