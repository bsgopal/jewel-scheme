import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  IconButton, Typography, Box, Container, CircularProgress,
  Snackbar, Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getBackTarget, getCurrentRoute } from "../utils/navigation";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 180, damping: 22 } },
};

const MyPlans = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const currentRoute = getCurrentRoute(location);
  const backTarget = getBackTarget(location, "/Home");

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  // ── FIX: robust image resolver that handles all path formats ──────────────
  const getPlanImage = (plan) => {
    // Try every possible image field the backend might return
    const raw = plan?.banner_path || plan?.imageUrl || plan?.image_url || plan?.bannerUrl || null;
    if (!raw) return `${process.env.PUBLIC_URL}/plan-placeholder.jpg`;
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    // Relative path — prepend API base (strip trailing slash first)
    return `${API_BASE_URL.replace(/\/$/, "")}${raw.startsWith("/") ? "" : "/"}${raw}`;
  };

  // ── FIX: mapScheme now preserves ALL possible image fields ────────────────
  const mapScheme = (scheme) => ({
    id:                 scheme._id,
    plan_name:          scheme.schemeName,
    scheme_name:        scheme.schemeName,
    plan_type:          scheme.schemeType,
    amount_per_inst:    scheme.monthlyAmount,
    inst_amount:        scheme.monthlyAmount,
    duration:           scheme.totalInstallments,
    no_of_inst:         scheme.totalInstallments,
    start_date:         scheme.createdAt,
    join_date:          scheme.createdAt,
    // Keep ALL image fields so getPlanImage can find one that works
    banner_path:        scheme.imageUrl || scheme.banner_path || scheme.image_url || null,
    imageUrl:           scheme.imageUrl || null,
    image_url:          scheme.image_url || null,
    group_id:           null,
    is_closed:          ["redeemed", "cancelled"].includes(scheme.status) ? 1 : 0,
    status:             scheme.status,
    paidInstallments:   scheme.paidInstallments,
    totalInstallments:  scheme.totalInstallments,
    totalGoldWeight:    scheme.totalGoldWeight,
    totalAmountPaid:    scheme.totalAmountPaid,
  });

  const activeplans = Array.isArray(plans) ? plans.filter(p => Number(p?.is_closed) === 0) : [];
  const closedplans = Array.isArray(plans) ? plans.filter(p => Number(p?.is_closed) === 1) : [];

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/schemes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetched = Array.isArray(res.data.data) ? res.data.data : [];
        setPlans(fetched.map(mapScheme));
      } catch (err) {
        setSnackbar({ open: true, message: "Failed to load plans.", severity: "error" });
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [API_BASE_URL]);

  const statusColors = {
    active:   { bg: "rgba(46,204,113,0.9)",  text: "#fff" },
    matured:  { bg: "rgba(230,126,34,0.9)",  text: "#fff" },
    redeemed: { bg: "rgba(52,152,219,0.9)",  text: "#fff" },
    cancelled:{ bg: "rgba(192,57,43,0.9)",   text: "#fff" },
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FAF5F0",
      fontFamily: "'Montserrat', sans-serif",
      paddingTop: "env(safe-area-inset-top)",
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>

      {/* ── Header ── */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
          height: 60,
          background: "linear-gradient(135deg, #7B0000, #A50000)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1.5px solid rgba(255,200,80,0.3)",
          boxShadow: "0 3px 16px rgba(100,0,0,0.35)",
        }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(backTarget)}
          style={{
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,200,80,0.3)",
            borderRadius: 10, padding: "6px 8px", cursor: "pointer",
            display: "flex", alignItems: "center",
          }}
        >
          <ArrowBackIcon style={{ color: "#FFD700", fontSize: 20 }} />
        </motion.button>

        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#FFD700", fontFamily: "'Playfair Display', serif", textAlign: "center", lineHeight: 1 }}>
            My Plans
          </div>
          <div style={{ fontSize: "0.42rem", color: "rgba(255,220,130,0.65)", letterSpacing: "0.2em", textAlign: "center", textTransform: "uppercase" }}>
            Gold Savings Portfolio
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate("/newplan", { state: { backTo: currentRoute } })}
          style={{
            background: "linear-gradient(135deg, #FFD700, #E8A000)",
            border: "none", borderRadius: 10, padding: "7px 12px",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
          }}
        >
          <AddCircleOutlineIcon style={{ color: "#3B0000", fontSize: 16 }} />
          <span style={{ color: "#3B0000", fontSize: "0.6rem", fontWeight: 800, fontFamily: "'Montserrat', sans-serif" }}>New</span>
        </motion.button>
      </motion.div>

      {/* ── Body ── */}
      <div style={{ paddingTop: 72, paddingBottom: 30 }}>
        <Container maxWidth="lg" sx={{ py: 1.5 }}>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
              <CircularProgress sx={{ color: "#8B0000" }} />
            </div>
          ) : plans.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: "center", padding: "60px 20px",
                background: "#fff", borderRadius: 20,
                border: "1px solid rgba(139,26,26,0.1)",
                boxShadow: "0 4px 20px rgba(139,26,26,0.07)",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>💎</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#3B0000", fontFamily: "'Playfair Display', serif", marginBottom: 6 }}>
                No Active Plans
              </div>
              <div style={{ fontSize: "0.7rem", color: "#999", marginBottom: 20 }}>
                Start your gold savings journey today
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/newplan")}
                style={{
                  background: "linear-gradient(135deg, #7B0000, #C0392B)",
                  color: "#FFD700", border: "none", borderRadius: 12,
                  padding: "12px 28px", fontSize: "0.78rem", fontWeight: 800,
                  cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
                  letterSpacing: "0.08em",
                }}
              >JOIN A PLAN</motion.button>
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">

              {/* ── Active Plans ── */}
              {activeplans.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, #C0392B)" }} />
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#8B0000", letterSpacing: "0.2em" }}>
                    ✦ ACTIVE PLANS ✦
                  </span>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, #C0392B)" }} />
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 20 }}>
                {activeplans.map((plan) => {
                  const id = plan.id || plan._id;
                  const imageSrc = getPlanImage(plan);
                  const dateValue = plan.start_date || plan.join_date || null;
                  const startDateText = dateValue ? new Date(dateValue).toLocaleDateString() : "Not Available";
                  const progress = plan.totalInstallments > 0
                    ? Math.round((plan.paidInstallments / plan.totalInstallments) * 100)
                    : 0;
                  const sc = statusColors[plan.status] || statusColors.active;

                  return (
                    <motion.div key={id} variants={itemVariants} whileHover={{ y: -5 }}>
                      <div
                        style={{
                          background: "#FFFFFF", borderRadius: 18, overflow: "hidden",
                          border: "1.5px solid rgba(139,26,26,0.1)",
                          boxShadow: "0 6px 24px rgba(139,26,26,0.09)",
                          cursor: "pointer",
                        }}
                        onClick={() => navigate(`/plan-details/${id}`, { state: { plan, backTo: currentRoute } })}
                      >
                        {/* Banner image */}
                        <div style={{ position: "relative", height: 160 }}>
                          <img
                            src={imageSrc}
                            alt={plan.plan_name || "Plan"}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `${process.env.PUBLIC_URL}/plan-placeholder.jpg`;
                            }}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                          <div style={{
                            position: "absolute", inset: 0,
                            background: "linear-gradient(to bottom, transparent 40%, rgba(60,0,0,0.65) 100%)",
                          }} />
                          <div style={{
                            position: "absolute", bottom: 12, left: 14, right: 14,
                            fontSize: "0.85rem", fontWeight: 700, color: "#FFD700",
                            fontFamily: "'Playfair Display', serif",
                            textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                          }}>
                            {plan.plan_name || "Plan Name"}
                          </div>
                          <div style={{
                            position: "absolute", top: 10, right: 10,
                            background: sc.bg, color: sc.text,
                            fontSize: "0.5rem", fontWeight: 700, padding: "2px 8px",
                            borderRadius: 10, fontFamily: "'Montserrat', sans-serif",
                            letterSpacing: "0.1em",
                          }}>
                            {(plan.status || "active").toUpperCase()}
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ padding: "8px 16px 0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: "0.55rem", color: "#999" }}>
                              {plan.paidInstallments}/{plan.totalInstallments} installments
                            </span>
                            <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#8B0000" }}>
                              {progress}%
                            </span>
                          </div>
                          <div style={{ height: 5, background: "rgba(139,26,26,0.1)", borderRadius: 10 }}>
                            <div style={{
                              height: "100%", borderRadius: 10,
                              width: `${progress}%`,
                              background: "linear-gradient(90deg, #8B0000, #C0392B)",
                              transition: "width 0.6s ease",
                            }} />
                          </div>
                        </div>

                        {/* Details */}
                        <div style={{ padding: "10px 16px 16px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                            {[
                              { icon: <CurrencyRupeeIcon sx={{ fontSize: 14, color: "#8B0000" }} />, label: "Amount", value: `₹${plan.amount_per_inst}` },
                              { icon: <CalendarMonthIcon sx={{ fontSize: 14, color: "#8B0000" }} />, label: "Duration", value: `${plan.duration} months` },
                              { icon: <EventAvailableIcon sx={{ fontSize: 14, color: "#8B0000" }} />, label: "Start Date", value: startDateText },
                            ].map(({ icon, label, value }) => (
                              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {icon}
                                <span style={{ fontSize: "0.65rem", color: "#999" }}>{label}:</span>
                                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#3B0000" }}>{value}</span>
                              </div>
                            ))}
                          </div>

                          <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/plan-details/${id}`, { state: { plan } });
                            }}
                            style={{
                              width: "100%", height: 40, marginTop: 14,
                              borderRadius: 10, border: "none",
                              background: "linear-gradient(135deg, #7B0000, #C0392B)",
                              color: "#FFD700", fontWeight: 800, fontSize: "0.7rem",
                              letterSpacing: "0.1em", textTransform: "uppercase",
                              cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
                            }}
                          >VIEW DETAILS</motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Join new plan card */}
                <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
                  <div
                    onClick={() => navigate("/newplan", { state: { backTo: currentRoute } })}
                    style={{
                      background: "#FFFFFF", borderRadius: 18,
                      border: "2px dashed rgba(139,26,26,0.25)",
                      minHeight: 220, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      cursor: "pointer", gap: 10,
                    }}
                  >
                    <div style={{
                      width: 52, height: 52, borderRadius: "50%",
                      background: "rgba(139,26,26,0.07)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <AddCircleOutlineIcon sx={{ fontSize: 28, color: "#8B0000" }} />
                    </div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#8B0000", fontFamily: "'Playfair Display', serif" }}>
                      Join New Plan
                    </div>
                    <div style={{ fontSize: "0.62rem", color: "#BBB", textAlign: "center", padding: "0 20px" }}>
                      Explore latest gold schemes
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* ── Closed Plans ── */}
              {closedplans.length > 0 && (
                <div style={{ marginTop: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, #C0392B)" }} />
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#8B0000", letterSpacing: "0.2em" }}>
                      ✦ CLOSED PLANS (HISTORY) ✦
                    </span>
                    <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, #C0392B)" }} />
                  </div>

                  <div style={{
                    background: "#FFFFFF", borderRadius: 16,
                    border: "1px solid rgba(139,26,26,0.1)",
                    boxShadow: "0 4px 16px rgba(139,26,26,0.06)",
                    overflow: "hidden",
                  }}>
                    {closedplans.map((plan, i) => (
                      <motion.div
                        key={plan.id}
                        whileHover={{ backgroundColor: "rgba(139,26,26,0.03)" }}
                        onClick={() => navigate(`/plan-details/${plan.id}`, { state: { plan, readOnly: true } })}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "14px 18px",
                          borderBottom: i < closedplans.length - 1 ? "1px solid rgba(139,26,26,0.07)" : "none",
                          cursor: "pointer",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#3B0000", marginBottom: 2 }}>
                            {plan.plan_name}
                          </div>
                          <div style={{ fontSize: "0.58rem", color: "#999" }}>
                            ₹{plan.amount_per_inst} · {plan.duration} months
                          </div>
                        </div>
                        <div style={{
                          padding: "3px 10px", borderRadius: 10,
                          background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.25)",
                        }}>
                          <span style={{ fontSize: "0.52rem", fontWeight: 700, color: "#C0392B", letterSpacing: "0.1em" }}>
                            {plan.status?.toUpperCase() || "CLOSED"}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </Container>
      </div>

      <Snackbar open={snackbar.open} autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default MyPlans;