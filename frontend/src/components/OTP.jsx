import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, IconButton, Typography } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "./renic-tech-logo.svg";
import RenicCopyright from "./common/RenicCopyright";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function OTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  const email = location.state?.email || "";
  const userId = location.state?.userId || "";

  const [otp, setOtp] = useState(Array(6).fill(""));
  const [message, setMessage] = useState(email ? `OTP sent to ${email}` : "Enter the verification code");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join("");
    if (!/^\d{6}$/.test(otpValue)) {
      setIsError(true);
      setMessage("Please enter the full 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, { userId, email, otp: otpValue });
      const user = res.data.data;

      if (user?.token) {
        localStorage.setItem("token", user.token);
        localStorage.setItem("userId", user._id);
        localStorage.setItem("role", user.role);
        axios.defaults.headers.common.Authorization = `Bearer ${user.token}`;
      }

      setIsError(false);
      setMessage("Verification completed successfully.");
      setTimeout(() => navigate("/Home"), 900);
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || "Verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/resend-otp`, { userId, email });
      setOtp(Array(6).fill(""));
      setResendCooldown(30);
      setIsError(false);
      setMessage("A fresh OTP has been sent.");
      inputRefs.current[0]?.focus();
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || "Unable to resend OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box className="app-safe-shell" sx={{ display: "grid", placeItems: "center" }}>
      <Box
        sx={{
          width: "100%",
          maxWidth: 520,
          p: { xs: 3, sm: 5 },
          borderRadius: "28px",
          background: "rgba(255,255,255,0.88)",
          border: "1px solid rgba(169,126,39,0.14)",
          boxShadow: "0 24px 60px rgba(133, 104, 74, 0.12)",
          position: "relative",
        }}
      >
        <IconButton onClick={() => navigate(-1)} sx={{ position: "absolute", top: 18, left: 18, color: "#8a6b49" }}>
          <ArrowBackIosNewIcon />
        </IconButton>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Box component="img" src={logo} alt="Renic Tech" sx={{ width: 144, height: 78, objectFit: "contain" }} />
          </Box>

          <Typography sx={{ textAlign: "center", fontSize: 30, fontWeight: 800, color: "#3e2b16" }}>
            Verify OTP
          </Typography>
          <Typography sx={{ textAlign: "center", color: "#85684a", mt: 1, mb: 4 }}>
            {email ? `Use the code sent to ${email}` : "Use the verification code sent to your registered contact."}
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "center", gap: 1.2, flexWrap: "wrap" }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(element) => (inputRefs.current[index] = element)}
                value={digit}
                maxLength={1}
                inputMode="numeric"
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                style={{
                  width: 50,
                  height: 58,
                  borderRadius: 16,
                  border: "1px solid rgba(169,126,39,0.18)",
                  textAlign: "center",
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#3e2b16",
                  background: "#fffdf8",
                  outline: "none",
                }}
              />
            ))}
          </Box>

          <Alert severity={isError ? "error" : "success"} sx={{ mt: 3, borderRadius: "16px" }}>
            {message}
          </Alert>

          <Button
            fullWidth
            onClick={handleVerifyOTP}
            disabled={isLoading || otp.join("").length !== 6}
            sx={{
              mt: 3,
              height: 50,
              borderRadius: "16px",
              textTransform: "none",
              fontSize: 16,
              fontWeight: 800,
              color: "#fff",
              background: "linear-gradient(135deg, #c89b3c 0%, #e0b254 100%)",
            }}
          >
            {isLoading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Verify OTP"}
          </Button>

          <Button
            fullWidth
            variant="text"
            onClick={handleResendOTP}
            disabled={resendCooldown > 0}
            sx={{ mt: 1.5, color: "#a33a2b", fontWeight: 700, textTransform: "none" }}
          >
            {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
          </Button>

          <Box sx={{ mt: 3 }}>
            <RenicCopyright compact />
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
}
