import { useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logo from "./renic_logo.png";

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

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!phone || !password) {
      setError("Please enter mobile number and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, { phone, password }, { withCredentials: true });
      const user = res.data.data;
      const isSuperAdmin = user.role === "admin" && user.phone === "9345578103";

      localStorage.setItem("token", user.token);
      localStorage.setItem("userId", user._id);
      localStorage.setItem("phone", user.phone);
      localStorage.setItem("name", user.name);
      localStorage.setItem("role", user.role);
      localStorage.setItem("email", user.email);
      localStorage.setItem("customerId", user.customerId);
      localStorage.setItem("is_super_admin", isSuperAdmin ? "1" : "0");
      localStorage.removeItem("isGuest");
      axios.defaults.headers.common.Authorization = `Bearer ${user.token}`;

      navigate("/Home");
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        navigate("/otp", {
          state: {
            email: err.response.data.rawEmail || err.response.data.email || "",
            userId: err.response.data.userId || "",
          },
        });
        return;
      }
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.request) {
        setError("Unable to reach the server. Please check your internet connection and try again.");
      } else {
        setError("Unable to sign in right now.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="app-safe-shell" sx={{ display: "grid", placeItems: "center" }}>
      <Box
        sx={{
          width: "100%",
          maxWidth: 1120,
          minHeight: { xs: "calc(100dvh - 32px)", md: 720 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
          gap: 0,
          borderRadius: { xs: 0, md: "28px" },
          overflow: "hidden",
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(169, 126, 39, 0.12)",
          boxShadow: "0 24px 70px rgba(133, 104, 74, 0.14)",
        }}
      >
        <Box
          sx={{
            p: { xs: 3, sm: 5, md: 7 },
            background:
              "linear-gradient(180deg, rgba(255,248,236,0.98) 0%, rgba(255,243,221,0.95) 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                component="img"
                src={logo}
                alt="Renic"
                sx={{ width: 88, height: 88, objectFit: "contain", borderRadius: "20px", bgcolor: "#fff" }}
              />
              <Box>
                <Typography sx={{ fontSize: 30, fontWeight: 800, color: "#5a3916", letterSpacing: 0.5 }}>
                  Renic Jewellery
                </Typography>
                <Typography sx={{ color: "#8a6b49", fontSize: 14 }}>
                  Scheme collections, branch-ready workflows, and customer-friendly gold savings.
                </Typography>
              </Box>
            </Box>

          </Box>

        </Box>

        <Box sx={{ p: { xs: 3, sm: 5, md: 7 }, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.9)" }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 420 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#b88324", letterSpacing: 1.2, textTransform: "uppercase" }}>
              Sign In
            </Typography>
            <Typography sx={{ mt: 1, fontSize: 34, lineHeight: 1.1, color: "#3e2b16", fontWeight: 800 }}>
              Welcome back
            </Typography>
            <Typography sx={{ mt: 1.5, mb: 4, color: "#85684a" }}>
              Use your registered mobile number and password to continue.
            </Typography>

            <TextField
              fullWidth
              label="Mobile Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
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

            <TextField
              fullWidth
              label="Password"
              value={password}
              type={showPassword ? "text" : "password"}
              onChange={(e) => setPassword(e.target.value)}
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((value) => !value)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.5, mb: 3 }}>
              <Link underline="hover" sx={{ cursor: "pointer", color: "#8a6b49" }} onClick={() => navigate("/forgotPassword")}>
                Forgot password?
              </Link>
              <Button
                variant="text"
                sx={{ color: "#a9771c", textTransform: "none", fontWeight: 700 }}
                onClick={() => {
                  localStorage.setItem("isGuest", "true");
                  navigate("/Home");
                }}
              >
                Continue as guest
              </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: "14px" }}>{error}</Alert>}

            <Button
              fullWidth
              variant="contained"
              onClick={handleLogin}
              disabled={loading}
              endIcon={!loading && <ArrowForwardIcon />}
              sx={{
                height: 52,
                borderRadius: "16px",
                textTransform: "none",
                fontSize: 16,
                fontWeight: 800,
                background: "linear-gradient(135deg, #c89b3c 0%, #e0b254 100%)",
                boxShadow: "0 16px 32px rgba(200, 155, 60, 0.25)",
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Sign in"}
            </Button>

            <Typography sx={{ mt: 3, color: "#85684a", textAlign: "center" }}>
              New customer?{" "}
              <Link underline="hover" sx={{ cursor: "pointer", color: "#a33a2b", fontWeight: 700 }} onClick={() => navigate("/CreateAccount")}>
                Create account
              </Link>
            </Typography>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
}
