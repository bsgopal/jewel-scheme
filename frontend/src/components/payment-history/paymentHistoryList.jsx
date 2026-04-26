import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function PaymentHistoryList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/api/admin/users`, {
          params: { role: "customer", limit: 100 },
        });
        setUsers(res.data.data || []);
      } catch (error) {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    let next = [...users];

    if (search.trim()) {
      const query = search.toLowerCase();
      next = next.filter(
        (user) =>
          user.name?.toLowerCase().includes(query) ||
          user.phone?.includes(query) ||
          user.customerId?.toLowerCase().includes(query)
      );
    }

    if (filter === "active") {
      next = next.filter((user) => user.isActive);
    }

    if (filter === "inactive") {
      next = next.filter((user) => !user.isActive);
    }

    return next;
  }, [filter, search, users]);

  return (
    <Box className="app-safe-shell" sx={{ py: 2 }}>
      <Box sx={{ maxWidth: 920, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: "#b88324" }}>
            <ArrowBackIosNewIcon />
          </IconButton>
          <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#3e2b16" }}>Customers</Typography>
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
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.6fr 0.8fr" }, gap: 2, mb: 2 }}>
            <TextField
              placeholder="Search by customer, phone, or ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <MenuItem value="all">All Customers</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Box>

          {loading ? (
            <Box sx={{ py: 10, display: "grid", placeItems: "center" }}>
              <CircularProgress sx={{ color: "#b88324" }} />
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filtered.map((user) => (
                <ListItem key={user._id} disablePadding sx={{ mb: 1.5 }}>
                  <ListItemButton
                    onClick={() => navigate(`/payment-history/${user._id}`)}
                    sx={{
                      borderRadius: "18px",
                      border: "1px solid rgba(169,126,39,0.12)",
                      bgcolor: "#fffdf8",
                      px: 2,
                      py: 1.6,
                    }}
                  >
                    <ListItemText
                      primary={user.name}
                      secondary={`${user.customerId || "-"}   ${user.phone || "-"}`}
                      primaryTypographyProps={{ fontWeight: 800, color: "#3e2b16" }}
                      secondaryTypographyProps={{ color: "#85684a" }}
                    />
                    <Chip
                      label={user.isActive ? "Active" : "Inactive"}
                      sx={{
                        bgcolor: user.isActive ? "rgba(45,138,82,0.12)" : "rgba(163,58,43,0.12)",
                        color: user.isActive ? "#2d8a52" : "#a33a2b",
                        fontWeight: 700,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}

              {!filtered.length && (
                <Box sx={{ py: 8, textAlign: "center", color: "#85684a" }}>
                  No customers match the current filters.
                </Box>
              )}
            </List>
          )}
        </Card>
      </Box>
    </Box>
  );
}
