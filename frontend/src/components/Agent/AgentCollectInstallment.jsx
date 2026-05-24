import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { getBackTarget } from "../../utils/navigation";
import { CircularProgress } from "@mui/material";

const API = process.env.REACT_APP_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

const PAYMENT_METHODS = [
  { key: "Cash",      label: "Cash",      emoji: "💵" },
  { key: "UPI",       label: "UPI",       emoji: "📱" },
  { key: "NetBanking",label: "Net Banking",emoji: "🏦" },
  { key: "DebitCard", label: "Debit Card", emoji: "💳" },
];

export default function AgentCollectInstallment() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const backTarget = getBackTarget(location, "/agent-dashboard");

  const {
    customerId,
    customerName,
    planName,
    pendingAmount,
    schemeId,
    phone,
  } = location.state || {};

  const [amounts,       setAmounts]       = useState([]);
  const [defaultAmount, setDefaultAmount] = useState(null);
  const [selectedAmount,setSelectedAmount]= useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [customVal,     setCustomVal]     = useState("");
  const [showCustom,    setShowCustom]    = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [billNumber,    setBillNumber]    = useState("");
  const [loading,       setLoading]       = useState(true);
  const [collecting,    setCollecting]    = useState(false);
  const [error,         setError]         = useState("");
  const [done,          setDone]          = useState(false); // success screen

  useEffect(() => {
    if (!customerId || !schemeId) {
      setError("Invalid customer or scheme information. Please go back and try again.");
      setLoading(false);
      return;
    }
    fetchAmounts();
  }, [customerId, schemeId]);

  const fetchAmounts = async () => {
    try {
      const res = await axios.get(`${API}/api/agent/collection-amounts`, { headers: authHeaders() });
      const list = res.data.data.amounts || [];
      const def  = res.data.data.defaultAmount;
      setAmounts(list);
      setDefaultAmount(def);
      setSelectedAmount(def || (list[0]?.value ?? null));
    } catch {
      // no amounts configured — agent can still enter custom
    } finally {
      setLoading(false);
    }
  };

  const finalAmount = showCustom
    ? (parseFloat(customVal) || 0)
    : (selectedAmount || 0);

  const handleCollect = async () => {
    if (!finalAmount || finalAmount < 100) {
      setError("Please select or enter a valid amount (min ₹100)");
      return;
    }
    if (!paymentMethod) {
      setError("Please select a payment method");
      return;
    }
    if ((paymentMethod === "UPI" || paymentMethod === "NetBanking") && !transactionId.trim()) {
      setError("Please enter the transaction / UTR ID for digital payments");
      return;
    }

    setCollecting(true);
    setError("");

    try {
      // ✅ Actually create a payment record in your DB
      await axios.post(
        `${API}/api/payments`,
        {
          scheme:        schemeId,
          user:          customerId,
          amount:        finalAmount,
          paymentMethod,
          transactionId: transactionId.trim() || undefined,
          billNumber:    billNumber.trim() || undefined,
          notes:         `Collected by agent`,
        },
        { headers: authHeaders() }
      );

      setDone(true);

      // Go back after 2.5s
      setTimeout(() => navigate(backTarget), 2500);

    } catch (e) {
      setError(e.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setCollecting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(180deg,#fffdf8,#fff4df)",
      fontFamily: "'Montserrat',sans-serif", padding: 24,
    }}>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          width: 90, height: 90, borderRadius: "50%",
          background: "linear-gradient(135deg,#27ae60,#2ecc71)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "2.4rem", marginBottom: 24,
          boxShadow: "0 12px 36px rgba(39,174,96,0.3)",
        }}
      >
        ✓
      </motion.div>
      <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#3e2b16",
        fontFamily: "'Playfair Display',serif", marginBottom: 8 }}>
        Payment Recorded!
      </div>
      <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#c9a227", marginBottom: 8 }}>
        ₹{fmt(finalAmount)}
      </div>
      <div style={{ fontSize: "0.78rem", color: "#8a6b49", textAlign: "center", lineHeight: 1.6 }}>
        Collected from <strong>{customerName}</strong><br />
        via {paymentMethod} · {planName}
      </div>
      <div style={{ marginTop: 16, fontSize: "0.65rem", color: "#bbb" }}>
        Returning to dashboard…
      </div>
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "linear-gradient(180deg,#fffdf8,#fff4df)" }}>
      <CircularProgress sx={{ color: "#a9771c" }} />
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg,#fffdf8 0%,#fff4df 100%)",
      fontFamily: "'Montserrat',sans-serif",
      paddingBottom: 40,
    }}>

      {/* ── Header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "linear-gradient(135deg,#c9a227,#a9771c)",
        padding: "0 16px", height: 58,
        display: "flex", alignItems: "center", gap: 12,
        boxShadow: "0 4px 20px rgba(169,119,28,0.25)",
      }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(backTarget)}
          style={{
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 10, padding: "6px 8px", cursor: "pointer",
            display: "flex", alignItems: "center", color: "#fff", fontSize: "1rem",
          }}
        >
          ←
        </motion.button>
        <div style={{ flex: 1, fontSize: "1rem", fontWeight: 800, color: "#fff",
          fontFamily: "'Playfair Display',serif" }}>
          Collect Payment
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px" }}>

        {/* ── Error ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.2)",
                borderRadius: 12, padding: "12px 16px", marginBottom: 16,
                fontSize: "0.75rem", fontWeight: 700, color: "#c0392b",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              {error}
              <span onClick={() => setError("")} style={{ cursor: "pointer", fontSize: "1rem" }}>×</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Customer card ── */}
        <div style={{
          background: "#fff",
          border: "1px solid rgba(169,126,39,0.14)",
          borderRadius: 20, overflow: "hidden",
          boxShadow: "0 6px 24px rgba(133,104,74,0.09)",
          marginBottom: 20,
        }}>
          <div style={{
            background: "linear-gradient(135deg,#c9a227,#a9771c)",
            padding: "14px 18px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.3rem", fontWeight: 900, color: "#fff",
            }}>
              {customerName?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff",
                fontFamily: "'Playfair Display',serif" }}>
                {customerName || "Customer"}
              </div>
              <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                {phone || customerId || "—"}
              </div>
            </div>
          </div>

          <div style={{
            padding: "14px 18px",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
          }}>
            <div>
              <div style={{ fontSize: "0.55rem", color: "#a9771c", fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase" }}>Scheme</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#3e2b16", marginTop: 3 }}>
                {planName || "—"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.55rem", color: "#a9771c", fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase" }}>Monthly Due</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#c0392b", marginTop: 3 }}>
                ₹{fmt(pendingAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* ── Amount selection ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#a9771c",
            letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
            Select Amount
          </div>

          {/* Preset amounts */}
          {amounts.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(100px,1fr))",
              gap: 8, marginBottom: 10,
            }}>
              {amounts.sort((a,b) => a.value - b.value).map(a => {
                const sel = !showCustom && selectedAmount === a.value;
                return (
                  <motion.button
                    key={a.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setSelectedAmount(a.value); setShowCustom(false); setError(""); }}
                    style={{
                      height: 56, borderRadius: 14, border: "none",
                      background: sel
                        ? "linear-gradient(135deg,#c9a227,#a9771c)"
                        : "#fff",
                      border: sel
                        ? "none"
                        : "1.5px solid rgba(169,126,39,0.2)",
                      color: sel ? "#fff" : "#3e2b16",
                      fontWeight: 900, fontSize: "0.95rem",
                      cursor: "pointer", fontFamily: "'Montserrat',sans-serif",
                      boxShadow: sel
                        ? "0 6px 18px rgba(169,119,28,0.28)"
                        : "0 2px 8px rgba(133,104,74,0.06)",
                      position: "relative", transition: "all 0.15s",
                    }}
                  >
                    ₹{fmt(a.value)}
                    {defaultAmount === a.value && (
                      <div style={{
                        position: "absolute", top: -6, right: -6,
                        background: sel ? "#fff" : "#c9a227",
                        color: sel ? "#c9a227" : "#fff",
                        borderRadius: 999, padding: "1px 6px",
                        fontSize: "0.48rem", fontWeight: 800,
                      }}>
                        DEFAULT
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Custom amount toggle */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { setShowCustom(!showCustom); setError(""); }}
            style={{
              width: "100%", height: 46, borderRadius: 12,
              border: showCustom
                ? "2px solid #c9a227"
                : "1.5px dashed rgba(169,126,39,0.3)",
              background: showCustom ? "rgba(201,162,39,0.06)" : "transparent",
              color: showCustom ? "#a9771c" : "#8a6b49",
              fontWeight: 700, fontSize: "0.78rem",
              cursor: "pointer", fontFamily: "'Montserrat',sans-serif",
              transition: "all 0.15s",
            }}
          >
            {showCustom ? "✕ Cancel Custom" : "✎ Enter Custom Amount"}
          </motion.button>

          <AnimatePresence>
            {showCustom && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden", marginTop: 10 }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "#a9771c", flexShrink: 0 }}>₹</span>
                  <input
                    type="number"
                    value={customVal}
                    onChange={e => setCustomVal(e.target.value)}
                    placeholder="Enter amount"
                    min={100}
                    autoFocus
                    style={{
                      flex: 1, padding: "12px 14px", borderRadius: 12,
                      border: "1.5px solid rgba(169,126,39,0.25)",
                      fontSize: "1.1rem", fontWeight: 800, color: "#3e2b16",
                      background: "#fffaf5", outline: "none",
                      fontFamily: "'Montserrat',sans-serif",
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Payment method ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#a9771c",
            letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
            Payment Method
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8,
          }}>
            {PAYMENT_METHODS.map(m => {
              const sel = paymentMethod === m.key;
              return (
                <motion.button
                  key={m.key}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => { setPaymentMethod(m.key); setError(""); }}
                  style={{
                    height: 64, borderRadius: 14, border: "none",
                    background: sel
                      ? "linear-gradient(135deg,#c9a227,#a9771c)"
                      : "#fff",
                    border: sel ? "none" : "1.5px solid rgba(169,126,39,0.18)",
                    cursor: "pointer", fontFamily: "'Montserrat',sans-serif",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 4,
                    boxShadow: sel
                      ? "0 6px 18px rgba(169,119,28,0.28)"
                      : "0 2px 8px rgba(133,104,74,0.05)",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>{m.emoji}</span>
                  <span style={{
                    fontSize: "0.55rem", fontWeight: 800,
                    color: sel ? "#fff" : "#8a6b49",
                    textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>{m.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Transaction ID for digital payments */}
          <AnimatePresence>
            {(paymentMethod === "UPI" || paymentMethod === "NetBanking") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden", marginTop: 12 }}
              >
                <div style={{ fontSize: "0.58rem", fontWeight: 800, color: "#a9771c",
                  letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                  Transaction / UTR ID *
                </div>
                <input
                  type="text"
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value)}
                  placeholder={paymentMethod === "UPI" ? "e.g. UPI123456789" : "e.g. UTR123456789012"}
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 10,
                    border: "1.5px solid rgba(169,126,39,0.2)",
                    fontSize: "0.82rem", color: "#3e2b16",
                    background: "#fffaf5", outline: "none",
                    fontFamily: "'Montserrat',sans-serif", boxSizing: "border-box",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: "0.58rem", fontWeight: 800, color: "#a9771c", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
              Bill Number
            </div>
            <input
              type="text"
              value={billNumber}
              onChange={e => setBillNumber(e.target.value)}
              placeholder="Optional bill number"
              style={{
                width: "100%", padding: "11px 14px", borderRadius: 10,
                border: "1.5px solid rgba(169,126,39,0.2)",
                fontSize: "0.82rem", color: "#3e2b16",
                background: "#fffaf5", outline: "none",
                fontFamily: "'Montserrat',sans-serif", boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* ── Summary ── */}
        {finalAmount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: "linear-gradient(135deg,#3e2b16,#5c3d1e)",
              borderRadius: 20, padding: "18px 20px",
              marginBottom: 20,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              boxShadow: "0 8px 28px rgba(62,43,22,0.2)",
            }}
          >
            <div>
              <div style={{ fontSize: "0.55rem", color: "rgba(201,162,39,0.6)",
                fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 4 }}>
                Collecting
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 900, color: "#c9a227", lineHeight: 1 }}>
                ₹{fmt(finalAmount)}
              </div>
              <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
                via {paymentMethod} · from {customerName}
              </div>
            </div>
            <div style={{ fontSize: "2rem" }}>💰</div>
          </motion.div>
        )}

        {/* ── Collect button ── */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleCollect}
          disabled={collecting || finalAmount < 100}
          style={{
            width: "100%", height: 54, borderRadius: 14, border: "none",
            background: finalAmount >= 100
              ? "linear-gradient(135deg,#c9a227,#a9771c)"
              : "rgba(169,118,28,0.2)",
            color: "#fff", fontWeight: 900, fontSize: "0.95rem",
            cursor: finalAmount >= 100 && !collecting ? "pointer" : "not-allowed",
            fontFamily: "'Montserrat',sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: finalAmount >= 100 ? "0 8px 28px rgba(169,119,28,0.3)" : "none",
            transition: "all 0.2s",
          }}
        >
          {collecting
            ? <><CircularProgress size={20} sx={{ color: "#fff" }} /> Recording Payment…</>
            : `✓ Confirm ₹${fmt(finalAmount)} Collection`
          }
        </motion.button>

        <div style={{ textAlign: "center", marginTop: 12, fontSize: "0.62rem", color: "#bbb" }}>
          This will be recorded against {customerName}'s scheme
        </div>
      </div>
    </div>
  );
}
