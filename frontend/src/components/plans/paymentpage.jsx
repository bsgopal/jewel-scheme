import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { CircularProgress, Snackbar, Alert } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import { motion, AnimatePresence } from "framer-motion";

const paymentOptions = [
  { value: "Cash", label: "Cash", icon: "Cash", desc: "Pay at store counter" },
  { value: "UPI", label: "UPI", icon: "UPI", desc: "PhonePe, GPay, Paytm" },
  { value: "NetBanking", label: "Net Banking", icon: "Bank", desc: "All major banks" },
  { value: "BankTransfer", label: "Bank Transfer", icon: "NEFT", desc: "NEFT / RTGS / IMPS" },
];

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedMethod, setSelectedMethod] = useState("Cash");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const { type, plan } = location.state || {};
  const schemeId = plan?._id || plan?.id;
  const amount = useMemo(() => Number(plan?.monthlyAmount || plan?.amount_per_inst || plan?.inst_amount || 0), [plan]);
  const isFlexiblePlan = (plan?.schemeType || plan?.plan_type || "").toLowerCase() === "flexible";
  const payableAmount = isFlexiblePlan ? Number(customAmount || 0) : amount;
  const planTitle = plan?.schemeName || plan?.plan_name || "Gold Savings Plan";
  const paidCount = plan?.paidInstallments || 0;
  const totalCount = plan?.totalInstallments || plan?.duration || 0;
  const progress = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
  const remainingAmount = Number(plan?.remainingAmount || 0);
  const currentInstallmentBalance = Number(plan?.currentInstallmentBalance || amount || 0);

  const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n || 0));

  const handlePayment = async () => {
    if (!schemeId || !payableAmount) {
      setSnackbar({ open: true, message: "Plan details are missing.", severity: "error" });
      return;
    }

    if (isFlexiblePlan && payableAmount < 100) {
      setSnackbar({ open: true, message: "Flexible plans require at least Rs 100 payment.", severity: "error" });
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/schemes/${schemeId}/pay`,
        { amount: payableAmount, paymentMethod: selectedMethod },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setPaid(true);
      setTimeout(() => navigate(`/plan-details/${schemeId}`), 1800);
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

  if (paid) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #4B0000 0%, #7B0000 60%, #A50000 100%)", fontFamily: "'Montserrat', sans-serif" }}>
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 18 }} style={{ textAlign: "center", padding: "40px 30px" }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.2, duration: 0.6 }}>
            <CheckCircleIcon style={{ fontSize: 80, color: "#FFD700" }} />
          </motion.div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#FFD700", fontFamily: "'Playfair Display', serif", marginTop: 20 }}>
            Payment Recorded
          </div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,220,130,0.75)", marginTop: 10, lineHeight: 1.7 }}>
            {fmt(payableAmount)} paid via {selectedMethod}
            <br />
            Redirecting to your plan...
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAF5F0", fontFamily: "'Montserrat', sans-serif", paddingBottom: 40 }}>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "linear-gradient(135deg, #7B0000, #A50000)", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1.5px solid rgba(255,200,80,0.3)", boxShadow: "0 3px 16px rgba(100,0,0,0.35)" }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,200,80,0.3)", borderRadius: 10, padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,200,80,0.2)", borderRadius: 8, padding: "4px 10px" }}>
          <LockIcon style={{ color: "#FFD700", fontSize: 12 }} />
          <span style={{ color: "rgba(255,220,130,0.8)", fontSize: "0.5rem", fontWeight: 700 }}>SSL</span>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: "linear-gradient(135deg, #7B0000 0%, #A50000 100%)", borderRadius: 22, overflow: "hidden", marginBottom: 18, boxShadow: "0 12px 36px rgba(100,0,0,0.28)", position: "relative" }}>
          <div style={{ padding: "22px 22px 18px", position: "relative" }}>
            <div style={{ fontSize: "0.5rem", color: "rgba(255,215,0,0.6)", letterSpacing: "0.22em", marginBottom: 6 }}>
              GOLD SAVINGS SCHEME
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#FFD700", fontFamily: "'Playfair Display', serif", marginBottom: 16, lineHeight: 1.2 }}>
              {planTitle}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "0.58rem", color: "rgba(255,220,130,0.7)" }}>{paidCount} of {totalCount} installments paid</span>
                <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#FFD700" }}>{progress}%</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.12)", borderRadius: 10 }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, delay: 0.3 }} style={{ height: "100%", borderRadius: 10, background: "linear-gradient(90deg, #FFD700, #FFA500)" }} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <div style={{ background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: 12, padding: "10px 18px", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: "0.5rem", color: "rgba(255,215,0,0.6)", letterSpacing: "0.15em" }}>
                  {isFlexiblePlan ? "YOU PAY" : "AMOUNT DUE"}
                </span>
                <span style={{ fontSize: "1.6rem", fontWeight: 900, color: "#FFD700", fontFamily: "'Playfair Display', serif", lineHeight: 1.1 }}>
                  {fmt(payableAmount || amount)}
                </span>
              </div>
              <div style={{ paddingLeft: 12 }}>
                <div style={{ fontSize: "0.58rem", color: "rgba(255,220,130,0.6)", marginBottom: 4 }}>Installment #{paidCount + 1}</div>
                <div style={{ fontSize: "0.58rem", color: "rgba(255,220,130,0.6)" }}>{totalCount - paidCount} remaining</div>
              </div>
            </div>
          </div>
        </motion.div>

        {isFlexiblePlan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ background: "#fff", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(139,26,26,0.1)", boxShadow: "0 6px 24px rgba(139,26,26,0.07)", marginBottom: 18 }}>
            <div style={{ background: "linear-gradient(90deg, rgba(139,26,26,0.05), rgba(139,26,26,0.01))", borderBottom: "1px solid rgba(139,26,26,0.08)", padding: "16px 20px" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#3B0000", fontFamily: "'Playfair Display', serif" }}>
                Flexible Payment
              </div>
              <div style={{ fontSize: "0.58rem", color: "#999" }}>
                Pay any amount now. Underpayment stays as remaining. Overpayment moves to the next installment.
              </div>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div style={{ background: "#FFFAF5", borderRadius: 12, border: "1px solid rgba(139,26,26,0.08)", padding: 12 }}>
                  <div style={{ fontSize: "0.56rem", color: "#999" }}>Current installment balance</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#7B0000" }}>{fmt(currentInstallmentBalance)}</div>
                </div>
                <div style={{ background: "#FFFAF5", borderRadius: 12, border: "1px solid rgba(139,26,26,0.08)", padding: 12 }}>
                  <div style={{ fontSize: "0.56rem", color: "#999" }}>Overall remaining</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#7B0000" }}>{fmt(remainingAmount)}</div>
                </div>
              </div>
              <input type="number" min="100" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="Enter amount to pay" style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1.5px solid rgba(139,26,26,0.16)", padding: "14px 16px", fontSize: "0.9rem", color: "#3B0000", outline: "none", background: "#fffdf9" }} />
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ background: "#fff", borderRadius: 20, border: "1px solid rgba(139,26,26,0.1)", boxShadow: "0 4px 16px rgba(139,26,26,0.06)", marginBottom: 22, overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(90deg, rgba(139,26,26,0.05), rgba(139,26,26,0.01))", borderBottom: "1px solid rgba(139,26,26,0.08)", padding: "14px 20px" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "#8B0000", letterSpacing: "0.15em" }}>PAYMENT METHOD</div>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {paymentOptions.map((opt) => {
              const isSelected = selectedMethod === opt.value;
              return (
                <div key={opt.value} onClick={() => setSelectedMethod(opt.value)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, cursor: "pointer", border: isSelected ? "2px solid #8B0000" : "1.5px solid rgba(139,26,26,0.1)", background: isSelected ? "linear-gradient(90deg, rgba(139,26,26,0.06), rgba(139,26,26,0.02))" : "#FFFAF5" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: isSelected ? "rgba(139,26,26,0.1)" : "rgba(139,26,26,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, color: "#7B0000" }}>
                    {opt.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: isSelected ? "#7B0000" : "#3B0000" }}>{opt.label}</div>
                    <div style={{ fontSize: "0.6rem", color: "#999", marginTop: 2 }}>{opt.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} whileTap={{ scale: isLoading ? 1 : 0.97 }} whileHover={{ scale: isLoading ? 1 : 1.01 }} onClick={() => setConfirmOpen(true)} disabled={isLoading} style={{ width: "100%", height: 54, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #7B0000, #C0392B)", color: "#FFD700", fontWeight: 800, fontSize: "0.88rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "'Montserrat', sans-serif", boxShadow: "0 8px 24px rgba(100,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <LockIcon style={{ fontSize: 16 }} />
          Pay {fmt(payableAmount || amount)} Securely
        </motion.button>
      </div>

      <AnimatePresence>
        {confirmOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 20px" }} onClick={() => !isLoading && setConfirmOpen(false)}>
            <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 28 }} onClick={(e) => e.stopPropagation()} style={{ width: "min(480px, 94%)", background: "#fff", borderRadius: "24px 24px 16px 16px", overflow: "hidden", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)" }}>
              <div style={{ background: "linear-gradient(135deg, #7B0000, #A50000)", padding: "20px 22px" }}>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#FFD700", fontFamily: "'Playfair Display', serif" }}>Confirm Payment</div>
                <div style={{ fontSize: "0.6rem", color: "rgba(255,220,130,0.7)", marginTop: 4 }}>Please review before confirming</div>
              </div>
              <div style={{ padding: "20px 22px" }}>
                {[
                  ["Plan", planTitle],
                  ["Amount", fmt(payableAmount || amount)],
                  ["Method", paymentOptions.find((opt) => opt.value === selectedMethod)?.label],
                ].map(([key, value]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(139,26,26,0.06)" }}>
                    <span style={{ fontSize: "0.7rem", color: "#999" }}>{key}</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#3B0000" }}>{value}</span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button onClick={() => setConfirmOpen(false)} disabled={isLoading} style={{ flex: 1, height: 46, borderRadius: 12, border: "1.5px solid rgba(139,26,26,0.2)", background: "transparent", color: "#8B0000", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", fontFamily: "'Montserrat', sans-serif" }}>
                    Cancel
                  </button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handlePayment} disabled={isLoading} style={{ flex: 2, height: 46, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7B0000, #C0392B)", color: "#FFD700", fontWeight: 800, fontSize: "0.78rem", cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "'Montserrat', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 14px rgba(100,0,0,0.3)" }}>
                    {isLoading ? <><CircularProgress size={16} sx={{ color: "#FFD700" }} /> Processing...</> : <>Confirm & Pay {fmt(payableAmount || amount)}</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
