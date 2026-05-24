import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Alert, CircularProgress, Snackbar } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DiamondIcon from "@mui/icons-material/Diamond";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { motion } from "framer-motion";
import { getBackTarget } from "../utils/navigation";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const fallbackPlanBanner = `${process.env.PUBLIC_URL}/images/banner1.png`;

const getPlanImage = (plan) => {
  const raw = plan?.banner_path || plan?.imageUrl || plan?.image_url || plan?.bannerUrl || "";

  if (!raw) return fallbackPlanBanner;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  return `${API_BASE_URL.replace(/\/$/, "")}${raw.startsWith("/") ? "" : "/"}${raw}`;
};

export default function PlanCatalogDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const isAdmin = role === "admin";
  const backTarget = getBackTarget(location, "/newplan");

  const [plan, setPlan] = useState(location.state?.plan || null);
  const [loading, setLoading] = useState(!location.state?.plan);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  useEffect(() => {
    if (location.state?.plan?.id === id || location.state?.plan?._id === id) {
      return;
    }

    const fetchPlan = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/plan-catalog/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setPlan(res.data?.data || null);
      } catch (error) {
        setSnackbar({ open: true, message: "Failed to load plan details.", severity: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [id, location.state?.plan]);

  const amount = Number(plan?.amount_per_inst || plan?.minAmount || 0);
  const duration = Number(plan?.duration || plan?.totalInstallments || 0);
  const totalValue = useMemo(() => {
    const maxAmount = Number(plan?.maxAmount || 0);
    if (maxAmount > 0) return maxAmount;
    return amount * duration;
  }, [amount, duration, plan?.maxAmount]);
  const features = Array.isArray(plan?.features) ? plan.features.filter(Boolean) : [];
  const terms = Array.isArray(plan?.terms) ? plan.terms.filter(Boolean) : [];
  const benefits = plan?.benefits || {};
  const imageSrc = getPlanImage(plan);
  const statusText = plan?.active === false ? "Inactive" : "Active";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#FAF5F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#8B0000" }} />
      </div>
    );
  }

  if (!plan) {
    return (
      <div style={{ minHeight: "100vh", background: "#FAF5F0", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ color: "#8B0000", fontWeight: 700 }}>Plan not found.</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAF5F0", fontFamily: "'Montserrat', sans-serif", paddingBottom: 36 }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "linear-gradient(135deg, #7B0000, #A50000)",
          minHeight: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "calc(env(safe-area-inset-top, 0px) + 6px) 16px 8px",
          borderBottom: "1.5px solid rgba(255,200,80,0.3)",
          boxShadow: "0 3px 16px rgba(100,0,0,0.35)",
        }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(backTarget)}
          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,200,80,0.3)", borderRadius: 10, padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <ArrowBackIcon style={{ color: "#FFD700", fontSize: 20 }} />
        </motion.button>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#FFD700", fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
            Plan Details
          </div>
          <div style={{ fontSize: "0.42rem", color: "rgba(255,220,130,0.65)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Scheme Catalog Preview
          </div>
        </div>

        {isAdmin ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`/createnewplan/${id}`, { state: { plan, backTo: backTarget } })}
            style={{ background: "linear-gradient(135deg, #FFD700, #E8A000)", border: "none", borderRadius: 10, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
          >
            <EditOutlinedIcon style={{ color: "#3B0000", fontSize: 15 }} />
            <span style={{ color: "#3B0000", fontSize: "0.62rem", fontWeight: 800 }}>Edit</span>
          </motion.button>
        ) : (
          <div style={{ width: 62 }} />
        )}
      </div>

      <div style={{ background: "linear-gradient(160deg, #4B0000 0%, #7B0000 55%, #A50000 100%)", padding: "24px 18px 26px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(280px, 0.85fr)", gap: 18 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.25)", borderRadius: 20, padding: "3px 12px", marginBottom: 10 }}>
                <DiamondIcon style={{ color: "#FFD700", fontSize: 11 }} />
                <span style={{ fontSize: "0.52rem", color: "#FFD700", fontWeight: 700, letterSpacing: "0.12em" }}>JEWELLERY SAVINGS PLAN</span>
              </div>
              <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "#FFD700", fontFamily: "'Playfair Display', serif", lineHeight: 1.05 }}>
                {plan.plan_name || plan.name}
              </div>
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[plan.plan_type || "Monthly", plan.jewellery_type || "All", statusText].map((item) => (
                  <div key={item} style={{ padding: "5px 10px", borderRadius: 999, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,215,0,0.16)", color: "#FFF0C0", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {item}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, color: "rgba(255,240,192,0.8)", fontSize: "0.8rem", lineHeight: 1.7 }}>
                {plan.note || plan.description || "No additional plan description added."}
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,215,0,0.15)", borderRadius: 18, overflow: "hidden" }}>
              <img
                src={imageSrc}
                alt={plan.plan_name || "Plan"}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = fallbackPlanBanner;
                }}
                style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "18px 16px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 18 }}>
          {[
            { icon: <CurrencyRupeeIcon style={{ fontSize: 18, color: "#8B0000" }} />, label: "Monthly Amount", value: `Rs ${amount.toLocaleString("en-IN")}` },
            { icon: <CalendarMonthIcon style={{ fontSize: 18, color: "#8B0000" }} />, label: "Duration", value: `${duration} months` },
            { icon: <AutoAwesomeIcon style={{ fontSize: 18, color: "#8B0000" }} />, label: "Bonus", value: `${Number(plan?.bonusPercentage || 0)}%` },
            { icon: <DiamondIcon style={{ fontSize: 18, color: "#8B0000" }} />, label: "Target Value", value: `Rs ${totalValue.toLocaleString("en-IN")}` },
          ].map((item) => (
            <div key={item.label} style={{ background: "#fff", border: "1px solid rgba(139,26,26,0.1)", borderRadius: 16, padding: "16px", boxShadow: "0 2px 12px rgba(139,26,26,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {item.icon}
                <span style={{ fontSize: "0.62rem", color: "#999", fontWeight: 700 }}>{item.label}</span>
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#3B0000", fontFamily: "'Playfair Display', serif" }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 }}>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ background: "#fff", border: "1px solid rgba(139,26,26,0.1)", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(139,26,26,0.06)" }}>
              <div style={{ background: "linear-gradient(90deg, rgba(139,26,26,0.05), rgba(139,26,26,0.02))", borderBottom: "1px solid rgba(139,26,26,0.08)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircleIcon style={{ fontSize: 16, color: "#8B0000" }} />
                <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#3B0000" }}>Plan Features</span>
              </div>
              <div style={{ padding: "14px 16px" }}>
                {features.length ? features.map((feature, index) => (
                  <div key={`${feature}-${index}`} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 0", color: "#5B4130", fontSize: "0.78rem", lineHeight: 1.65 }}>
                    <span style={{ color: "#8B0000", fontWeight: 800 }}>•</span>
                    <span>{feature}</span>
                  </div>
                )) : <div style={{ color: "#999", fontSize: "0.76rem" }}>No plan features added.</div>}
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid rgba(139,26,26,0.1)", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(139,26,26,0.06)" }}>
              <div style={{ background: "linear-gradient(90deg, rgba(139,26,26,0.05), rgba(139,26,26,0.02))", borderBottom: "1px solid rgba(139,26,26,0.08)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <InfoOutlinedIcon style={{ fontSize: 16, color: "#8B0000" }} />
                <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#3B0000" }}>Terms & Conditions</span>
              </div>
              <div style={{ padding: "14px 16px" }}>
                {terms.length ? terms.map((term, index) => (
                  <div key={`${term}-${index}`} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 0", color: "#5B4130", fontSize: "0.78rem", lineHeight: 1.65 }}>
                    <span style={{ color: "#8B0000", fontWeight: 800 }}>{index + 1}.</span>
                    <span>{term}</span>
                  </div>
                )) : <div style={{ color: "#999", fontSize: "0.76rem" }}>No terms added.</div>}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ background: "#fff", border: "1px solid rgba(139,26,26,0.1)", borderRadius: 16, padding: "16px", boxShadow: "0 2px 12px rgba(139,26,26,0.06)" }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#3B0000", marginBottom: 12 }}>Benefit Summary</div>
              {[
                ["Making Charge Discount", `${Number(benefits.makingChargeDiscount || 0)}%`],
                ["Wastage Discount", `${Number(benefits.wastageDiscount || 0)}%`],
                ["Diamond Discount", `${Number(benefits.diamondDiscount || 0)}%`],
                ["Extra Bonus", `${Number(benefits.extraBonusPercentage || 0)}%`],
                ["Group Code", plan.groupCode || "-"],
                ["Priority", `${Number(plan.priority || 0)}`],
              ].map(([label, value], index, arr) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: index < arr.length - 1 ? "1px solid rgba(139,26,26,0.06)" : "none" }}>
                  <span style={{ fontSize: "0.68rem", color: "#999" }}>{label}</span>
                  <span style={{ fontSize: "0.72rem", color: "#3B0000", fontWeight: 700, textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </div>

            {isAdmin ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => navigate(`/createnewplan/${id}`, { state: { plan, backTo: backTarget } })}
                style={{ height: 48, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7B0000, #C0392B)", color: "#FFD700", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 4px 16px rgba(139,26,26,0.3)" }}
              >
                Edit This Plan
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => navigate(`/plans/joinnewplan/${id}`, { state: { plan, backTo: backTarget } })}
                style={{ height: 48, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7B0000, #C0392B)", color: "#FFD700", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 4px 16px rgba(139,26,26,0.3)" }}
              >
                Join This Plan
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
