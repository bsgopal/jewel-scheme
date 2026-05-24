import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Snackbar, Alert, CircularProgress } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VerifiedIcon from "@mui/icons-material/Verified";
import SecurityIcon from "@mui/icons-material/Security";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import DiamondIcon from "@mui/icons-material/Diamond";
import { motion } from "framer-motion";
import { getBackTarget, getCurrentRoute } from "../../utils/navigation";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const indianStates = [
  "Andhra Pradesh", "Bihar", "Karnataka", "Kerala",
  "Maharashtra", "Tamilnadu", "Telangana", "Uttar Pradesh", "West Bengal",
];

// ── Reusable field styles ─────────────────────────────────────────────────────
const labelStyle = {
  fontSize: "0.62rem", fontWeight: 700, color: "#8B0000",
  letterSpacing: "0.08em", textTransform: "uppercase",
  marginBottom: 6, display: "block",
};
const inputBase = {
  width: "100%", padding: "13px 16px", borderRadius: 10,
  border: "1.5px solid rgba(139,26,26,0.2)", fontSize: "0.82rem",
  fontFamily: "'Montserrat', sans-serif", color: "#3B0000",
  background: "#FFFAF5", outline: "none", transition: "border-color 0.2s",
  boxSizing: "border-box",
};
const focusOn  = (e) => (e.target.style.borderColor = "#8B0000");
const focusOff = (e) => (e.target.style.borderColor = "rgba(139,26,26,0.2)");

