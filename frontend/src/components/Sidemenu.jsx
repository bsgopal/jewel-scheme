import React from "react";
import {
  Box, Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Typography,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import HistoryIcon from "@mui/icons-material/History";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import GroupsIcon from "@mui/icons-material/Groups";
import logo from "./renic-tech-logo.svg";
import RenicCopyright from "./common/RenicCopyright";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Sidemenu({ open, onClose }) {
  const navigate = useNavigate();
  const role = (localStorage.getItem("role") || "").toLowerCase();

  const items = [
    { text: "Home",           icon: <HomeIcon />,          route: "/Home" },
    { text: "Offers",         icon: <LocalOfferIcon />,    route: "/offers" },
    { text: "New Arrivals",   icon: <StorefrontIcon />,    route: "/newarrivals" },
    { text: "Profile",        icon: <AccountCircleIcon />, route: "/profile" },
    ...(role === "admin"
      ? [
          { text: "Manage Center",   icon: <HomeIcon />,        route: "/admin-manage" },
          { text: "Rate Entry",      icon: <PriceCheckIcon />,  route: "/rateentry" },
          { text: "Manage Arrivals", icon: <StorefrontIcon />,  route: "/manage-newarrivals" },
          { text: "Payment History", icon: <HistoryIcon />,     route: "/payment-history" },
          { text: "Manage Agents",   icon: <GroupsIcon />,      route: "/admin/agents" }, // ← NEW
        ]
      : []),
  ];

  const handleNavigate = (route) => {
    onClose();
    navigate(route);
  };

  const handleLogout = () => {
    onClose();
    localStorage.clear();
    delete axios.defaults.headers.common.Authorization;
    window.location.replace("/");
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 310,
          borderTopRightRadius: 24,
          borderBottomRightRadius: 24,
          background: "linear-gradient(180deg, #fffdf8 0%, #fff3de 100%)",
          borderRight: "1px solid rgba(169,126,39,0.12)",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        },
      }}
    >
      {/* ── Logo + brand ── */}
      <Box sx={{ p: 3, borderBottom: "1px solid rgba(169,126,39,0.12)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            component="img" src={logo} alt="Renic Tech"
            sx={{ width: 88, height: 52, objectFit: "contain" }}
          />
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#4b3519" }}>
              Renic Tech
            </Typography>
            <Typography sx={{ color: "#85684a", fontSize: 13 }}>
              Jewellery savings platform
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Nav items ── */}
      <List sx={{ px: 2, py: 2, flex: 1, overflowY: "auto" }}>
        {items.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => handleNavigate(item.route)}
              sx={{
                borderRadius: "16px",
                bgcolor: "rgba(255,255,255,0.72)",
                border: "1px solid rgba(169,126,39,0.1)",
                "&:hover": { bgcolor: "#fff8eb" },
              }}
            >
              <ListItemIcon sx={{ color: "#b88324", minWidth: 38 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ fontWeight: 700, color: "#4b3519" }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* ── Logout ── */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: "16px",
            bgcolor: "#fff",
            border: "1px solid rgba(163,58,43,0.12)",
            "&:hover": { bgcolor: "#fff5f5" },
          }}
        >
          <ListItemIcon sx={{ color: "#a33a2b", minWidth: 38 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ fontWeight: 700, color: "#7c3428" }}
          />
        </ListItemButton>
        <Box sx={{ mt: 2, px: 0.5 }}>
          <RenicCopyright align="left" compact color="#85684a" />
        </Box>
      </Box>
    </Drawer>
  );
}
