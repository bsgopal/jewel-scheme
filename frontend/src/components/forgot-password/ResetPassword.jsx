import React, { useState, useRef, useEffect } from "react";
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

// 🌟 Gold shimmer background (same as Login page)
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

export default function ResetPassword() {
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleReset = async () => {
    const userId = localStorage.getItem("resetUserId");
    if (!userId) return setError("Session expired.");

    if (pwd !== confirm) return setError("Passwords do not match.");

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/forgot-password-reset`,
        { userId, newPassword: pwd }
      );

      if (res.data.success) {
        localStorage.removeItem("resetUserId");
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
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
      {/* ✨ Gold shimmer effect */}
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

      {/* 🔐 Password Reset Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: 350,
          padding: 30,
          background: "rgba(34,0,60,0.25)",
          borderRadius: 25,
          boxShadow: "0 0 25px rgba(255,215,0,0.7)",
          backdropFilter: "blur(6px)",
          zIndex: 2,
          marginTop: 300,
        }}
      >
        <Typography
          variant="h5"
          sx={{ color: "gold", mb: 2, textAlign: "center", fontWeight: "bold" }}
        >
          Reset Password
        </Typography>

        <TextField
          fullWidth
          placeholder="New Password"
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          sx={{ mb: 2, background: "white", borderRadius: 2 }}
        />

        <TextField
          fullWidth
          placeholder="Confirm Password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          sx={{ mb: 2, background: "white", borderRadius: 2 }}
        />

        {error && <Alert severity="error">{error}</Alert>}

        <Button
          fullWidth
          variant="contained"
          onClick={handleReset}
          sx={{
            mt: 2,
            background: "gold",
            color: "#330044",
            borderRadius: 3,
            fontWeight: "bold",
            "&:hover": { background: "#e0ac08" },
          }}
        >
          Reset Password
        </Button>
      </motion.div>
    </Box>
  );
}
