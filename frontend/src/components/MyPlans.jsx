import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Alert, CircularProgress, Container, Snackbar } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getBackTarget, getCurrentRoute } from "../utils/navigation";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 180, damping: 22 } },
};

const statusColors = {
  active: { bg: "rgba(46,204,113,0.9)", text: "#fff" },
  matured: { bg: "rgba(230,126,34,0.9)", text: "#fff" },
  redeemed: { bg: "rgba(52,152,219,0.9)", text: "#fff" },
  cancelled: { bg: "rgba(192,57,43,0.9)", text: "#fff" },
  inactive: { bg: "rgba(192,57,43,0.9)", text: "#fff" },
};

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const fallbackPlanBanner = `${process.env.PUBLIC_URL}/images/banner1.png`;

const getPlanImage = (plan) => {
  const raw = plan?.banner_path || plan?.imageUrl || plan?.image_url || plan?.bannerUrl || null;

  if (!raw) return fallbackPlanBanner;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  return `${API_BASE_URL.replace(/\/$/, "")}${raw.startsWith("/") ? "" : "/"}${raw}`;
};

const mapScheme = (scheme) => ({
  id: scheme._id,
  plan_name: scheme.schemeName,
  scheme_name: scheme.schemeName,
  plan_type: scheme.schemeType,
  amount_per_inst: scheme.monthlyAmount,
  inst_amount: scheme.monthlyAmount,
  duration: scheme.totalInstallments,
  no_of_inst: scheme.totalInstallments,
  start_date: scheme.createdAt,
  join_date: scheme.createdAt,
  banner_path: scheme.imageUrl || scheme.banner_path || scheme.image_url || null,
  imageUrl: scheme.imageUrl || null,
  image_url: scheme.image_url || null,
  is_closed: ["redeemed", "cancelled"].includes(scheme.status) ? 1 : 0,
  status: scheme.status,
  paidInstallments: scheme.paidInstallments,
  totalInstallments: scheme.totalInstallments,
  totalGoldWeight: scheme.totalGoldWeight,
  totalAmountPaid: scheme.totalAmountPaid,
  source: "scheme",
});

const mapCatalogPlan = (plan) => ({
  id: plan.id || plan._id,
  plan_name: plan.plan_name || plan.name,
  scheme_name: plan.plan_name || plan.name,
  plan_type: plan.plan_type || plan.type,
  amount_per_inst: plan.amount_per_inst || plan.minAmount || 0,
  inst_amount: plan.amount_per_inst || plan.minAmount || 0,
  duration: plan.duration || plan.totalInstallments || 0,
  no_of_inst: plan.duration || plan.totalInstallments || 0,
  start_date: plan.createdAt,
  join_date: plan.createdAt,
  banner_path: plan.banner_path || plan.imageUrl || plan.image_url || null,
  imageUrl: plan.imageUrl || null,
  image_url: plan.image_url || null,
  active: plan.active !== false,
  status: plan.active === false ? "inactive" : "active",
  note: plan.note || plan.description || "",
  popular: Boolean(plan.popular),
  source: "catalog",
});

