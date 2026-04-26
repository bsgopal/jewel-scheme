import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton
} from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import bgImg from "../images/image2.png";

// 🌟 Gold shimmer particles (same as Login)
function GoldShimmer() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let particles = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 1,
          speed: Math.random() * 0.3 + 0.05,
          alpha: Math.random(),
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${p.alpha})`;
        ctx.fill();

        p.y -= p.speed;
        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
      });
      requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
      }}
    />
  );
}

export default function VerifyForgotOtp() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timer, setTimer] = useState(60);

  // Countdown
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    const userId = localStorage.getItem("resetUserId");
    if (!userId) return setError("Session expired. Try again.");

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/forgot-password-otp`,
        { userId, otp }
      );

      if (res.data.success) navigate("/resetPassword");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    }
  };

  const handleResend = async () => {
    const userId = localStorage.getItem("resetUserId");

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/forgot-password-resend`,
        { userId }
      );

      if (res.data.success) {
        setSuccess("New OTP sent to your email.");
        setTimer(60);
      }
    } catch {
      setError("Failed to resend OTP");
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        background: `url(${bgImg}) center/cover`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* ✨ GOLD SHIMMER */}
      <GoldShimmer />

      {/* 🔙 BACK ARROW */}
      <IconButton
        onClick={() => navigate(-1)}
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 3,
          color: "gold",
          background: "rgba(0,0,0,0.3)",
          "&:hover": { background: "rgba(255,215,0,0.25)" }
        }}
      >
        <ArrowBackIosNewIcon />
      </IconButton>

      {/* 🔥 OTP CARD WITH ANIMATION */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        style={{
          width: 360,
          padding: 30,
          background: "rgba(34,0,60,0.25)",
          borderRadius: 25,
          boxShadow: "0 0 50px rgba(255,215,0,0.8)",
          backdropFilter: "blur(6px)",
          zIndex: 2,
          textAlign: "center",
          marginTop: 300,
        }}
      >
        <Typography variant="h5" sx={{ color: "gold", mb: 2 }}>
          Enter OTP
        </Typography>

        <TextField
          fullWidth
          placeholder="6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          sx={{ background: "white", borderRadius: 2, mb: 2 }}
        />

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 1 }}>{success}</Alert>}

        <Button
          fullWidth
          variant="contained"
          onClick={handleVerify}
          sx={{
            mt: 2,
            background: "gold",
            color: "#330044",
            borderRadius: 3,
            "&:hover": { background: "#e0ac08" },
          }}
        >
          Verify OTP
        </Button>

        <Typography sx={{ color: "white", mt: 2, fontSize: 14 }}>
          Didn’t receive OTP?
        </Typography>

        <Button
          fullWidth
          disabled={timer > 0}
          onClick={handleResend}
          sx={{
            mt: 1,
            background: timer > 0 ? "gray" : "gold",
            color: timer > 0 ? "white" : "#330044",
            borderRadius: 3,
            "&:hover": { background: timer > 0 ? "gray" : "#e0ac08" },
          }}
        >
          {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
        </Button>
      </motion.div>
    </Box>
  );
}
