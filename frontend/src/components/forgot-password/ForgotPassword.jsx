import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  Alert,
  IconButton
} from "@mui/material";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import bgImg from "../images/image2.png";

// 🌟 Gold shimmer animation (same as Login page)
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
        zIndex: 1
      }}
    />
  );
}

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

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/forgot-password`,
        { mobile }
      );

      if (res.data.success) {
        localStorage.setItem("resetUserId", res.data.userId);

        setSuccess("OTP has been sent to your registered email.");

        setTimeout(() => navigate("/verifyForgotOtp"), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
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
        overflow: "hidden",
      }}
    >
      {/* Gold Effect */}
      <GoldShimmer />

      {/* 🔙 Back Arrow */}
      <IconButton
        onClick={() => navigate(-1)}
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "gold",
          zIndex: 3,
        }}
      >
        <ArrowBackIosNewIcon sx={{ fontSize: 26 }} />
      </IconButton>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: 380,
          padding: 30,
          background: "rgba(34,0,60,0.25)",
          boxShadow: "0 0 25px rgba(255,215,0,0.7)",
          borderRadius: 25,
          backdropFilter: "blur(6px)",
          zIndex: 2,
          marginTop: 300
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: "gold",
            fontWeight: "bold",
            textAlign: "center",
            mb: 2
          }}
        >
          Forgot Password
        </Typography>

        <TextField
          fullWidth
          placeholder="Enter Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIphoneIcon sx={{ color: "gold" }} />
              </InputAdornment>
            ),
            sx: { borderRadius: 3, background: "white" },
          }}
          sx={{ mb: 2 }}
        />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Button
          fullWidth
          variant="contained"
          disabled={loading}
          onClick={handleSendOtp}
          sx={{
            mt: 1,
            borderRadius: 3,
            background: "gold",
            color: "#330044",
            fontWeight: "bold",
            "&:hover": { background: "#e0ac08" },
          }}
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </Button>
      </motion.div>
    </Box>
  );
}
