import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Typography, Checkbox, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ChecklistIcon from "@mui/icons-material/Checklist";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getBackTarget, getCurrentRoute } from "../utils/navigation";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const fallbackPlanBanner = `${process.env.PUBLIC_URL}/images/banner1.png`;

const getResolvedImageUrl = (plan) => {
  const raw = plan?.banner_path || plan?.imageUrl || plan?.image_url || plan?.bannerUrl || "";

  if (!raw) return fallbackPlanBanner;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  return `${API_BASE_URL.replace(/\/$/, "")}${raw.startsWith("/") ? "" : "/"}${raw}`;
};

export default function NewPlan() {
  const location = useLocation();
  const [plans, setPlans] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();
  const userRole = (localStorage.getItem("role") || "").toLowerCase();
  const canManagePlans = userRole === "admin";
  const currentRoute = getCurrentRoute(location);
  const backTarget = getBackTarget(location, "/Home");

  const fetchPlans = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/plan-catalog`, {
        params: { include_all: canManagePlans ? "true" : "false" },
        headers: localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {},
      });
      setPlans(res.data.data || []);
    } catch (error) {
      setPlans([]);
    }
  }, [canManagePlans]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchesSearch = !search.trim()
        || plan.plan_name?.toLowerCase().includes(search.toLowerCase())
        || plan.groupCode?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all"
        || (statusFilter === "active" && plan.active)
        || (statusFilter === "inactive" && !plan.active);

      return matchesSearch && matchesStatus;
    });
  }, [plans, search, statusFilter]);

  const togglePlanSelection = (planId) => {
    setSelectedPlans((prev) => (prev.includes(planId) ? prev.filter((item) => item !== planId) : [...prev, planId]));
  };

  const handleDelete = async () => {
    try {
      await Promise.all(
        selectedPlans.map((planId) =>
          axios.delete(`${API_BASE_URL}/api/plan-catalog/${planId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          })
        )
      );
      setSelectedPlans([]);
      setConfirmDelete(false);
      fetchPlans();
    } catch (error) {
      setConfirmDelete(false);
    }
  };

  const handleEdit = () => {
    if (selectedPlans.length === 1) {
      navigate(`/createnewplan/${selectedPlans[0]}`, { state: { backTo: currentRoute } });
    }
  };

  const handlePrimaryAction = (plan) => {
    if (canManagePlans) {
      navigate(`/catalog-plan-details/${plan.id}`, { state: { plan, backTo: currentRoute } });
      return;
    }

    navigate(`/plans/joinnewplan/${plan.id}`, { state: { backTo: currentRoute } });
  };

  const getBannerUrl = (plan) => {
    return getResolvedImageUrl(plan);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAF5F0", fontFamily: "'Montserrat', sans-serif", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="catalog-header" style={{ background: "linear-gradient(135deg, #7B0000, #A50000)", padding: "calc(env(safe-area-inset-top, 0px) + 6px) 16px 8px", minHeight: "calc(54px + env(safe-area-inset-top, 0px))", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid rgba(255,200,80,0.4)", boxShadow: "0 6px 24px rgba(100,0,0,0.4)", position: "sticky", top: 0, zIndex: 100, gap: 10 }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(backTarget)} style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,200,80,0.4)", borderRadius: 10, padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center", transition: "all 0.2s" }}>
          <ArrowBackIcon style={{ color: "#FFD700", fontSize: 22 }} />
        </motion.button>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#FFD700", lineHeight: 1, letterSpacing: "0.5px" }}>SCHEME PLANS</div>
          <div style={{ fontSize: "0.5rem", color: "rgba(255,220,130,0.8)", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: "2px", fontWeight: 600 }}>
            {canManagePlans ? "Admin Management" : "Browse & Join"}
          </div>
        </div>

        {canManagePlans ? (
          <div className="catalog-header-actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/createnewplan", { state: { backTo: currentRoute } })} style={{ background: "linear-gradient(135deg, #FFD700, #E8A000)", border: "none", borderRadius: 10, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "#3B0000", fontSize: "0.6rem", fontWeight: 800 }}>New</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setSelectionMode((prev) => !prev); setSelectedPlans([]); }} style={{ background: selectionMode ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.12)", border: "1px solid rgba(255,200,80,0.3)", borderRadius: 10, padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <ChecklistIcon style={{ color: "#FFD700", fontSize: 16 }} />
              <span style={{ color: "#FFD700", fontSize: "0.6rem", fontWeight: 700 }}>{selectionMode ? "Cancel" : "Select"}</span>
            </motion.button>
          </div>
        ) : (
          <div style={{ width: 60 }} />
        )}
      </div>

      <div style={{ padding: "16px 14px 8px", display: "grid", gap: 14 }}>
        <div className="catalog-toolbar" style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr", gap: 12 }}>
          <TextField
            placeholder="Search plan name or group code"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: "#8B0000", mr: 1 }} /> }}
          />
          <TextField select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <MenuItem value="all">All Plans</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </div>
      </div>

      <AnimatePresence>
        {canManagePlans && selectionMode && selectedPlans.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ background: "#FFFFFF", borderBottom: "1px solid rgba(139,26,26,0.1)", display: "flex", gap: 10, padding: "10px 16px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleEdit} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #7B0000, #C0392B)", color: "#FFD700", fontWeight: 700, fontSize: "0.72rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <EditOutlinedIcon style={{ fontSize: 15 }} /> Edit
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmDelete(true)} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(192,57,43,0.3)", background: "rgba(192,57,43,0.08)", color: "#C0392B", fontWeight: 700, fontSize: "0.72rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <DeleteOutlineIcon style={{ fontSize: 15 }} /> Delete
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ padding: "18px 14px 40px" }}>
        {filteredPlans.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 18, border: "1px solid rgba(139,26,26,0.1)", boxShadow: "0 4px 20px rgba(139,26,26,0.07)" }}>
            <div style={{ fontSize: "0.85rem", color: "#999" }}>{canManagePlans ? "No plans created yet" : "No plans available at the moment"}</div>
            {canManagePlans ? (
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate("/createnewplan", { state: { backTo: currentRoute } })} style={{ marginTop: 18, height: 42, padding: "0 18px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7B0000, #C0392B)", color: "#FFD700", fontWeight: 800, fontSize: "0.74rem", letterSpacing: "0.08em", cursor: "pointer" }}>
                Create New Plan
              </motion.button>
            ) : null}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {filteredPlans.map((plan, index) => (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: index * 0.04, type: "spring", stiffness: 180, damping: 22 }}>
                <div style={{ background: "#FFFFFF", borderRadius: 20, overflow: "hidden", border: "1.5px solid rgba(139,26,26,0.1)", boxShadow: "0 6px 24px rgba(139,26,26,0.09)", position: "relative" }}>
                  {selectionMode && canManagePlans && (
                    <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}>
                      <Checkbox checked={selectedPlans.includes(plan.id)} onChange={() => togglePlanSelection(plan.id)} sx={{ color: "rgba(255,255,255,0.8)", "&.Mui-checked": { color: "#FFD700" }, background: "rgba(0,0,0,0.4)", borderRadius: "6px", p: 0.5 }} />
                    </div>
                  )}

                  {plan.popular ? (
                    <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10, background: "linear-gradient(135deg, #FFF3CD, #F5C76D)", color: "#7B0000", fontSize: "0.55rem", fontWeight: 800, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase" }}>
                      Popular
                    </div>
                  ) : null}

                  <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                    <motion.img
                      src={getBannerUrl(plan)}
                      alt={plan.plan_name}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackPlanBanner;
                      }}
                      whileHover={{ scale: 1.04 }}
                      transition={{ duration: 0.35 }}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 45%, rgba(50,0,0,0.74) 100%)" }} />
                    <div style={{ position: "absolute", bottom: 14, left: 16, right: 16, fontSize: "1rem", fontWeight: 700, color: "#FFD700" }}>
                      {plan.plan_name}
                    </div>
                  </div>

                  <div style={{ background: "linear-gradient(90deg, rgba(139,26,26,0.06), rgba(139,26,26,0.02))", borderBottom: "1px solid rgba(139,26,26,0.08)", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.6rem", color: "#8B0000", fontWeight: 600, letterSpacing: "0.1em" }}>
                      {plan.plan_type} · {plan.jewellery_type}
                    </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#3B0000" }}>Rs {Number(plan.amount_per_inst || 0).toLocaleString("en-IN")}/mo</span>
                  </div>

                  <div style={{ padding: "14px 16px 18px" }}>
                    {plan.note ? <p style={{ fontSize: "0.65rem", color: "#888", margin: "0 0 12px", lineHeight: 1.6 }}>{plan.note}</p> : null}
                    {plan.features?.length > 0 ? (
                      <div style={{ marginTop: 10 }}>
                        {plan.features.slice(0, 4).map((feature, itemIndex) => (
                          <div key={itemIndex} style={{ fontSize: "0.6rem", color: "#666", padding: "3px 0", display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: "#8B0000", fontWeight: 700 }}>•</span> {feature}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {!selectionMode && (
                      <motion.button whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }} onClick={() => handlePrimaryAction(plan)} style={{ width: "100%", height: 44, marginTop: 16, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7B0000, #C0392B)", color: "#FFD700", fontWeight: 800, fontSize: "0.74rem", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 4px 14px rgba(139,26,26,0.3)" }}>
                        {canManagePlans ? "View Plan" : "Join This Plan"}
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} PaperProps={{ sx: { borderRadius: "16px", padding: "8px" } }}>
        <DialogTitle sx={{ fontSize: "1rem", fontWeight: 700, color: "#3B0000" }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.82rem", color: "#666" }}>Delete {selectedPlans.length} selected plan(s)?</Typography>
        </DialogContent>
        <DialogActions sx={{ gap: 1, pb: 2, px: 2 }}>
          <button onClick={() => setConfirmDelete(false)} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(139,26,26,0.2)", background: "transparent", color: "#666", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>Cancel</button>
          <button onClick={handleDelete} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #7B0000, #C0392B)", color: "#FFD700", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}>Delete</button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
