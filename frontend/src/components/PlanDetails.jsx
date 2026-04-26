import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Snackbar, Alert, CircularProgress } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PaymentIcon from "@mui/icons-material/Payment";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import DiamondIcon from "@mui/icons-material/Diamond";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { motion, AnimatePresence } from "framer-motion";
import { getBackTarget } from "../utils/navigation";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PlanDetails = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const backTarget   = getBackTarget(location, "/my-plans");

  const [scheme,           setScheme]           = useState(location.state?.plan || null);
  const [payments,         setPayments]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [showInstallments, setShowInstallments] = useState(false);
  const [snackbar,         setSnackbar]         = useState({ open: false, message: "", severity: "info" });

  // ── Fetch scheme details + payment history from /api/schemes/:id ──────────
  useEffect(() => {
    const fetchScheme = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res   = await axios.get(`${API_BASE_URL}/api/schemes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data.data;
        setScheme(data);
        setPayments(data.payments || data.installmentHistory || []);
      } catch (err) {
        console.error("Error fetching scheme details:", err);
        setSnackbar({ open: true, message: "Failed to load plan details", severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchScheme();
  }, [id]);

  const handlePayNow = () => {
    navigate(`/plans/payment/${id}`, {
      state: { plan: scheme, type: "installment", membership_id: id },
    });
  };

  // Derived values
  const planName        = scheme?.schemeName       || scheme?.plan_name    || "Gold Plan";
  const monthlyAmount   = scheme?.monthlyAmount    || scheme?.inst_amount  || 0;
  const duration        = scheme?.totalInstallments || scheme?.duration    || 0;
  const paidCount       = scheme?.paidInstallments  || 0;
  const goldWeight      = scheme?.totalGoldWeight   || 0;
  const totalPaid       = scheme?.totalAmountPaid   || 0;
  const status          = scheme?.status            || "active";
  const nextDueDate     = scheme?.nextDueDate
    ? new Date(scheme.nextDueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const progress        = duration > 0 ? Math.round((paidCount / duration) * 100) : 0;
  const isActive        = status === "active";
  const isMatured       = status === "matured";
  const currentValue    = scheme?.currentValue      || 0;
  const profit          = scheme?.profit            || 0;
  const profitPct       = scheme?.profitPercentage  || 0;

  const statusColor = {
    active:    { bg: "rgba(46,204,113,0.15)",  border: "rgba(46,204,113,0.4)",  text: "#27AE60" },
    matured:   { bg: "rgba(230,126,34,0.15)",  border: "rgba(230,126,34,0.4)",  text: "#E67E22" },
    redeemed:  { bg: "rgba(52,152,219,0.15)",  border: "rgba(52,152,219,0.4)",  text: "#3498DB" },
    cancelled: { bg: "rgba(231,76,60,0.15)",   border: "rgba(231,76,60,0.4)",   text: "#E74C3C" },
  }[status] || { bg: "rgba(46,204,113,0.15)", border: "rgba(46,204,113,0.4)", text: "#27AE60" };

  if (loading) return (
    <div style={{
      minHeight: "100vh", background: "#FAF5F0",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <CircularProgress sx={{ color: "#8B0000" }} size={40} />
        <div style={{ marginTop: 12, fontSize: "0.75rem", color: "#8B0000", fontWeight: 600 }}>
          Loading plan details...
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: "#FAF5F0",
      fontFamily: "'Montserrat', sans-serif",
      paddingBottom: 40,
    }}>

      {/* ── Sticky Header ── */}
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
          borderRadius: 10, padding: "6px 8px", cursor: "pointer",
          display: "flex", alignItems: "center",
        }}>
          <ArrowBackIcon style={{ color: "#FFD700", fontSize: 20 }} />
        </motion.button>

        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: "1rem", fontWeight: 800, color: "#FFD700",
            fontFamily: "'Playfair Display', serif", lineHeight: 1,
          }}>Plan Details</div>
          <div style={{
            fontSize: "0.42rem", color: "rgba(255,220,130,0.65)",
            letterSpacing: "0.2em", textTransform: "uppercase",
          }}>Gold Savings Portfolio</div>
        </div>

        {/* Status badge */}
        <div style={{
          background: statusColor.bg, border: `1px solid ${statusColor.border}`,
          borderRadius: 8, padding: "4px 10px",
        }}>
          <span style={{ fontSize: "0.52rem", fontWeight: 800, color: statusColor.text, letterSpacing: "0.08em" }}>
            {status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* ── Hero Banner ── */}
      <div style={{
        background: "linear-gradient(160deg, #4B0000 0%, #7B0000 55%, #A50000 100%)",
        padding: "24px 20px 30px", position: "relative", overflow: "hidden",
      }}>
        {[
          { w: 200, h: 200, top: -70, right: -50 },
          { w: 130, h: 130, top: 30, left: -40 },
        ].map((c, i) => (
          <div key={i} style={{
            position: "absolute", width: c.w, height: c.h, borderRadius: "50%",
            border: "2px solid rgba(255,215,0,0.15)",
            top: c.top, right: c.right, left: c.left,
          }} />
        ))}

        {/* Plan name */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.25)",
            borderRadius: 20, padding: "3px 12px", marginBottom: 10,
          }}>
            <DiamondIcon style={{ color: "#FFD700", fontSize: 11 }} />
            <span style={{ fontSize: "0.52rem", color: "#FFD700", fontWeight: 700, letterSpacing: "0.12em" }}>
              GOLD SAVINGS SCHEME
            </span>
          </div>
          <div style={{
            fontSize: "1.5rem", fontWeight: 800, color: "#FFD700",
            fontFamily: "'Playfair Display', serif",
            textShadow: "0 2px 12px rgba(0,0,0,0.4)",
          }}>{planName}</div>
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
          {[
            { label: "Monthly",    value: `₹${monthlyAmount?.toLocaleString()}` },
            { label: "Duration",   value: `${duration} Months` },
            { label: "Gold (gm)",  value: `${goldWeight?.toFixed(3)}g` },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,215,0,0.2)",
              borderRadius: 12, padding: "12px 8px", textAlign: "center",
            }}>
              <div style={{ fontSize: "0.5rem", color: "rgba(255,215,0,0.6)", letterSpacing: "0.1em", marginBottom: 4 }}>
                {label.toUpperCase()}
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#FFD700", fontFamily: "'Playfair Display', serif" }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,215,0,0.15)",
          borderRadius: 14, padding: "14px 16px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "0.6rem", color: "rgba(255,215,0,0.7)", fontWeight: 700 }}>
              INSTALLMENT PROGRESS
            </span>
            <span style={{ fontSize: "0.6rem", color: "#FFD700", fontWeight: 800 }}>
              {paidCount}/{duration} paid · {progress}%
            </span>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.15)", borderRadius: 10 }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{
                height: "100%", borderRadius: 10,
                background: "linear-gradient(90deg, #FFD700, #FFA500)",
                boxShadow: "0 0 8px rgba(255,215,0,0.5)",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: "0.52rem", color: "rgba(255,215,0,0.5)" }}>Started</span>
            <span style={{ fontSize: "0.52rem", color: "rgba(255,215,0,0.5)" }}>Maturity</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>

        {/* ── Investment Summary Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[
            {
              icon: <CurrencyRupeeIcon style={{ fontSize: 18, color: "#8B0000" }} />,
              label: "Total Invested",
              value: `₹${totalPaid?.toLocaleString()}`,
              sub: `${paidCount} installments`,
            },
            {
              icon: <EmojiEventsIcon style={{ fontSize: 18, color: "#8B0000" }} />,
              label: "Current Value",
              value: `₹${currentValue?.toLocaleString()}`,
              sub: profit >= 0
                ? `+₹${profit?.toLocaleString()} (${profitPct}%)`
                : `-₹${Math.abs(profit)?.toLocaleString()} (${profitPct}%)`,
              subColor: profit >= 0 ? "#27AE60" : "#E74C3C",
            },
          ].map(({ icon, label, value, sub, subColor }) => (
            <div key={label} style={{
              background: "#fff", border: "1px solid rgba(139,26,26,0.1)",
              borderRadius: 14, padding: "14px 16px",
              boxShadow: "0 2px 12px rgba(139,26,26,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {icon}
                <span style={{ fontSize: "0.6rem", color: "#999", fontWeight: 600 }}>{label}</span>
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#3B0000", fontFamily: "'Playfair Display', serif" }}>
                {value}
              </div>
              {sub && (
                <div style={{ fontSize: "0.58rem", color: subColor || "#999", marginTop: 3, fontWeight: 600 }}>
                  {sub}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Plan Info Card ── */}
        <div style={{
          background: "#fff", border: "1px solid rgba(139,26,26,0.1)",
          borderRadius: 16, overflow: "hidden",
          boxShadow: "0 2px 12px rgba(139,26,26,0.06)", marginBottom: 16,
        }}>
          <div style={{
            background: "linear-gradient(90deg, rgba(139,26,26,0.05), rgba(139,26,26,0.02))",
            borderBottom: "1px solid rgba(139,26,26,0.08)",
            padding: "12px 18px", display: "flex", alignItems: "center", gap: 8,
          }}>
            <DiamondIcon style={{ fontSize: 16, color: "#8B0000" }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#3B0000", fontFamily: "'Playfair Display', serif" }}>
              Scheme Information
            </span>
          </div>
          <div style={{ padding: "14px 18px" }}>
            {[
              ["Scheme Name",       planName],
              ["Monthly Amount",    `₹${monthlyAmount?.toLocaleString()}`],
              ["Gold Purity",       scheme?.goldPurity || "22K"],
              ["Total Installments",`${duration} months`],
              ["Next Due Date",     isActive ? nextDueDate : "—"],
              ["Gold Accumulated",  `${goldWeight?.toFixed(4)} grams`],
              ["Bonus Gold",        `${(scheme?.bonusGoldWeight || 0).toFixed(4)} grams`],
            ].map(([k, v], i, arr) => (
              <div key={k} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0",
                borderBottom: i < arr.length - 1 ? "1px solid rgba(139,26,26,0.06)" : "none",
              }}>
                <span style={{ fontSize: "0.62rem", color: "#AAA" }}>{k}</span>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#3B0000" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Pay Now ── */}
        {isActive && paidCount < duration && (
          <div style={{
            background: "#fff", border: "1px solid rgba(139,26,26,0.1)",
            borderRadius: 16, padding: "18px",
            boxShadow: "0 2px 12px rgba(139,26,26,0.06)", marginBottom: 16,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: "0.62rem", color: "#999", marginBottom: 4 }}>NEXT INSTALLMENT</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#3B0000", fontFamily: "'Playfair Display', serif" }}>
                  ₹{monthlyAmount?.toLocaleString()}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                  <CalendarMonthIcon style={{ fontSize: 13, color: "#8B0000" }} />
                  <span style={{ fontSize: "0.6rem", color: "#8B0000", fontWeight: 600 }}>Due: {nextDueDate}</span>
                </div>
              </div>
              <div style={{
                background: "rgba(139,26,26,0.06)", border: "1px solid rgba(139,26,26,0.15)",
                borderRadius: 10, padding: "8px 14px", textAlign: "center",
              }}>
                <div style={{ fontSize: "0.52rem", color: "#999" }}>Remaining</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#8B0000" }}>
                  {duration - paidCount}
                </div>
                <div style={{ fontSize: "0.5rem", color: "#999" }}>months</div>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }}
              onClick={handlePayNow}
              style={{
                width: "100%", height: 50, borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #7B0000, #C0392B)",
                color: "#FFD700", fontWeight: 800, fontSize: "0.82rem",
                letterSpacing: "0.1em", textTransform: "uppercase",
                cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
                boxShadow: "0 6px 20px rgba(139,26,26,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <PaymentIcon style={{ fontSize: 18 }} />
              Pay ₹{monthlyAmount?.toLocaleString()} Now
            </motion.button>
          </div>
        )}

        {/* Matured banner */}
        {isMatured && (
          <div style={{
            background: "linear-gradient(135deg, rgba(230,126,34,0.1), rgba(230,126,34,0.05))",
            border: "1.5px solid rgba(230,126,34,0.3)",
            borderRadius: 16, padding: "18px", marginBottom: 16, textAlign: "center",
          }}>
            <EmojiEventsIcon style={{ fontSize: 36, color: "#E67E22", marginBottom: 8 }} />
            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#E67E22", fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
              🎉 Scheme Matured!
            </div>
            <div style={{ fontSize: "0.65rem", color: "#999", marginBottom: 14 }}>
              Congratulations! All installments paid. Visit your nearest store to redeem.
            </div>
            <div style={{
              background: "rgba(230,126,34,0.1)", border: "1px solid rgba(230,126,34,0.25)",
              borderRadius: 10, padding: "10px 16px", display: "inline-block",
            }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#E67E22" }}>
                Total Gold: {goldWeight?.toFixed(4)} grams · Value: ₹{currentValue?.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* ── Payment History Toggle ── */}
        <div style={{ marginBottom: 16 }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowInstallments((p) => !p)}
            style={{
              width: "100%", height: 48, borderRadius: 12,
              border: "1.5px solid rgba(139,26,26,0.2)",
              background: showInstallments
                ? "linear-gradient(135deg, #7B0000, #C0392B)"
                : "#fff",
              color: showInstallments ? "#FFD700" : "#8B0000",
              fontWeight: 700, fontSize: "0.75rem",
              letterSpacing: "0.08em", textTransform: "uppercase",
              cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}
          >
            <ReceiptLongIcon style={{ fontSize: 18 }} />
            {showInstallments ? "Hide Payment History" : "View Payment History"}
          </motion.button>
        </div>

        {/* ── Payment History List ── */}
        <AnimatePresence>
          {showInstallments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {payments.length === 0 ? (
                <div style={{
                  background: "#fff", border: "1px solid rgba(139,26,26,0.1)",
                  borderRadius: 14, padding: "30px 20px", textAlign: "center",
                  boxShadow: "0 2px 12px rgba(139,26,26,0.06)",
                }}>
                  <ReceiptLongIcon style={{ fontSize: 32, color: "rgba(139,26,26,0.2)", marginBottom: 8 }} />
                  <div style={{ fontSize: "0.75rem", color: "#999" }}>No payment history yet</div>
                </div>
              ) : (
                <div style={{
                  background: "#fff", border: "1px solid rgba(139,26,26,0.1)",
                  borderRadius: 16, overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(139,26,26,0.06)",
                }}>
                  {/* Header row */}
                  <div style={{
                    background: "linear-gradient(90deg, rgba(139,26,26,0.06), rgba(139,26,26,0.02))",
                    borderBottom: "1px solid rgba(139,26,26,0.08)",
                    padding: "10px 18px",
                    display: "grid", gridTemplateColumns: "40px 1fr 1fr 80px",
                    gap: 8,
                  }}>
                    {["#", "Date", "Amount", "Status"].map((h) => (
                      <span key={h} style={{ fontSize: "0.55rem", color: "#8B0000", fontWeight: 700, letterSpacing: "0.08em" }}>
                        {h}
                      </span>
                    ))}
                  </div>

                  {payments.map((p, idx) => {
                    const isPaid   = p.status === "completed" || p.status === "paid";
                    const dateVal  = p.paymentDate || p.paid_date || p.due_date;
                    const amount   = p.amount || monthlyAmount;
                    const instNum  = p.installmentNumber || p.installment_no || idx + 1;

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        style={{
                          padding: "12px 18px",
                          borderBottom: idx < payments.length - 1 ? "1px solid rgba(139,26,26,0.06)" : "none",
                          display: "grid", gridTemplateColumns: "40px 1fr 1fr 80px",
                          gap: 8, alignItems: "center",
                        }}
                      >
                        {/* Installment # */}
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: isPaid
                            ? "linear-gradient(135deg, #7B0000, #C0392B)"
                            : "rgba(139,26,26,0.08)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {isPaid
                            ? <CheckCircleIcon style={{ fontSize: 14, color: "#FFD700" }} />
                            : <AccessTimeIcon  style={{ fontSize: 14, color: "#8B0000" }} />
                          }
                        </div>

                        {/* Date */}
                        <div>
                          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#3B0000" }}>
                            #{instNum}
                          </div>
                          <div style={{ fontSize: "0.58rem", color: "#999" }}>
                            {dateVal
                              ? new Date(dateVal).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                              : "—"
                            }
                          </div>
                        </div>

                        {/* Amount */}
                        <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#3B0000" }}>
                          ₹{amount?.toLocaleString()}
                          {p.goldWeight && (
                            <div style={{ fontSize: "0.55rem", color: "#999", fontWeight: 500 }}>
                              {p.goldWeight?.toFixed(4)}g gold
                            </div>
                          )}
                        </div>

                        {/* Status badge */}
                        <div style={{
                          background: isPaid ? "rgba(39,174,96,0.1)" : "rgba(230,126,34,0.1)",
                          border: `1px solid ${isPaid ? "rgba(39,174,96,0.3)" : "rgba(230,126,34,0.3)"}`,
                          borderRadius: 8, padding: "3px 8px", textAlign: "center",
                        }}>
                          <span style={{
                            fontSize: "0.5rem", fontWeight: 700,
                            color: isPaid ? "#27AE60" : "#E67E22",
                            letterSpacing: "0.05em",
                          }}>
                            {isPaid ? "PAID" : "PENDING"}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Snackbar
        open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.78rem" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default PlanDetails;
