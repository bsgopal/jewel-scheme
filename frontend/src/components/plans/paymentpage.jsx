import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { CircularProgress, Snackbar, Alert } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import { motion, AnimatePresence } from "framer-motion";

const paymentOptions = [
  { value: "Cash",        label: "Cash",         icon: "💵", desc: "Pay at store counter" },
  { value: "UPI",         label: "UPI",          icon: "📱", desc: "PhonePe, GPay, Paytm" },
  { value: "NetBanking",  label: "Net Banking",  icon: "🏦", desc: "All major banks" },
  { value: "BankTransfer",label: "Bank Transfer", icon: "🔄", desc: "NEFT / RTGS / IMPS" },
];

export default function PaymentPage() {
  const location = useLocation();
  const navigate  = useNavigate();

  const [selectedMethod, setSelectedMethod] = useState("Cash");
  const [confirmOpen,    setConfirmOpen]    = useState(false);
  const [isLoading,      setIsLoading]      = useState(false);
  const [paid,           setPaid]           = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const { type, plan } = location.state || {};
  const schemeId = plan?._id || plan?.id;
  const amount   = useMemo(() => Number(plan?.monthlyAmount || plan?.amount_per_inst || plan?.inst_amount || 0), [plan]);
  const planTitle = plan?.schemeName || plan?.plan_name || "Gold Savings Plan";
  const paidCount = plan?.paidInstallments || 0;
  const totalCount = plan?.totalInstallments || plan?.duration || 0;
  const progress = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const handlePayment = async () => {
    if (!schemeId || !amount) {
      setSnackbar({ open: true, message: "Plan details are missing.", severity: "error" });
      return;
    }
    setIsLoading(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/schemes/${schemeId}/pay`,
        { amount, paymentMethod: selectedMethod },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setPaid(true);
      setTimeout(() => navigate(`/plan-details/${schemeId}`), 2200);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Payment failed. Please try again.",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
      setConfirmOpen(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (paid) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg, #4B0000 0%, #7B0000 60%, #A50000 100%)",
        fontFamily: "'Montserrat', sans-serif",
      }}>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          style={{ textAlign: "center", padding: "40px 30px" }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <CheckCircleIcon style={{ fontSize: 80, color: "#FFD700" }} />
          </motion.div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#FFD700", fontFamily: "'Playfair Display', serif", marginTop: 20 }}>
            Payment Recorded!
          </div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,220,130,0.75)", marginTop: 10, lineHeight: 1.7 }}>
            {fmt(amount)} paid via {selectedMethod}<br />Redirecting to your plan…
          </div>
          <motion.div
            style={{ width: 0, height: 2, background: "#FFD700", marginTop: 28, borderRadius: 2 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "linear" }}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FAF5F0",
      fontFamily: "'Montserrat', sans-serif",
      paddingBottom: 40,
    }}>

      {/* ── Header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "linear-gradient(135deg, #7B0000, #A50000)",
        height: 60, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 16px",
        borderBottom: "1.5px solid rgba(255,200,80,0.3)",
        boxShadow: "0 3px 16px rgba(100,0,0,0.35)",
      }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          style={{
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,200,80,0.3)",
            borderRadius: 10, padding: "6px 8px", cursor: "pointer",
            display: "flex", alignItems: "center",
          }}
        >
          <ArrowBackIcon style={{ color: "#FFD700", fontSize: 20 }} />
        </motion.button>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#FFD700", fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
            {type === "join" ? "Join Plan Payment" : "Pay Installment"}
          </div>
          <div style={{ fontSize: "0.42rem", color: "rgba(255,220,130,0.65)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
            Secure Transaction
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,200,80,0.2)",
          borderRadius: 8, padding: "4px 10px",
        }}>
          <LockIcon style={{ color: "#FFD700", fontSize: 12 }} />
          <span style={{ color: "rgba(255,220,130,0.8)", fontSize: "0.5rem", fontWeight: 700 }}>SSL</span>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px" }}>

        {/* ── Plan Summary Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "linear-gradient(135deg, #7B0000 0%, #A50000 100%)",
            borderRadius: 22, overflow: "hidden", marginBottom: 18,
            boxShadow: "0 12px 36px rgba(100,0,0,0.28)",
            position: "relative",
          }}
        >
          {/* Decorative circles */}
          {[
            { w: 160, h: 160, top: -60, right: -40, op: 0.08 },
            { w: 100, h: 100, bottom: -30, left: -20, op: 0.06 },
          ].map((c, i) => (
            <div key={i} style={{
              position: "absolute", width: c.w, height: c.h, borderRadius: "50%",
              border: "2px solid rgba(255,215,0,0.3)",
              top: c.top, right: c.right, bottom: c.bottom, left: c.left,
              background: `rgba(255,215,0,${c.op})`,
            }} />
          ))}

          <div style={{ padding: "22px 22px 18px", position: "relative" }}>
            <div style={{ fontSize: "0.5rem", color: "rgba(255,215,0,0.6)", letterSpacing: "0.22em", marginBottom: 6 }}>
              GOLD SAVINGS SCHEME
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#FFD700", fontFamily: "'Playfair Display', serif", marginBottom: 16, lineHeight: 1.2 }}>
              {planTitle}
            </div>

            {/* Progress */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "0.58rem", color: "rgba(255,220,130,0.7)" }}>
                  {paidCount} of {totalCount} installments paid
                </span>
                <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#FFD700" }}>{progress}%</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.12)", borderRadius: 10 }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  style={{ height: "100%", borderRadius: 10, background: "linear-gradient(90deg, #FFD700, #FFA500)" }}
                />
              </div>
            </div>

            {/* Amount pill */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <div style={{
                background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.3)",
                borderRadius: 12, padding: "10px 18px", display: "inline-flex",
                flexDirection: "column", alignItems: "center",
              }}>
                <span style={{ fontSize: "0.5rem", color: "rgba(255,215,0,0.6)", letterSpacing: "0.15em" }}>AMOUNT DUE</span>
                <span style={{ fontSize: "1.6rem", fontWeight: 900, color: "#FFD700", fontFamily: "'Playfair Display', serif", lineHeight: 1.1 }}>
                  {fmt(amount)}
                </span>
              </div>
              <div style={{ paddingLeft: 12 }}>
                <div style={{ fontSize: "0.58rem", color: "rgba(255,220,130,0.6)", marginBottom: 4 }}>
                  Installment #{paidCount + 1}
                </div>
                <div style={{ fontSize: "0.58rem", color: "rgba(255,220,130,0.6)" }}>
                  {totalCount - paidCount} remaining
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Payment Method ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: "#fff", borderRadius: 20, overflow: "hidden",
            border: "1px solid rgba(139,26,26,0.1)",
            boxShadow: "0 6px 24px rgba(139,26,26,0.07)",
            marginBottom: 18,
          }}
        >
          {/* Section header */}
          <div style={{
            background: "linear-gradient(90deg, rgba(139,26,26,0.05), rgba(139,26,26,0.01))",
            borderBottom: "1px solid rgba(139,26,26,0.08)",
            padding: "16px 20px", display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #7B0000, #C0392B)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: "0.9rem" }}>💳</span>
            </div>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#3B0000", fontFamily: "'Playfair Display', serif" }}>
                Payment Method
              </div>
              <div style={{ fontSize: "0.58rem", color: "#999" }}>Choose how you'd like to pay</div>
            </div>
          </div>

          <div style={{ padding: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {paymentOptions.map((opt, i) => {
                const isSelected = selectedMethod === opt.value;
                return (
                  <motion.div
                    key={opt.value}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedMethod(opt.value)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 16px", borderRadius: 14, cursor: "pointer",
                      border: isSelected
                        ? "2px solid #8B0000"
                        : "1.5px solid rgba(139,26,26,0.1)",
                      background: isSelected
                        ? "linear-gradient(90deg, rgba(139,26,26,0.06), rgba(139,26,26,0.02))"
                        : "#FFFAF5",
                      transition: "all 0.18s ease",
                    }}
                  >
                    {/* Icon circle */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: isSelected ? "rgba(139,26,26,0.1)" : "rgba(139,26,26,0.04)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.3rem",
                      border: isSelected ? "1px solid rgba(139,26,26,0.2)" : "1px solid rgba(139,26,26,0.06)",
                      transition: "all 0.18s",
                    }}>
                      {opt.icon}
                    </div>

                    {/* Labels */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: isSelected ? "#7B0000" : "#3B0000" }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: "0.6rem", color: "#999", marginTop: 2 }}>{opt.desc}</div>
                    </div>

                    {/* Radio */}
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      border: isSelected ? "6px solid #8B0000" : "2px solid rgba(139,26,26,0.2)",
                      background: isSelected ? "#fff" : "transparent",
                      flexShrink: 0,
                      transition: "all 0.18s",
                    }} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── Order Summary ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: "#fff", borderRadius: 20,
            border: "1px solid rgba(139,26,26,0.1)",
            boxShadow: "0 4px 16px rgba(139,26,26,0.06)",
            marginBottom: 22, overflow: "hidden",
          }}
        >
          <div style={{
            background: "linear-gradient(90deg, rgba(139,26,26,0.05), rgba(139,26,26,0.01))",
            borderBottom: "1px solid rgba(139,26,26,0.08)",
            padding: "14px 20px",
          }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "#8B0000", letterSpacing: "0.15em" }}>
              ORDER SUMMARY
            </div>
          </div>

          <div style={{ padding: "16px 20px" }}>
            {[
              ["Plan Name",        planTitle],
              ["Installment No.",  `#${paidCount + 1} of ${totalCount}`],
              ["Payment Method",   paymentOptions.find(o => o.value === selectedMethod)?.label],
            ].map(([k, v], i) => (
              <div key={k} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid rgba(139,26,26,0.05)",
              }}>
                <span style={{ fontSize: "0.65rem", color: "#999" }}>{k}</span>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#3B0000" }}>{v}</span>
              </div>
            ))}

            {/* Total row */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginTop: 12, padding: "12px 14px", borderRadius: 12,
              background: "linear-gradient(90deg, rgba(139,26,26,0.06), rgba(139,26,26,0.02))",
              border: "1px solid rgba(139,26,26,0.1)",
            }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#8B0000" }}>Total Amount</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#7B0000", fontFamily: "'Playfair Display', serif" }}>
                {fmt(amount)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Pay Button ── */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: isLoading ? 1 : 0.97 }}
          whileHover={{ scale: isLoading ? 1 : 1.01 }}
          onClick={() => setConfirmOpen(true)}
          disabled={isLoading}
          style={{
            width: "100%", height: 54, borderRadius: 14, border: "none",
            background: "linear-gradient(135deg, #7B0000, #C0392B)",
            color: "#FFD700", fontWeight: 800, fontSize: "0.88rem",
            letterSpacing: "0.1em", textTransform: "uppercase",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontFamily: "'Montserrat', sans-serif",
            boxShadow: "0 8px 24px rgba(100,0,0,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}
        >
          <LockIcon style={{ fontSize: 16 }} />
          Pay {fmt(amount)} Securely
        </motion.button>

        <div style={{ textAlign: "center", marginTop: 12, fontSize: "0.55rem", color: "#BBB", lineHeight: 1.6 }}>
          🔒 256-bit SSL encrypted · Your data is safe with us
        </div>
      </div>

      {/* ── Confirm Dialog ── */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.55)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
              padding: "0 0 20px",
            }}
            onClick={() => !isLoading && setConfirmOpen(false)}
          >
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(480px, 94%)", background: "#fff",
                borderRadius: "24px 24px 16px 16px", overflow: "hidden",
                boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
              }}
            >
              {/* Dialog header */}
              <div style={{
                background: "linear-gradient(135deg, #7B0000, #A50000)",
                padding: "20px 22px",
              }}>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#FFD700", fontFamily: "'Playfair Display', serif" }}>
                  Confirm Payment
                </div>
                <div style={{ fontSize: "0.6rem", color: "rgba(255,220,130,0.7)", marginTop: 4 }}>
                  Please review before confirming
                </div>
              </div>

              <div style={{ padding: "20px 22px" }}>
                {[
                  ["Plan",    planTitle],
                  ["Amount",  fmt(amount)],
                  ["Method",  paymentOptions.find(o => o.value === selectedMethod)?.label],
                ].map(([k, v]) => (
                  <div key={k} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "9px 0", borderBottom: "1px solid rgba(139,26,26,0.06)",
                  }}>
                    <span style={{ fontSize: "0.7rem", color: "#999" }}>{k}</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#3B0000" }}>{v}</span>
                  </div>
                ))}

                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button
                    onClick={() => setConfirmOpen(false)}
                    disabled={isLoading}
                    style={{
                      flex: 1, height: 46, borderRadius: 12,
                      border: "1.5px solid rgba(139,26,26,0.2)",
                      background: "transparent", color: "#8B0000",
                      fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handlePayment}
                    disabled={isLoading}
                    style={{
                      flex: 2, height: 46, borderRadius: 12, border: "none",
                      background: "linear-gradient(135deg, #7B0000, #C0392B)",
                      color: "#FFD700", fontWeight: 800, fontSize: "0.78rem",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      fontFamily: "'Montserrat', sans-serif",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: "0 4px 14px rgba(100,0,0,0.3)",
                    }}
                  >
                    {isLoading
                      ? <><CircularProgress size={16} sx={{ color: "#FFD700" }} /> Processing…</>
                      : <>✦ Confirm & Pay {fmt(amount)}</>
                    }
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Snackbar
        open={snackbar.open} autoHideDuration={4000}
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
}