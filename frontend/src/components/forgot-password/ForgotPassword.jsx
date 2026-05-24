import React, { useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "16px",
    backgroundColor: "#fffdf8",
    "& fieldset": { borderColor: "rgba(169, 126, 39, 0.18)" },
    "&:hover fieldset": { borderColor: "#c89b3c" },
    "&.Mui-focused fieldset": { borderColor: "#c89b3c", borderWidth: 1.5 },
  },
  "& .MuiInputLabel-root": { color: "#8a6b49" },
  "& .MuiInputAdornment-root .MuiSvgIcon-root": { color: "#b88324" },
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    setError("");
    setSuccess("");

    if (mobile.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, { mobile });

      if (res.data.success) {
        localStorage.setItem("resetUserId", res.data.userId);
        setSuccess("OTP has been sent to your registered email.");
        setTimeout(() => navigate("/verifyForgotOtp"), 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="app-safe-shell" sx={{ display: "grid", placeItems: "center" }}>
      <Box sx={{ width: "100%", maxWidth: 1120, minHeight: { xs: "calc(100dvh - 32px)", md: 720 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" }, borderRadius: { xs: 0, md: "28px" }, overflow: "hidden", background: "rgba(255,255,255,0.72)", backdropFilter: "blur(10px)", border: "1px solid rgba(169, 126, 39, 0.12)", boxShadow: "0 24px 70px rgba(133, 104, 74, 0.14)" }}>
        <Box sx={{ p: { xs: 3, sm: 5, md: 7 }, background: "linear-gradient(180deg, rgba(255,248,236,0.98) 0%, rgba(255,243,221,0.95) 100%)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <Box>
            <IconButton onClick={() => navigate(-1)} sx={{ mb: 3, color: "#b88324", background: "rgba(255,255,255,0.55)", border: "1px solid rgba(169,126,39,0.12)" }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography sx={{ fontSize: 30, fontWeight: 800, color: "#5a3916", letterSpacing: 0.5 }}>
              Reset access
            </Typography>
            <Typography sx={{ mt: 2, color: "#8a6b49", fontSize: 15, maxWidth: 420 }}>
              Enter your registered mobile number. We will send a verification OTP to your registered email address.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 3, sm: 5, md: 7 }, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.9)" }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 420 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#b88324", letterSpacing: 1.2, textTransform: "uppercase" }}>
              Forgot Password
            </Typography>
            <Typography sx={{ mt: 1, fontSize: 34, lineHeight: 1.1, color: "#3e2b16", fontWeight: 800 }}>
              Verify your mobile
            </Typography>
            <Typography sx={{ mt: 1.5, mb: 4, color: "#85684a" }}>
              We will guide you through OTP verification and password reset.
            </Typography>

            <TextField
              fullWidth
              label="Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              sx={{ ...fieldSx, mb: 2.5 }}
              inputProps={{ maxLength: 10, inputMode: "numeric" }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIphoneIcon />
                  </InputAdornment>
                ),
              }}
            />

            {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: "14px" }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2.5, borderRadius: "14px" }}>{success}</Alert>}

            <Button
              fullWidth
              variant="contained"
              onClick={handleSendOtp}
              disabled={loading}
              sx={{ height: 52, borderRadius: "16px", textTransform: "none", fontSize: 16, fontWeight: 800, background: "linear-gradient(135deg, #c89b3c 0%, #e0b254 100%)", boxShadow: "0 16px 32px rgba(200, 155, 60, 0.25)" }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Send OTP"}
            </Button>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
}