const Field = ({ label, name, value, onChange, required, placeholder, type = "text", readOnly }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={labelStyle}>
      {label}{required && <span style={{ color: "#C0392B" }}> *</span>}
      {readOnly && (
        <span style={{
          marginLeft: 8, fontSize: "0.5rem", color: "#27AE60",
          background: "rgba(39,174,96,0.1)", padding: "1px 7px",
          borderRadius: 6, fontWeight: 700,
        }}>AUTO-FILLED</span>
      )}
    </label>
    <input
      type={type} name={name} value={value} onChange={onChange}
      required={required} placeholder={placeholder || label}
      readOnly={readOnly}
      style={{
        ...inputBase,
        background: readOnly ? "rgba(139,26,26,0.03)" : "#FFFAF5",
        color: readOnly ? "#666" : "#3B0000",
        cursor: readOnly ? "default" : "text",
      }}
      onFocus={readOnly ? undefined : focusOn}
      onBlur={readOnly ? undefined : focusOff}
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

const JoinNewPlan = () => {
  const { planId } = useParams();
  const location = useLocation();
  const navigate   = useNavigate();
  const currentRoute = getCurrentRoute(location);
  const backTarget = getBackTarget(location, "/newplan");

  const [userData,    setUserData]    = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading,   setIsLoading]   = useState(false);
  const [planLoading, setPlanLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);

  const [formData, setFormData] = useState({
    fullName: "", address: "", area: "", city: "",
    state: "Tamilnadu", pincode: "", panCard: "",
  });

  // which fields were auto-filled from profile
  const [autoFilled, setAutoFilled] = useState({
    fullName: false, address: false, area: false,
    city: false, state: false, pincode: false, panCard: false,
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });

  // ── 1. Fetch user profile from /api/auth/me and auto-fill ────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      setUserLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res   = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const u = res.data.data;
        setUserData(u);

        // Parse address object if it exists
        // Backend stores address as: { street, city, state, pincode, country }
        const addr = u.address || {};

        const filled = {
          fullName: u.name         || "",
          address:  addr.street    || "",
          area:     addr.area      || addr.street || "",
          city:     addr.city      || "",
          state:    addr.state     || "Tamilnadu",
          pincode:  addr.pincode   || addr.zip || "",
          panCard:  u.panNumber    || "",
        };

        setFormData(filled);

        // Mark which fields were actually auto-filled (non-empty from server)
        setAutoFilled({
          fullName: !!filled.fullName,
          address:  !!filled.address,
          area:     !!filled.area,
          city:     !!filled.city,
          state:    !!filled.state,
          pincode:  !!filled.pincode,
          panCard:  !!filled.panCard,
        });

      } catch (err) {
        // Error fetching profile
        // Fallback to localStorage
        const name   = localStorage.getItem("name")   || "";
        const mobile = localStorage.getItem("mobile") || "";
        const email  = localStorage.getItem("email")  || "";
        setUserData({ name, phone: mobile, email });
        setFormData((p) => ({ ...p, fullName: name }));
        setAutoFilled((p) => ({ ...p, fullName: !!name }));
      } finally {
        setUserLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // ── 2. Fetch plan details ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchPlan = async () => {
      if (!planId) return;
      setPlanLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/plan-catalog/${planId}`);
        const matched = res.data?.data;

        if (!matched) {
          setSnackbar({ open: true, message: "Plan not found.", severity: "error" });
          return;
        }

        setSelectedPlan({
          id: matched.id,
          plan_name: matched.plan_name || matched.name,
          plan_type: matched.plan_type || matched.type,
          inst_amount: matched.minAmount,
          amount_per_inst: matched.minAmount,
          duration: matched.totalInstallments,
          description: matched.description,
          benefits: matched.benefits,
          features: matched.features,
          popular: matched.popular,
        });
      } catch (err) {
        setSnackbar({ open: true, message: "Failed to load plan details.", severity: "error" });
      } finally {
        setPlanLoading(false);
      }
    };
    fetchPlan();
  }, [planId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    // once user edits, remove auto-fill badge
    setAutoFilled((p) => ({ ...p, [name]: false }));
  };

  const isFormValid = () =>
    formData.fullName && formData.address && formData.area &&
    formData.city && formData.state && formData.pincode;

  // ── 3. Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res   = await axios.post(
        `${API_BASE_URL}/api/schemes`,
        {
          planId: selectedPlan.id,
          schemeName:    selectedPlan.plan_name,
          monthlyAmount: selectedPlan.inst_amount,
          goldPurity:    "22K",
          autoDebit:     { enabled: false },
          notes: [
            formData.address, formData.area, formData.city,
            formData.state,   formData.pincode,
            formData.panCard ? `PAN: ${formData.panCard}` : "",
          ].filter(Boolean).join(", "),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.data.success) throw new Error(res.data.message || "Failed to join plan");

      setSnackbar({ open: true, message: `Joined ${selectedPlan.plan_name} successfully! 🎉`, severity: "success" });
      setTimeout(() => navigate(`/plan-details/${res.data.data._id}`, { state: { plan: res.data.data, backTo: currentRoute } }), 1200);
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || "Failed to join plan", severity: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const autoFilledCount = Object.values(autoFilled).filter(Boolean).length;

  return (
    <div style={{ minHeight: "100vh", background: "#FAF5F0", fontFamily: "'Montserrat', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "linear-gradient(135deg, #7B0000, #A50000)",
        height: 60, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 16px",
        borderBottom: "1.5px solid rgba(255,200,80,0.3)",
        boxShadow: "0 3px 16px rgba(100,0,0,0.35)",
      }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(backTarget)} style={{
          background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,200,80,0.3)",
          borderRadius: 10, padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center",
        }}>
          <ArrowBackIcon style={{ color: "#FFD700", fontSize: 20 }} />
        </motion.button>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#FFD700", fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
            {planLoading ? "Loading..." : selectedPlan?.plan_name || "Join Plan"}
          </div>
          <div style={{ fontSize: "0.42rem", color: "rgba(255,220,130,0.65)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Gold Savings Scheme
          </div>
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* ── Hero / Plan Banner ── */}
      <div style={{
        background: "linear-gradient(160deg, #4B0000 0%, #7B0000 50%, #A50000 100%)",
        padding: "28px 20px 36px", position: "relative", overflow: "hidden",
      }}>
        {[
          { w: 180, h: 180, top: -60, right: -40 },
          { w: 120, h: 120, top: 20,  left: -30  },
          { w: 80,  h: 80,  bottom: -20, right: 60 },
        ].map((c, i) => (
          <div key={i} style={{
            position: "absolute", width: c.w, height: c.h, borderRadius: "50%",
            border: "2px solid rgba(255,215,0,0.2)",
            top: c.top, right: c.right, bottom: c.bottom, left: c.left,
          }} />
        ))}

        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.3)",
            borderRadius: 30, padding: "5px 16px", marginBottom: 12,
          }}>
            <DiamondIcon style={{ color: "#FFD700", fontSize: 14 }} />
            <span style={{ fontSize: "0.58rem", color: "#FFD700", fontWeight: 700, letterSpacing: "0.15em" }}>
              TRUSTED SINCE 1956
            </span>
            <DiamondIcon style={{ color: "#FFD700", fontSize: 14 }} />
          </div>
        </div>

        {planLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
            <CircularProgress sx={{ color: "#FFD700" }} size={32} />
          </div>
        ) : selectedPlan && (
          <>
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              {selectedPlan.popular && (
                <div style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #FFD700, #FFA500)",
                  color: "#7B0000", fontSize: "0.52rem", fontWeight: 800,
                  padding: "3px 14px", borderRadius: 20, marginBottom: 8, letterSpacing: "0.1em",
                }}>★ MOST POPULAR</div>
              )}
              <div style={{
                fontSize: "1.6rem", fontWeight: 800, color: "#FFD700",
                fontFamily: "'Playfair Display', serif", textShadow: "0 2px 12px rgba(0,0,0,0.4)",
              }}>{selectedPlan.plan_name}</div>
              <div style={{
                fontSize: "0.68rem", color: "rgba(255,220,130,0.8)",
                marginTop: 6, lineHeight: 1.6, maxWidth: 320, margin: "8px auto 0",
              }}>{selectedPlan.description}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Monthly",     value: `₹${selectedPlan.inst_amount?.toLocaleString()}` },
                { label: "Duration",    value: `${selectedPlan.duration} Months` },
                { label: "Making Off",  value: `${selectedPlan.benefits?.makingChargeDiscount}%` },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,215,0,0.2)",
                  borderRadius: 12, padding: "12px 8px", textAlign: "center",
                }}>
                  <div style={{ fontSize: "0.52rem", color: "rgba(255,215,0,0.65)", letterSpacing: "0.1em", marginBottom: 4 }}>
                    {label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#FFD700", fontFamily: "'Playfair Display', serif" }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {selectedPlan.features?.length > 0 && (
              <div style={{
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,215,0,0.15)",
                borderRadius: 14, padding: "14px 16px",
              }}>
                <div style={{ fontSize: "0.55rem", color: "rgba(255,215,0,0.6)", letterSpacing: "0.15em", marginBottom: 10 }}>
                  PLAN FEATURES
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {selectedPlan.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <span style={{ color: "#FFD700", fontSize: "0.6rem", marginTop: 1 }}>✦</span>
                      <span style={{ fontSize: "0.62rem", color: "rgba(255,230,150,0.85)", lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Trust Badges ── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid rgba(139,26,26,0.08)",
        padding: "12px 20px", display: "flex", justifyContent: "space-around",
      }}>
        {[
          { icon: <VerifiedIcon style={{ fontSize: 16, color: "#8B0000" }} />, text: "BIS Certified" },
          { icon: <SecurityIcon style={{ fontSize: 16, color: "#8B0000" }} />, text: "Secure & Safe" },
          { icon: <EmojiEventsIcon style={{ fontSize: 16, color: "#8B0000" }} />, text: "65+ Years Trust" },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            {icon}
            <span style={{ fontSize: "0.52rem", fontWeight: 700, color: "#8B0000" }}>{text}</span>
          </div>
        ))}
      </div>

      {/* ── Member Card ── */}
      <div style={{ padding: "16px 16px 0" }}>
        {userLoading ? (
          <div style={{
            background: "#fff", borderRadius: 14, padding: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(139,26,26,0.1)",
          }}>
            <CircularProgress size={20} sx={{ color: "#8B0000" }} />
            <span style={{ marginLeft: 10, fontSize: "0.72rem", color: "#999" }}>Loading your profile...</span>
          </div>
        ) : (
          <div style={{
            background: "#fff", border: "1px solid rgba(139,26,26,0.1)",
            borderRadius: 14, padding: "14px 18px",
            display: "flex", alignItems: "center", gap: 14,
            boxShadow: "0 2px 12px rgba(139,26,26,0.06)",
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: "50%",
              background: "linear-gradient(135deg, #7B0000, #C0392B)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: "1.1rem", color: "#FFD700", fontWeight: 800 }}>
                {userData?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#3B0000" }}>
                {userData?.name || "Member"}
              </div>
              <div style={{ fontSize: "0.6rem", color: "#999", marginTop: 2 }}>
                {userData?.phone} · {userData?.email}
              </div>
              {/* Auto-fill notice */}
              {autoFilledCount > 0 && (
                <div style={{
                  marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5,
                  background: "rgba(39,174,96,0.08)", border: "1px solid rgba(39,174,96,0.25)",
                  borderRadius: 8, padding: "3px 10px",
                }}>
                  <VerifiedIcon style={{ fontSize: 11, color: "#27AE60" }} />
                  <span style={{ fontSize: "0.52rem", color: "#27AE60", fontWeight: 700 }}>
                    {autoFilledCount} field{autoFilledCount > 1 ? "s" : ""} auto-filled from your profile
                  </span>
                </div>
              )}
            </div>
            <div style={{
              background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.3)",
              borderRadius: 8, padding: "3px 10px", flexShrink: 0,
            }}>
              <span style={{ fontSize: "0.52rem", fontWeight: 700, color: "#27AE60" }}>VERIFIED</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Form ── */}
      <div style={{ padding: "16px 16px 40px" }}>
        <div style={{
          background: "#fff", border: "1px solid rgba(139,26,26,0.1)",
          borderRadius: 18, overflow: "hidden",
          boxShadow: "0 4px 20px rgba(139,26,26,0.07)",
        }}>
          {/* Form header */}
          <div style={{
            background: "linear-gradient(90deg, rgba(139,26,26,0.05), rgba(139,26,26,0.02))",
            borderBottom: "1px solid rgba(139,26,26,0.08)",
            padding: "16px 20px", display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #7B0000, #C0392B)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#FFD700", fontSize: "0.85rem" }}>📋</span>
            </div>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#3B0000", fontFamily: "'Playfair Display', serif" }}>
                Personal Details
              </div>
              <div style={{ fontSize: "0.58rem", color: "#999" }}>
                {autoFilledCount > 0
                  ? `${autoFilledCount} fields pre-filled — review and confirm`
                  : "All fields marked * are required"}
              </div>
            </div>
          </div>

          <div style={{ padding: "20px" }}>
            <form onSubmit={handleSubmit}>

              <Field
                label="Full Name" name="fullName"
                value={formData.fullName} onChange={handleChange}
                required readOnly={autoFilled.fullName}
              />
              <Field
                label="Address" name="address"
                value={formData.address} onChange={handleChange}
                required placeholder="Door No, Street Name"
                readOnly={autoFilled.address}
              />
              <Field
                label="Area / Locality" name="area"
                value={formData.area} onChange={handleChange}
                required readOnly={autoFilled.area}
              />

              {/* City + State */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                <div>
                  <label style={labelStyle}>
                    City <span style={{ color: "#C0392B" }}>*</span>
                    {autoFilled.city && (
                      <span style={{
                        marginLeft: 6, fontSize: "0.5rem", color: "#27AE60",
                        background: "rgba(39,174,96,0.1)", padding: "1px 6px", borderRadius: 6,
                      }}>AUTO</span>
                    )}
                  </label>
                  <input
                    name="city" value={formData.city}
                    onChange={handleChange} required placeholder="City"
                    readOnly={autoFilled.city}
                    style={{
                      ...inputBase,
                      background: autoFilled.city ? "rgba(139,26,26,0.03)" : "#FFFAF5",
                      color: autoFilled.city ? "#666" : "#3B0000",
                    }}
                    onFocus={autoFilled.city ? undefined : focusOn}
                    onBlur={autoFilled.city ? undefined : focusOff}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    State <span style={{ color: "#C0392B" }}>*</span>
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, state: e.target.value }));
                      setAutoFilled((p) => ({ ...p, state: false }));
                    }}
                    style={{ ...inputBase, cursor: "pointer" }}
                  >
                    {indianStates.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pincode + PAN */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                <div>
                  <label style={labelStyle}>
                    Pincode <span style={{ color: "#C0392B" }}>*</span>
                    {autoFilled.pincode && (
                      <span style={{
                        marginLeft: 6, fontSize: "0.5rem", color: "#27AE60",
                        background: "rgba(39,174,96,0.1)", padding: "1px 6px", borderRadius: 6,
                      }}>AUTO</span>
                    )}
                  </label>
                  <input
                    name="pincode" value={formData.pincode}
                    onChange={handleChange} required
                    placeholder="6-digit Pincode" maxLength={6}
                    readOnly={autoFilled.pincode}
                    style={{
                      ...inputBase,
                      background: autoFilled.pincode ? "rgba(139,26,26,0.03)" : "#FFFAF5",
                      color: autoFilled.pincode ? "#666" : "#3B0000",
                    }}
                    onFocus={autoFilled.pincode ? undefined : focusOn}
                    onBlur={autoFilled.pincode ? undefined : focusOff}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    PAN Card
                    {autoFilled.panCard && (
                      <span style={{
                        marginLeft: 6, fontSize: "0.5rem", color: "#27AE60",
                        background: "rgba(39,174,96,0.1)", padding: "1px 6px", borderRadius: 6,
                      }}>AUTO</span>
                    )}
                  </label>
                  <input
                    name="panCard" value={formData.panCard}
                    onChange={handleChange} placeholder="Optional"
                    readOnly={autoFilled.panCard}
                    style={{
                      ...inputBase,
                      background: autoFilled.panCard ? "rgba(139,26,26,0.03)" : "#FFFAF5",
                      color: autoFilled.panCard ? "#666" : "#3B0000",
                    }}
                    onFocus={autoFilled.panCard ? undefined : focusOn}
                    onBlur={autoFilled.panCard ? undefined : focusOff}
                  />
                </div>
              </div>

              {/* Edit profile nudge if all auto-filled */}
              {autoFilledCount >= 5 && (
                <div style={{
                  background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.25)",
                  borderRadius: 10, padding: "10px 14px", marginBottom: 18,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: "1rem" }}>✨</span>
                  <div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#7B0000" }}>
                      Details loaded from your profile
                    </div>
                    <div style={{ fontSize: "0.58rem", color: "#999", marginTop: 2 }}>
                      Click any field to edit before confirming
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              {selectedPlan && (
                <div style={{
                  background: "linear-gradient(135deg, rgba(123,0,0,0.04), rgba(123,0,0,0.02))",
                  border: "1.5px solid rgba(139,26,26,0.15)",
                  borderRadius: 12, padding: "14px 16px", marginBottom: 20,
                }}>
                  <div style={{ fontSize: "0.6rem", color: "#8B0000", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>
                    ORDER SUMMARY
                  </div>
                  {[
                    ["Plan",                   selectedPlan.plan_name],
                    ["Monthly Installment",    `₹${selectedPlan.inst_amount?.toLocaleString()}`],
                    ["Duration",               `${selectedPlan.duration} Months`],
                    ["Making Charge Discount", `${selectedPlan.benefits?.makingChargeDiscount}%`],
                    ["Total Payable",          `₹${(selectedPlan.inst_amount * selectedPlan.duration)?.toLocaleString()}`],
                  ].map(([k, v], i, arr) => (
                    <div key={k} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "5px 0",
                      borderBottom: i < arr.length - 1 ? "1px solid rgba(139,26,26,0.06)" : "none",
                    }}>
                      <span style={{ fontSize: "0.62rem", color: "#999" }}>{k}</span>
                      <span style={{
                        fontSize: i === arr.length - 1 ? "0.75rem" : "0.65rem",
                        fontWeight: i === arr.length - 1 ? 800 : 600,
                        color: i === arr.length - 1 ? "#8B0000" : "#3B0000",
                      }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading || !isFormValid() || planLoading || !selectedPlan}
                whileTap={{ scale: isLoading ? 1 : 0.97 }}
                style={{
                  width: "100%", height: 52, borderRadius: 14, border: "none",
                  background: isLoading || !isFormValid()
                    ? "rgba(139,26,26,0.4)"
                    : "linear-gradient(135deg, #7B0000, #C0392B)",
                  color: "#FFD700", fontWeight: 800, fontSize: "0.82rem",
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  cursor: isLoading || !isFormValid() ? "not-allowed" : "pointer",
                  fontFamily: "'Montserrat', sans-serif",
                  boxShadow: isLoading || !isFormValid() ? "none" : "0 6px 20px rgba(139,26,26,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s",
                }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={18} sx={{ color: "#FFD700" }} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>✦</span>
                    <span>Confirm & Join — ₹{selectedPlan?.inst_amount?.toLocaleString()}/mo</span>
                    <span>✦</span>
                  </>
                )}
              </motion.button>

              <p style={{ fontSize: "0.55rem", color: "#BBB", textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
                By joining, you agree to our terms & conditions.
                Your data is secured with 256-bit encryption.
              </p>
            </form>
          </div>
        </div>
      </div>

      <Snackbar
        open={snackbar.open} autoHideDuration={6000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          sx={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.78rem" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default JoinNewPlan;
