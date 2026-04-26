import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Card,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function PaymentHistoryDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/api/admin/users/${userId}`);
        setDetails(res.data.data || null);
      } catch (error) {
        setDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  if (loading) {
    return (
      <Box className="app-safe-shell" sx={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <CircularProgress sx={{ color: "#b88324" }} />
      </Box>
    );
  }

  if (!details?.user) {
    return (
      <Box className="app-safe-shell" sx={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <Typography sx={{ color: "#7c3428", fontWeight: 700 }}>Unable to load customer details.</Typography>
      </Box>
    );
  }

  const { user, schemes = [], recentPayments = [] } = details;

  return (
    <Box className="app-safe-shell" sx={{ py: 2 }}>
      <Box sx={{ maxWidth: 960, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: "#b88324" }}>
            <ArrowBackIosNewIcon />
          </IconButton>
          <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#3e2b16" }}>{user.name}</Typography>
        </Box>

        <Card
          sx={{
            p: 3,
            borderRadius: "24px",
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(169,126,39,0.12)",
            boxShadow: "0 20px 42px rgba(133, 104, 74, 0.08)",
          }}
        >
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
            {[
              ["Customer ID", user.customerId || "-"],
              ["Phone", user.phone || "-"],
              ["Role", user.role || "-"],
              ["Savings", `Rs ${Number(user.totalSavings || 0).toLocaleString("en-IN")}`],
              ["Gold", `${Number(user.totalGoldWeight || 0).toFixed(4)} g`],
              ["Status", user.isActive ? "Active" : "Inactive"],
            ].map(([label, value]) => (
              <Box key={label} sx={{ p: 2, borderRadius: "16px", bgcolor: "#fffaf0", border: "1px solid rgba(169,126,39,0.12)" }}>
                <Typography sx={{ fontSize: 12, color: "#8a6b49" }}>{label}</Typography>
                <Typography sx={{ mt: 0.7, fontWeight: 800, color: "#3e2b16" }}>{value}</Typography>
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 3, borderColor: "rgba(169,126,39,0.12)" }} />

          <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#3e2b16", mb: 1.5 }}>Schemes</Typography>
          <Box sx={{ display: "grid", gap: 1.2 }}>
            {schemes.map((scheme) => (
              <Box
                key={scheme._id}
                sx={{
                  p: 2,
                  borderRadius: "18px",
                  border: "1px solid rgba(169,126,39,0.12)",
                  bgcolor: "#fffdf8",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 800, color: "#3e2b16" }}>{scheme.schemeName}</Typography>
                  <Typography sx={{ mt: 0.5, color: "#85684a" }}>{scheme.schemeId || "-"}</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "wrap" }}>
                  <Typography sx={{ color: "#6f5334", fontWeight: 700 }}>
                    Rs {Number(scheme.totalAmountPaid || 0).toLocaleString("en-IN")}
                  </Typography>
                  <Chip label={scheme.status} sx={{ textTransform: "capitalize", fontWeight: 700 }} />
                </Box>
              </Box>
            ))}
            {!schemes.length && <Typography sx={{ color: "#85684a" }}>No schemes found for this customer.</Typography>}
          </Box>

          <Divider sx={{ my: 3, borderColor: "rgba(169,126,39,0.12)" }} />

          <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#3e2b16", mb: 1.5 }}>Recent Payments</Typography>
          <Box sx={{ display: "grid", gap: 1.2 }}>
            {recentPayments.map((payment) => (
              <Box
                key={payment._id}
                sx={{
                  p: 2,
                  borderRadius: "18px",
                  border: "1px solid rgba(169,126,39,0.12)",
                  bgcolor: "#fff",
                }}
              >
                <Typography sx={{ fontWeight: 800, color: "#3e2b16" }}>
                  Rs {Number(payment.amount || 0).toLocaleString("en-IN")}
                </Typography>
                <Typography sx={{ mt: 0.6, color: "#85684a" }}>
                  {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("en-IN") : "No date"}
                </Typography>
              </Box>
            ))}
            {!recentPayments.length && <Typography sx={{ color: "#85684a" }}>No recent payments yet.</Typography>}
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
