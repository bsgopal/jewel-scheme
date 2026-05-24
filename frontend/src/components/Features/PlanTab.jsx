import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgress, Snackbar, Alert } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

/* ─── small reusable info row ───────────────────────────────── */
function InfoRow({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(169,126,39,0.07)" }}>
      <span style={{ fontSize: "0.68rem", color: "#8a6b49", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: "0.72rem", fontWeight: 800, color: highlight ? "#2d8a52" : "#3e2b16" }}>{value}</span>
    </div>
  );
}

export default function PlanTab({ userId }) {
  const [schemes, setSchemes]         = useState([]);
  const [walletBalance, setWallet]    = useState(0);
  const [goldRate, setGoldRate]       = useState(0);
  const [loading, setLoading]         = useState(true);
  const [toggling, setToggling]       = useState(null);
  const [payPopup, setPayPopup]       = useState(null);
  const [payAmount, setPayAmount]     = useState("");   // custom amount for flexible
  const [paying, setPaying]           = useState(false);
  const [snack, setSnack]             = useState({ open: false, msg: "", type: "success" });

  const showSnack = (msg, type = "success") => setSnack({ open: true, msg, type });

  /* ── Fetch all data ──────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [schemesRes, walletRes, rateRes] = await Promise.all([
        axios.get(`${API}/api/schemes`, { headers: authHeaders() }),
        axios.get(`${API}/api/wallet/${userId || "self"}`, { headers: authHeaders() }),
        axios.get(`${API}/api/gold-rate/current`),
      ]);
      setSchemes(schemesRes.data.data || []);
      setWallet(walletRes.data?.balance || 0);
      setGoldRate(rateRes.data?.data?.gold22K || 0);
    } catch (err) {
      showSnack(err.response?.data?.message || "Unable to load plans", "error");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Toggle Digi Gold link ───────────────────────────────────── */
  const handleToggleLink = async (scheme) => {
    const sid = scheme._id;
    setToggling(sid);
    try {
      const res = await axios.patch(
        `${API}/api/schemes/${sid}/digi-gold-link`,
        {},
        { headers: authHeaders() }
      );
      setSchemes(prev => prev.map(s => s._id === sid ? { ...s, digiGoldLinked: res.data.digiGoldLinked } : s));
      showSnack(res.data.message, "success");
    } catch (err) {
      showSnack(err.response?.data?.message || "Failed to update link", "error");
    } finally {
      setToggling(null);
    }
  };

  /* ── Pay installment from wallet ─────────────────────────────── */
  const openPayPopup = (scheme) => {
    const isFlexible = scheme.schemeType === "flexible";
    // For fixed plans, pre-fill with the installment amount
    setPayAmount(isFlexible ? "" : String(scheme.planAmount || scheme.monthlyAmount || ""));
    setPayPopup(scheme);
  };

  const handlePayFromWallet = async () => {
    if (!payPopup) return;
    const isFlexible = payPopup.schemeType === "flexible";
    const fixedAmt   = payPopup.planAmount || payPopup.monthlyAmount;
    const amount     = isFlexible ? Number(payAmount) : fixedAmt;

    if (!amount || amount < 100) {
      showSnack("Minimum payment is Rs 100", "error");
      return;
    }
    if (walletBalance < amount) {
      showSnack(`Insufficient wallet balance. Need Rs ${amount.toLocaleString("en-IN")}, have Rs ${walletBalance.toLocaleString("en-IN")}`, "error");
      return;
    }

    const totalPlanAmount = (payPopup.planAmount || payPopup.monthlyAmount || 0) * (payPopup.totalInstallments || 1);
    const remaining       = Math.max(0, totalPlanAmount - (payPopup.totalAmountPaid || 0));
    if (isFlexible && amount > remaining) {
      showSnack(`Maximum payable is Rs ${remaining.toLocaleString("en-IN")} (remaining balance)`, "error");
      return;
    }

    setPaying(true);
    try {
      const res = await axios.post(
        `${API}/api/wallet/pay-installment`,
        { userId: userId || "self", schemeId: payPopup._id, amount },
        { headers: authHeaders() }
      );
      showSnack(res.data.message || "Payment successful! 🎉", "success");
      setPayPopup(null);
      setPayAmount("");
      fetchAll();
    } catch (err) {
      showSnack(err.response?.data?.message || "Payment failed", "error");
    } finally {
      setPaying(false);
    }
  };

  /* ── Status badge colour ─────────────────────────────────────── */
  const statusColor = (s) => ({
    active:    { bg: "rgba(45,138,82,0.1)",  text: "#2d8a52" },
    matured:   { bg: "rgba(201,162,39,0.15)", text: "#a9771c" },
    cancelled: { bg: "rgba(192,57,43,0.1)",  text: "#c0392b" },
    paused:    { bg: "rgba(100,100,100,0.1)", text: "#666" },
  }[s] || { bg: "rgba(169,126,39,0.1)", text: "#8a6b49" });

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <CircularProgress sx={{ color: "#a9771c" }} />
      <div style={{ marginTop: 12, fontSize: "0.78rem", color: "#8a6b49" }}>Loading your plans…</div>
    </div>
  );

  return (
    <div style={{ paddingBottom: 100 }}>

      {/* ── Header info card ── */}
      <div style={{
        background: "linear-gradient(135deg, #c9a227, #a9771c)",
        borderRadius: 18, padding: "16px 20px", marginBottom: 18,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.7)", fontWeight: 700, letterSpacing: "0.15em" }}>DIGI GOLD WALLET</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff", marginTop: 2 }}>
            Rs {Number(walletBalance).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
            Available to pay installments
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>LINKED PLANS</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff" }}>
            {schemes.filter(s => s.digiGoldLinked).length}/{schemes.length}
          </div>
          <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.8)" }}>plans linked</div>
        </div>
      </div>

      {/* ── Explain badge ── */}
      <div style={{
        background: "rgba(169,118,28,0.07)", borderRadius: 12, padding: "10px 14px",
        fontSize: "0.68rem", color: "#7a5a28", lineHeight: 1.5, marginBottom: 18,
        border: "1px solid rgba(169,126,39,0.14)",
      }}>
        💡 <b>How it works:</b> Link a plan to your Digi Gold wallet, then pay your monthly installment directly from your wallet balance. Your gold accumulates instantly at the current 22K rate.
      </div>

      {/* ── Empty state ── */}
      {schemes.length === 0 && (
        <div style={{
          textAlign: "center", padding: "50px 20px",
          background: "#fff", borderRadius: 18,
          border: "2px dashed rgba(169,118,28,0.2)",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>🪙</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#8a6b49", marginBottom: 6 }}>No plans yet</div>
          <div style={{ fontSize: "0.7rem", color: "#bbb" }}>Enroll in a gold saving plan to see it here</div>
        </div>
      )}

      {/* ── Plan cards ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <AnimatePresence>
          {schemes.map((scheme, i) => {
            const installmentAmt = scheme.planAmount || scheme.monthlyAmount || 0;
            const progress = Math.min(100, ((scheme.paidInstallments || 0) / (scheme.totalInstallments || 1)) * 100);
            const isFlexible     = scheme.schemeType === "flexible";
            const canPayFromWallet = scheme.digiGoldLinked && scheme.status === "active"
              && (isFlexible ? walletBalance >= 100 : walletBalance >= installmentAmt);
            const sc = statusColor(scheme.status);

            return (
              <motion.div
                key={scheme._id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  background: "#fff",
                  border: scheme.digiGoldLinked
                    ? "2px solid rgba(169,118,28,0.4)"
                    : "1px solid rgba(169,126,39,0.14)",
                  borderRadius: 18,
                  overflow: "hidden",
                  boxShadow: scheme.digiGoldLinked
                    ? "0 6px 24px rgba(169,118,28,0.12)"
                    : "0 4px 14px rgba(133,104,74,0.07)",
                }}
              >
                {/* Linked banner */}
                {scheme.digiGoldLinked && (
                  <div style={{
                    background: "linear-gradient(135deg, #c9a227, #a9771c)",
                    padding: "5px 14px",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <CheckCircleIcon style={{ fontSize: 13, color: "#fff" }} />
                    <span style={{ fontSize: "0.58rem", color: "#fff", fontWeight: 800, letterSpacing: "0.1em" }}>
                      LINKED TO DIGI GOLD WALLET
                    </span>
                  </div>
                )}

                {/* Card body */}
                <div style={{ padding: "16px 16px 14px" }}>
                  {/* Title row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#3e2b16", fontFamily: "'Playfair Display', serif" }}>
                        {scheme.schemeName}
                      </div>
                      <div style={{ fontSize: "0.58rem", color: "#8a6b49", marginTop: 2 }}>
                        {scheme.schemeId} · {scheme.schemeType}
                      </div>
                    </div>
                    <div style={{
                      padding: "4px 10px", borderRadius: 999, fontSize: "0.58rem",
                      fontWeight: 700, background: sc.bg, color: sc.text,
                    }}>
                      {scheme.status?.toUpperCase()}
                    </div>
                  </div>

                  {/* Info rows */}
                  <InfoRow label="Monthly Amount" value={`Rs ${installmentAmt.toLocaleString("en-IN")}`} />
                  <InfoRow label="Installments" value={`${scheme.paidInstallments || 0} / ${scheme.totalInstallments}`} />
                  <InfoRow label="Total Paid" value={`Rs ${(scheme.totalAmountPaid || 0).toLocaleString("en-IN")}`} />
                  <InfoRow label="Gold Accumulated" value={`${Number(scheme.totalGoldWeight || 0).toFixed(4)} g`} highlight />
                  {scheme.nextDueDate && scheme.status === "active" && (
                    <InfoRow label="Next Due" value={new Date(scheme.nextDueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
                  )}

                  {/* Progress bar */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: "0.6rem", color: "#8a6b49", fontWeight: 700 }}>PROGRESS</span>
                      <span style={{ fontSize: "0.6rem", color: "#a9771c", fontWeight: 800 }}>{Math.round(progress)}%</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(169,126,39,0.12)", borderRadius: 999, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ height: "100%", background: "linear-gradient(90deg, #c9a227, #a9771c)", borderRadius: 999 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action strip */}
                {scheme.status === "active" && (
                  <div style={{ borderTop: "1px solid rgba(169,126,39,0.08)", display: "flex" }}>

                    {/* Link / Unlink button */}
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleToggleLink(scheme)}
                      disabled={toggling === scheme._id}
                      style={{
                        flex: 1, height: 44, border: "none",
                        background: scheme.digiGoldLinked ? "rgba(192,57,43,0.06)" : "rgba(169,118,28,0.06)",
                        color: scheme.digiGoldLinked ? "#c0392b" : "#a9771c",
                        fontWeight: 700, fontSize: "0.68rem",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 5,
                        borderRight: "1px solid rgba(169,126,39,0.08)",
                        fontFamily: "'Montserrat', sans-serif",
                      }}
                    >
                      {toggling === scheme._id
                        ? <CircularProgress size={14} sx={{ color: "inherit" }} />
                        : scheme.digiGoldLinked
                          ? <><LinkOffIcon style={{ fontSize: 15 }} /> Unlink Wallet</>
                          : <><LinkIcon style={{ fontSize: 15 }} /> Link to Wallet</>
                      }
                    </motion.button>

                    {/* Pay from wallet button */}
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => openPayPopup(scheme)}
                      disabled={!canPayFromWallet}
                      title={
                        !scheme.digiGoldLinked ? "Link to wallet first" :
                        isFlexible && walletBalance < 100 ? "Need at least Rs 100 in wallet" :
                        !isFlexible && walletBalance < installmentAmt ? `Need Rs ${installmentAmt.toLocaleString("en-IN")} in wallet` :
                        "Pay from Digi Gold wallet"
                      }
                      style={{
                        flex: 1, height: 44, border: "none",
                        background: canPayFromWallet ? "linear-gradient(135deg, #c9a227, #a9771c)" : "rgba(169,126,39,0.06)",
                        color: canPayFromWallet ? "#fff" : "#bbb",
                        fontWeight: 700, fontSize: "0.68rem",
                        cursor: canPayFromWallet ? "pointer" : "not-allowed",
                        display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 5,
                        fontFamily: "'Montserrat', sans-serif",
                        transition: "all 0.2s",
                      }}
                    >
                      <AccountBalanceWalletIcon style={{ fontSize: 15 }} />
                      Pay Installment
                    </motion.button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Pay from Wallet Popup ── */}
      <AnimatePresence>
        {payPopup && (() => {
          const isFlexible = payPopup.schemeType === "flexible";
          const totalPlanAmount = (payPopup.planAmount || payPopup.monthlyAmount || 0) * (payPopup.totalInstallments || 1);
          const remaining       = Math.max(0, totalPlanAmount - (payPopup.totalAmountPaid || 0));
          const fixedAmt        = payPopup.planAmount || payPopup.monthlyAmount || 0;
          const enteredAmt      = isFlexible ? Number(payAmount || 0) : fixedAmt;
          const goldCredit      = goldRate && enteredAmt ? (enteredAmt / goldRate).toFixed(4) : "—";
          const afterBalance    = walletBalance - enteredAmt;
          const canPay          = enteredAmt >= 100 && enteredAmt <= walletBalance && (!isFlexible || enteredAmt <= remaining);

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed", inset: 0, zIndex: 2000,
                background: "rgba(0,0,0,0.5)",
                display: "flex", alignItems: "flex-end", justifyContent: "center",
              }}
              onClick={() => !paying && setPayPopup(null)}
            >
              <motion.div
                initial={{ y: 300, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                onClick={e => e.stopPropagation()}
                style={{
                  width: "min(520px, 100%)",
                  background: "#fff",
                  borderRadius: "24px 24px 0 0",
                  overflow: "hidden",
                  boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
                }}
              >
                {/* Header */}
                <div style={{
                  background: "linear-gradient(135deg, #c9a227, #a9771c)",
                  padding: "18px 20px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display', serif" }}>
                      {isFlexible ? "Pay Any Amount" : "Pay Installment"}
                    </div>
                    <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
                      {payPopup?.schemeName} · {isFlexible ? "Flexible Plan" : "Fixed Plan"}
                    </div>
                  </div>
                  <button
                    onClick={() => setPayPopup(null)}
                    style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer" }}
                  >
                    <CloseIcon style={{ color: "#fff", fontSize: 18 }} />
                  </button>
                </div>

                <div style={{ padding: 20 }}>

                  {/* Flexible: custom amount input */}
                  {isFlexible && (
                    <>
                      {/* Remaining target */}
                      <div style={{
                        background: "rgba(169,118,28,0.07)", borderRadius: 12,
                        padding: "10px 14px", marginBottom: 14,
                        display: "flex", justifyContent: "space-between",
                      }}>
                        <div>
                          <div style={{ fontSize: "0.58rem", color: "#8a6b49", fontWeight: 700 }}>REMAINING TO TARGET</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#a9771c" }}>
                            Rs {remaining.toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "0.58rem", color: "#8a6b49", fontWeight: 700 }}>WALLET BALANCE</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#2d8a52" }}>
                            Rs {walletBalance.toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>

                      {/* Amount input */}
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ fontSize: "0.6rem", fontWeight: 700, color: "#a9771c", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                          Enter Amount (min Rs 100)
                        </label>
                        <div style={{
                          display: "flex", alignItems: "center",
                          border: "1.5px solid rgba(169,126,39,0.25)", borderRadius: 12,
                          background: "#fffaf5", padding: "0 14px",
                        }}>
                          <span style={{ fontSize: "1rem", fontWeight: 800, color: "#a9771c", marginRight: 6 }}>Rs</span>
                          <input
                            type="number"
                            min={100}
                            max={Math.min(walletBalance, remaining)}
                            value={payAmount}
                            onChange={e => setPayAmount(e.target.value)}
                            placeholder="Enter amount…"
                            style={{
                              flex: 1, border: "none", outline: "none",
                              background: "transparent", padding: "13px 0",
                              fontSize: "1rem", fontWeight: 800, color: "#3e2b16",
                              fontFamily: "'Montserrat', sans-serif",
                            }}
                          />
                        </div>
                      </div>

                      {/* Quick-select chips */}
                      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                        {[25, 50, 100].map(pct => {
                          const chipAmt = Math.min(Math.round(remaining * pct / 100), walletBalance);
                          return (
                            <button
                              key={pct}
                              onClick={() => setPayAmount(String(chipAmt))}
                              style={{
                                flex: 1, padding: "7px 0", borderRadius: 10, fontSize: "0.65rem",
                                fontWeight: 800, cursor: "pointer",
                                border: String(payAmount) === String(chipAmt) ? "none" : "1px solid rgba(169,126,39,0.22)",
                                background: String(payAmount) === String(chipAmt) ? "linear-gradient(135deg,#c9a227,#a9771c)" : "#fffaf5",
                                color: String(payAmount) === String(chipAmt) ? "#fff" : "#8a6b49",
                              }}
                            >
                              {pct}%<br />
                              <span style={{ fontSize: "0.58rem", fontWeight: 600 }}>Rs {chipAmt.toLocaleString("en-IN")}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Summary rows (both fixed and flexible) */}
                  {[
                    [isFlexible ? "Amount to Pay" : "Installment Amount",
                      enteredAmt > 0 ? `Rs ${enteredAmt.toLocaleString("en-IN")}` : "—"],
                    ["Wallet Balance", `Rs ${walletBalance.toLocaleString("en-IN")}`],
                    ["Balance After", enteredAmt > 0 ? `Rs ${Math.max(0, afterBalance).toLocaleString("en-IN")}` : "—"],
                    ["Gold Credit (approx)", enteredAmt > 0 ? `${goldCredit} g` : "—"],
                    ...(isFlexible ? [["Remaining After", enteredAmt > 0 ? `Rs ${Math.max(0, remaining - enteredAmt).toLocaleString("en-IN")}` : `Rs ${remaining.toLocaleString("en-IN")}`]] : []),
                  ].map(([label, value], idx) => (
                    <div key={idx} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "9px 0", borderBottom: "1px solid rgba(169,126,39,0.08)",
                    }}>
                      <span style={{ fontSize: "0.68rem", color: "#8a6b49", fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#3e2b16" }}>{value}</span>
                    </div>
                  ))}

                  {/* Validation messages */}
                  {enteredAmt > 0 && enteredAmt > walletBalance && (
                    <div style={{ background: "rgba(192,57,43,0.08)", borderRadius: 10, padding: "9px 14px", fontSize: "0.68rem", color: "#c0392b", fontWeight: 700, marginTop: 10 }}>
                      ⚠️ Amount exceeds wallet balance
                    </div>
                  )}
                  {isFlexible && enteredAmt > 0 && enteredAmt > remaining && enteredAmt <= walletBalance && (
                    <div style={{ background: "rgba(192,57,43,0.08)", borderRadius: 10, padding: "9px 14px", fontSize: "0.68rem", color: "#c0392b", fontWeight: 700, marginTop: 10 }}>
                      ⚠️ Exceeds remaining plan balance (Rs {remaining.toLocaleString("en-IN")})
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                    <button
                      onClick={() => setPayPopup(null)}
                      style={{
                        flex: 1, height: 46, borderRadius: 12,
                        border: "1.5px solid rgba(169,118,28,0.2)",
                        background: "transparent", color: "#8a6b49",
                        fontWeight: 700, fontSize: "0.78rem",
                        cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
                      }}
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handlePayFromWallet}
                      disabled={paying || !canPay}
                      style={{
                        flex: 2, height: 46, borderRadius: 12, border: "none",
                        background: canPay && !paying ? "linear-gradient(135deg, #c9a227, #a9771c)" : "rgba(169,118,28,0.2)",
                        color: "#fff", fontWeight: 800, fontSize: "0.82rem",
                        cursor: paying || !canPay ? "not-allowed" : "pointer",
                        fontFamily: "'Montserrat', sans-serif",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        boxShadow: canPay ? "0 4px 14px rgba(169,119,28,0.3)" : "none",
                        transition: "all 0.2s",
                      }}
                    >
                      {paying
                        ? <><CircularProgress size={16} sx={{ color: "#fff" }} /> Processing…</>
                        : enteredAmt > 0 ? `Pay Rs ${enteredAmt.toLocaleString("en-IN")}` : "Confirm Payment"
                      }
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.type} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </div>
  );
}