function AdminPlanCard({ plan, currentRoute, navigate }) {
  const id = plan.id || plan._id;
  const imageSrc = getPlanImage(plan);
  const dateValue = plan.start_date || plan.join_date || null;
  const dateText = dateValue ? new Date(dateValue).toLocaleDateString("en-IN") : "Not Available";
  const badge = plan.active === false ? "inactive" : "active";
  const badgeStyle = statusColors[badge];

  return (
    <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
      <div
        onClick={() => navigate(`/createnewplan/${id}`, { state: { plan, backTo: currentRoute } })}
        style={{
          background: "#FFFFFF",
          borderRadius: 18,
          overflow: "hidden",
          border: "1.5px solid rgba(139,26,26,0.1)",
          boxShadow: "0 6px 24px rgba(139,26,26,0.09)",
          cursor: "pointer",
        }}
      >
        <div style={{ position: "relative", height: 160 }}>
          <img
            src={imageSrc}
            alt={plan.plan_name || "Plan"}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallbackPlanBanner;
            }}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, transparent 40%, rgba(60,0,0,0.65) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 14,
              right: 14,
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "#FFD700",
              fontFamily: "'Playfair Display', serif",
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
            }}
          >
            {plan.plan_name || "Plan Name"}
          </div>
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: badgeStyle.bg,
              color: badgeStyle.text,
              fontSize: "0.5rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 10,
              letterSpacing: "0.1em",
            }}
          >
            {badge.toUpperCase()}
          </div>
        </div>

        <div style={{ padding: "12px 16px 16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              {
                icon: <CurrencyRupeeIcon sx={{ fontSize: 14, color: "#8B0000" }} />,
                label: "Starting Amount",
                value: `Rs ${Number(plan.amount_per_inst || 0).toLocaleString("en-IN")}`,
              },
              {
                icon: <CalendarMonthIcon sx={{ fontSize: 14, color: "#8B0000" }} />,
                label: "Duration",
                value: `${plan.duration} months`,
              },
              {
                icon: <EventAvailableIcon sx={{ fontSize: 14, color: "#8B0000" }} />,
                label: "Created",
                value: dateText,
              },
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
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/createnewplan/${id}`, { state: { plan, backTo: currentRoute } });
            }}
            style={{
              width: "100%",
              height: 40,
              marginTop: 14,
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #7B0000, #C0392B)",
              color: "#FFD700",
              fontWeight: 800,
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Edit Plan
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function SchemeCard({ plan, currentRoute, navigate }) {
  const id = plan.id || plan._id;
  const imageSrc = getPlanImage(plan);
  const dateValue = plan.start_date || plan.join_date || null;
  const startDateText = dateValue ? new Date(dateValue).toLocaleDateString("en-IN") : "Not Available";
  const progress = plan.totalInstallments > 0
    ? Math.round(((plan.paidInstallments || 0) / plan.totalInstallments) * 100)
    : 0;
  const badgeStyle = statusColors[plan.status] || statusColors.active;

  return (
    <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 18,
          overflow: "hidden",
          border: "1.5px solid rgba(139,26,26,0.1)",
          boxShadow: "0 6px 24px rgba(139,26,26,0.09)",
          cursor: "pointer",
        }}
        onClick={() => navigate(`/plan-details/${id}`, { state: { plan, backTo: currentRoute } })}
      >
        <div style={{ position: "relative", height: 160 }}>
          <img
            src={imageSrc}
            alt={plan.plan_name || "Plan"}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallbackPlanBanner;
            }}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, transparent 40%, rgba(60,0,0,0.65) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 14,
              right: 14,
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "#FFD700",
              fontFamily: "'Playfair Display', serif",
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
            }}
          >
            {plan.plan_name || "Plan Name"}
          </div>
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: badgeStyle.bg,
              color: badgeStyle.text,
              fontSize: "0.5rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 10,
              letterSpacing: "0.1em",
            }}
          >
            {(plan.status || "active").toUpperCase()}
          </div>
        </div>

        <div style={{ padding: "8px 16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: "0.55rem", color: "#999" }}>
              {plan.paidInstallments || 0}/{plan.totalInstallments || 0} installments
            </span>
            <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#8B0000" }}>{progress}%</span>
          </div>
          <div style={{ height: 5, background: "rgba(139,26,26,0.1)", borderRadius: 10 }}>
            <div
              style={{
                height: "100%",
                borderRadius: 10,
                width: `${progress}%`,
                background: "linear-gradient(90deg, #8B0000, #C0392B)",
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>

        <div style={{ padding: "10px 16px 16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              {
                icon: <CurrencyRupeeIcon sx={{ fontSize: 14, color: "#8B0000" }} />,
                label: "Amount",
                value: `Rs ${Number(plan.amount_per_inst || 0).toLocaleString("en-IN")}`,
              },
              {
                icon: <CalendarMonthIcon sx={{ fontSize: 14, color: "#8B0000" }} />,
                label: "Duration",
                value: `${plan.duration} months`,
              },
              {
                icon: <EventAvailableIcon sx={{ fontSize: 14, color: "#8B0000" }} />,
                label: "Start Date",
                value: startDateText,
              },
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
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/plan-details/${id}`, { state: { plan, backTo: currentRoute } });
            }}
            style={{
              width: "100%",
              height: 40,
              marginTop: 14,
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #7B0000, #C0392B)",
              color: "#FFD700",
              fontWeight: 800,
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            View Details
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function MyPlans() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const isAdmin = role === "admin";
  const currentRoute = getCurrentRoute(location);
  const backTarget = getBackTarget(location, "/Home");

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);

      try {
        const token = localStorage.getItem("token");

        if (isAdmin) {
          const res = await axios.get(`${API_BASE_URL}/api/plan-catalog`, {
            params: { include_all: "true" },
            headers: { Authorization: `Bearer ${token}` },
          });
          const fetched = Array.isArray(res.data?.data) ? res.data.data : [];
          setPlans(fetched.map(mapCatalogPlan));
        } else {
          const res = await axios.get(`${API_BASE_URL}/api/schemes`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const fetched = Array.isArray(res.data?.data) ? res.data.data : [];
          setPlans(fetched.map(mapScheme));
        }
      } catch (error) {
        setSnackbar({ open: true, message: "Failed to load plans.", severity: "error" });
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [isAdmin]);

  const activePlans = useMemo(() => {
    if (!Array.isArray(plans)) return [];
    return isAdmin
      ? plans.filter((plan) => plan.active !== false)
      : plans.filter((plan) => Number(plan?.is_closed) === 0);
  }, [isAdmin, plans]);

  const closedPlans = useMemo(() => {
    if (!Array.isArray(plans) || isAdmin) return [];
    return plans.filter((plan) => Number(plan?.is_closed) === 1);
  }, [isAdmin, plans]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF5F0",
        fontFamily: "'Montserrat', sans-serif",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          minHeight: "calc(60px + env(safe-area-inset-top, 0px))",
          background: "linear-gradient(135deg, #7B0000, #A50000)",
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
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,200,80,0.3)",
            borderRadius: 10,
            padding: "6px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ArrowBackIcon style={{ color: "#FFD700", fontSize: 20 }} />
        </motion.button>

        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          <div
            style={{
              fontSize: "1rem",
              fontWeight: 800,
              color: "#FFD700",
              fontFamily: "'Playfair Display', serif",
              textAlign: "center",
              lineHeight: 1,
            }}
          >
            My Plans
          </div>
          <div
            style={{
              fontSize: "0.42rem",
              color: "rgba(255,220,130,0.65)",
              letterSpacing: "0.2em",
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            {isAdmin ? "Plan Catalog Management" : "Gold Savings Portfolio"}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(isAdmin ? "/createnewplan" : "/newplan", { state: { backTo: currentRoute } })}
          style={{
            background: "linear-gradient(135deg, #FFD700, #E8A000)",
            border: "none",
            borderRadius: 10,
            padding: "7px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <AddCircleOutlineIcon style={{ color: "#3B0000", fontSize: 16 }} />
          <span style={{ color: "#3B0000", fontSize: "0.6rem", fontWeight: 800 }}>{isAdmin ? "Create" : "New"}</span>
        </motion.button>
      </motion.div>

      <div style={{ paddingTop: "calc(72px + env(safe-area-inset-top, 0px))", paddingBottom: 30 }}>
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
                textAlign: "center",
                padding: "60px 20px",
                background: "#fff",
                borderRadius: 20,
                border: "1px solid rgba(139,26,26,0.1)",
                boxShadow: "0 4px 20px rgba(139,26,26,0.07)",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>{isAdmin ? "📋" : "💎"}</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#3B0000", fontFamily: "'Playfair Display', serif", marginBottom: 6 }}>
                {isAdmin ? "No Plans Created" : "No Active Plans"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#999", marginBottom: 20 }}>
                {isAdmin ? "Create your first jewel scheme plan from here" : "Start your gold savings journey today"}
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(isAdmin ? "/createnewplan" : "/newplan", { state: { backTo: currentRoute } })}
                style={{
                  background: "linear-gradient(135deg, #7B0000, #C0392B)",
                  color: "#FFD700",
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 28px",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                }}
              >
                {isAdmin ? "CREATE PLAN" : "JOIN A PLAN"}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              {activePlans.length > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, #C0392B)" }} />
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#8B0000", letterSpacing: "0.2em" }}>
                    {isAdmin ? "EXISTING PLANS" : "ACTIVE PLANS"}
                  </span>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, #C0392B)" }} />
                </div>
              ) : null}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 20 }}>
                {activePlans.map((plan) => (
                  isAdmin
                    ? <AdminPlanCard key={plan.id} plan={plan} currentRoute={currentRoute} navigate={navigate} />
                    : <SchemeCard key={plan.id} plan={plan} currentRoute={currentRoute} navigate={navigate} />
                ))}

                <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
                  <div
                    onClick={() => navigate(isAdmin ? "/createnewplan" : "/newplan", { state: { backTo: currentRoute } })}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 18,
                      border: "2px dashed rgba(139,26,26,0.25)",
                      minHeight: 220,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        background: "rgba(139,26,26,0.07)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AddCircleOutlineIcon sx={{ fontSize: 28, color: "#8B0000" }} />
                    </div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#8B0000", fontFamily: "'Playfair Display', serif" }}>
                      {isAdmin ? "Create New Plan" : "Join New Plan"}
                    </div>
                    <div style={{ fontSize: "0.62rem", color: "#BBB", textAlign: "center", padding: "0 20px" }}>
                      {isAdmin ? "Add a new jewel scheme to the catalog" : "Explore latest gold schemes"}
                    </div>
                  </div>
                </motion.div>
              </div>

              {!isAdmin && closedPlans.length > 0 ? (
                <div style={{ marginTop: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, #C0392B)" }} />
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#8B0000", letterSpacing: "0.2em" }}>
                      CLOSED PLANS (HISTORY)
                    </span>
                    <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, #C0392B)" }} />
                  </div>

                  <div
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 16,
                      border: "1px solid rgba(139,26,26,0.1)",
                      boxShadow: "0 4px 16px rgba(139,26,26,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    {closedPlans.map((plan, index) => (
                      <motion.div
                        key={plan.id}
                        whileHover={{ backgroundColor: "rgba(139,26,26,0.03)" }}
                        onClick={() => navigate(`/plan-details/${plan.id}`, { state: { plan, readOnly: true, backTo: currentRoute } })}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px 18px",
                          borderBottom: index < closedPlans.length - 1 ? "1px solid rgba(139,26,26,0.07)" : "none",
                          cursor: "pointer",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#3B0000", marginBottom: 2 }}>
                            {plan.plan_name}
                          </div>
                          <div style={{ fontSize: "0.58rem", color: "#999" }}>
                            Rs {Number(plan.amount_per_inst || 0).toLocaleString("en-IN")} · {plan.duration} months
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "3px 10px",
                            borderRadius: 10,
                            background: "rgba(192,57,43,0.1)",
                            border: "1px solid rgba(192,57,43,0.25)",
                          }}
                        >
                          <span style={{ fontSize: "0.52rem", fontWeight: 700, color: "#C0392B", letterSpacing: "0.1em" }}>
                            {(plan.status || "closed").toUpperCase()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </Container>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
