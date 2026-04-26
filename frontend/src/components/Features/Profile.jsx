import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`);
        setProfile(res.data.data || null);
      } catch (error) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const address = profile?.address
    ? [profile.address.street, profile.address.city, profile.address.state, profile.address.pincode]
        .filter(Boolean)
        .join(", ")
    : "-";

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#b88324" }} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", px: 3 }}>
        <Typography sx={{ color: "#7c3428", fontWeight: 700 }}>Unable to load profile.</Typography>
      </Box>
    );
  }

  return (
    <Box className="app-safe-shell" sx={{ py: 2 }}>
      <Box sx={{ maxWidth: 760, mx: "auto" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
            p: 2,
            borderRadius: "20px",
            background: "rgba(255,255,255,0.88)",
            border: "1px solid rgba(169,126,39,0.12)",
            boxShadow: "0 16px 36px rgba(133, 104, 74, 0.08)",
          }}
        >
          <IconButton onClick={() => navigate(-1)} sx={{ color: "#b88324" }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#3e2b16" }}>My Profile</Typography>
        </Box>

        <Box
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: "24px",
            background: "linear-gradient(180deg, rgba(255,251,243,0.97) 0%, rgba(255,243,221,0.94) 100%)",
            border: "1px solid rgba(169,126,39,0.12)",
            boxShadow: "0 20px 44px rgba(133, 104, 74, 0.08)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, flexWrap: "wrap" }}>
            <Avatar
              sx={{
                width: 82,
                height: 82,
                bgcolor: "#d9ae52",
                color: "#fff",
                fontSize: 32,
                fontWeight: 800,
              }}
            >
              {(profile.name || "U").charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 28, fontWeight: 800, color: "#3e2b16" }}>{profile.name}</Typography>
              <Typography sx={{ mt: 0.5, color: "#85684a" }}>{profile.email}</Typography>
              <Typography sx={{ mt: 0.5, color: "#85684a" }}>{profile.phone}</Typography>
            </Box>
            <Box
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: "999px",
                bgcolor: "rgba(200,155,60,0.14)",
                border: "1px solid rgba(169,126,39,0.16)",
                color: "#8a6518",
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              {profile.role}
            </Box>
          </Box>

          <Divider sx={{ my: 3, borderColor: "rgba(169,126,39,0.12)" }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            {[
              ["Customer ID", profile.customerId || "-"],
              ["Verified", profile.isVerified ? "Yes" : "No"],
              ["Wallet Balance", `Rs ${Number(profile.walletBalance || 0).toLocaleString("en-IN")}`],
              ["Wallet Gold", `${Number(profile.walletGoldBalance || 0).toFixed(4)} g`],
              ["Total Savings", `Rs ${Number(profile.totalSavings || 0).toLocaleString("en-IN")}`],
              ["Total Gold", `${Number(profile.totalGoldWeight || 0).toFixed(4)} g`],
              ["Preferred Branch", profile.preferredBranch?.branchName || "-"],
              ["Address", address],
            ].map(([label, value]) => (
              <Box
                key={label}
                sx={{
                  p: 2,
                  borderRadius: "16px",
                  background: "#fff",
                  border: "1px solid rgba(169,126,39,0.1)",
                }}
              >
                <Typography sx={{ fontSize: 12, color: "#8a6b49" }}>{label}</Typography>
                <Typography sx={{ mt: 0.8, fontSize: 16, fontWeight: 700, color: "#3e2b16" }}>{value}</Typography>
              </Box>
            ))}
          </Box>

          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            sx={{
              mt: 3,
              borderColor: "rgba(163,58,43,0.24)",
              color: "#7c3428",
              fontWeight: 700,
              textTransform: "none",
            }}
            onClick={() => {
              localStorage.clear();
              delete axios.defaults.headers.common.Authorization;
              navigate("/");
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
