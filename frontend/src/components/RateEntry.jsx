import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function RateEntry() {
  const navigate = useNavigate();
  const [liveRate, setLiveRate] = useState(null);
  const [form, setForm] = useState({
    gold22K: "",
    gold24K: "",
    gold18K: "",
    silver: "",
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/gold-rate/current`)
      .then((res) => setLiveRate(res.data?.data || null))
      .catch(() => setLiveRate(null));
  }, []);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "gold24K" && value) {
        const rate24K = Number(value);
        updated.gold22K = (rate24K * (22 / 24)).toFixed(2);
        updated.gold18K = (rate24K * (18 / 24)).toFixed(2);
      }
      return updated;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/gold-rate`, {
        gold24K: Number(form.gold24K),
        silver: Number(form.silver),
      });

      setSnackbar({ open: true, message: "Rates updated successfully.", severity: "success" });
      setForm({ gold22K: "", gold24K: "", gold18K: "", silver: "" });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Unable to update rates.",
        severity: "error",
      });
    }
  };

  return (
    <Box className="app-safe-shell" sx={{ display: "grid", placeItems: "center", py: 4 }}>
      <Paper elevation={0} sx={{ width: "100%", maxWidth: 560, p: 4, borderRadius: "24px", background: "rgba(255,255,255,0.92)", border: "1px solid rgba(169,126,39,0.12)", boxShadow: "0 18px 40px rgba(133, 104, 74, 0.08)", position: "relative" }}>
        <IconButton onClick={() => navigate(-1)} sx={{ position: "absolute", top: 18, left: 18, color: "#b88324" }}>
          <ArrowBackIcon />
        </IconButton>

        <Typography sx={{ textAlign: "center", fontSize: 28, fontWeight: 800, color: "#3e2b16" }}>
          Gold Rate Entry
        </Typography>
        <Typography sx={{ textAlign: "center", mt: 1, mb: 2, color: "#85684a", fontSize: 14 }}>
          Enter 24K gold rate. 22K and 18K are calculated automatically.
        </Typography>

        {liveRate && (
          <Alert severity="success" sx={{ mb: 2, fontSize: 13 }}>
            Live 22K: Rs {Number(liveRate.gold22K || 0).toLocaleString("en-IN")} | Live 24K: Rs {Number(liveRate.gold24K || 0).toLocaleString("en-IN")}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 3, fontSize: 13 }}>
          Use this screen for manual override when market rates need correction in the admin panel.
        </Alert>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField label="22K Gold (Auto)" type="number" value={form.gold22K} disabled InputProps={{ style: { color: "#999" } }} />
            <TextField label="24K Gold (Enter)" type="number" value={form.gold24K} onChange={handleChange("gold24K")} required />
            <TextField label="18K Gold (Auto)" type="number" value={form.gold18K} disabled InputProps={{ style: { color: "#999" } }} />
            <TextField label="Silver" type="number" value={form.silver} onChange={handleChange("silver")} required />
          </Box>

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, height: 50, borderRadius: "14px", textTransform: "none", fontWeight: 800, background: "linear-gradient(135deg, #c89b3c 0%, #e0b254 100%)" }}>
            Save Rates
          </Button>
        </form>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
