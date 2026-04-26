import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { getBackTarget } from "../../utils/navigation";
import { CircularProgress } from "@mui/material";

const API = process.env.REACT_APP_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

// Preset suggestions for jewellery shop agents
const PRESETS = [500, 1000, 1500, 2000, 3000, 5000, 7500, 10000];

export default function AgentAmountManagement() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const backTarget = getBackTarget(location, "/agent-dashboard");

  const [amounts,       setAmounts]       = useState([]);
  const [defaultAmount, setDefaultAmount] = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [customVal, setCustomVal] = useState("");
  const [customLabel, setCustomLabel] = useState("");

  useEffect(() => { fetchAmounts(); }, []);

  const fetchAmounts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/agent/collection-amounts`, { headers: authHeaders() });
      setAmounts(res.data.data.amounts || []);
      setDefaultAmount(res.data.data.defaultAmount);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load amounts");
    } finally {
      setLoading(false);
    }
  };

  const existingValues = amounts.map(a => a.value);

  const addAmount = async (value, label) => {
    if (!value || value < 100) { setError("Minimum amount is ₹100"); return; }
    if (existingValues.includes(Number(value))) { setError(`₹${fmt(value)} is already in your list`); return; }
    setSaving(true);
    try {
      const res = await axios.post(
        `${API}/api/agent/collection-amounts`,
        { value: Number(value), label: label || `₹${fmt(value)}` },
        { headers: authHeaders() }
      );
      setAmounts(res.data.data.amounts || []);
      setDefaultAmount(res.data.data.defaultAmount);
      setSuccess(`₹${fmt(value)} added!`);
      setShowForm(false);
      setCustomVal("");
      setCustomLabel("");
      setTimeout(() => setSuccess(""), 2500);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to add amount");
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (amount) => {
    try {
      await axios.put(
        `${API}/api/agent/collection-amounts/default/${amount.id}`,
        {},
        { headers: authHeaders() }
      );
      setDefaultAmount(amount.value);
      setSuccess(`₹${fmt(amount.value)} set as default`);
      setTimeout(() => setSuccess(""), 2500);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to set default");
    }
  };

  const deleteAmount = async (amount) => {
    if (!window.confirm(`Remove ₹${fmt(amount.value)} from your list?`)) return;
    try {
      const res = await axios.delete(
        `${API}/api/agent/collection-amounts/${amount.id}`,
        { headers: authHeaders() }
      );
      setAmounts(res.data.data.amounts || []);
      setDefaultAmount(res.data.data.defaultAmount);
      setSuccess(`₹${fmt(amount.value)} removed`);
      setTimeout(() => setSuccess(""), 2500);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to remove amount");
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(180deg,#fffdf8,#fff4df)" }}>
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
        background: "rgba(255,255,255,0.94)", backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(169,126,39,0.12)",
        boxShadow: "0 4px 20px rgba(133,104,74,0.08)",
        padding: "0 16px", height: 58,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(backTarget)}
          style={{
            background: "#fff4e2", border: "1px solid rgba(169,118,28,0.15)",
            borderRadius: 10, padding: "6px 8px", cursor: "pointer",
            display: "flex", alignItems: "center",
          }}
        >
          <span style={{ color: "#a9771c", fontSize: "1rem" }}>←</span>
        </motion.button>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#3e2b16",
            fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>
            Collection Amounts
          </div>
          <div style={{ fontSize: "0.45rem", color: "#a9771c", letterSpacing: "0.2em" }}>
            QUICK PAYMENT PRESETS
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => { setShowForm(true); setError(""); }}
          style={{
            height: 36, paddingInline: 14, borderRadius: 10, border: "none",
            background: "linear-gradient(135deg,#c9a227,#a9771c)",
            color: "#fff", fontWeight: 800, fontSize: "0.72rem",
            cursor: "pointer", fontFamily: "'Montserrat',sans-serif",
            display: "flex", alignItems: "center", gap: 6,
            boxShadow: "0 4px 14px rgba(169,119,28,0.3)",
          }}
        >
          + Custom
        </motion.button>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px" }}>

        {/* Toast messages */}
        <AnimatePresence>
          {(error || success) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: "0.78rem", fontWeight: 700,
                background: error ? "rgba(192,57,43,0.08)" : "rgba(39,174,96,0.08)",
                border: `1px solid ${error ? "rgba(192,57,43,0.2)" : "rgba(39,174,96,0.2)"}`,
                color: error ? "#c0392b" : "#27ae60",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              {error || success}
              <span onClick={() => { setError(""); setSuccess(""); }} style={{ cursor: "pointer", fontSize: "1rem" }}>×</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── What is this section ── */}
        <div style={{
          background: "linear-gradient(135deg,rgba(201,162,39,0.08),rgba(169,119,28,0.04))",
          border: "1px solid rgba(169,126,39,0.15)",
          borderRadius: 16, padding: "16px 18px", marginBottom: 22,
        }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#3e2b16", marginBottom: 6 }}>
            💡 What are collection amounts?
          </div>
          <div style={{ fontSize: "0.72rem", color: "#8a6b49", lineHeight: 1.6 }}>
            These are the monthly installment amounts your customers pay for their gold schemes.
            Add the common amounts you collect (₹500, ₹1000 etc.) so you can collect payments
            quickly with one tap — no typing needed.
          </div>
          <div style={{ marginTop: 10, fontSize: "0.68rem", color: "#a9771c", fontWeight: 700 }}>
            ✦ One amount can be set as default — it gets pre-selected automatically
          </div>
        </div>

        {/* ── Quick add presets ── */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#a9771c",
            letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
            Quick Add — Common Amounts
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(90px,1fr))",
            gap: 8,
          }}>
            {PRESETS.map(val => {
              const already = existingValues.includes(val);
              return (
                <motion.button
                  key={val}
                  whileTap={{ scale: already ? 1 : 0.94 }}
                  onClick={() => !already && addAmount(val, `₹${fmt(val)}`)}
                  disabled={already || saving}
                  style={{
                    height: 46, borderRadius: 12, border: "none",
                    background: already
                      ? "rgba(169,118,28,0.08)"
                      : "linear-gradient(135deg,#fff8e7,#fff1cd)",
                    border: already
                      ? "1.5px solid rgba(169,118,28,0.15)"
                      : "1.5px solid rgba(201,162,39,0.3)",
                    color: already ? "#c9a227" : "#7a5210",
                    fontWeight: 800, fontSize: "0.75rem",
                    cursor: already ? "not-allowed" : "pointer",
                    fontFamily: "'Montserrat',sans-serif",
                    position: "relative",
                    transition: "all 0.15s",
                  }}
                >
                  ₹{fmt(val)}
                  {already && (
                    <span style={{
                      position: "absolute", top: -5, right: -5,
                      width: 16, height: 16, borderRadius: "50%",
                      background: "#c9a227", color: "#fff",
                      fontSize: "0.5rem", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontWeight: 900,
                    }}>✓</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Custom amount form ── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden", marginBottom: 22 }}
            >
              <div style={{
                background: "#fff", border: "1px solid rgba(169,126,39,0.18)",
                borderRadius: 18, padding: "18px",
                boxShadow: "0 4px 16px rgba(133,104,74,0.08)",
              }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#3e2b16", marginBottom: 14 }}>
                  Add Custom Amount
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: "0.58rem", fontWeight: 800, color: "#a9771c",
                    letterSpacing: "0.12em", marginBottom: 6 }}>AMOUNT (₹) *</div>
                  <input
                    type="number"
                    value={customVal}
                    onChange={e => setCustomVal(e.target.value)}
                    placeholder="e.g. 2500"
                    min={100}
                    style={{
                      width: "100%", padding: "11px 14px", borderRadius: 10, boxSizing: "border-box",
                      border: "1.5px solid rgba(169,126,39,0.2)",
                      fontSize: "0.85rem", color: "#3e2b16",
                      background: "#fffaf5", outline: "none",
                      fontFamily: "'Montserrat',sans-serif",
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: "0.58rem", fontWeight: 800, color: "#a9771c",
                    letterSpacing: "0.12em", marginBottom: 6 }}>LABEL (optional)</div>
                  <input
                    type="text"
                    value={customLabel}
                    onChange={e => setCustomLabel(e.target.value)}
                    placeholder="e.g. Premium Plan, Silver Plan"
                    style={{
                      width: "100%", padding: "11px 14px", borderRadius: 10, boxSizing: "border-box",
                      border: "1.5px solid rgba(169,126,39,0.2)",
                      fontSize: "0.82rem", color: "#3e2b16",
                      background: "#fffaf5", outline: "none",
                      fontFamily: "'Montserrat',sans-serif",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => { setShowForm(false); setCustomVal(""); setCustomLabel(""); setError(""); }}
                    style={{
                      flex: 1, height: 42, borderRadius: 10,
                      border: "1.5px solid rgba(169,118,28,0.2)",
                      background: "transparent", color: "#8a6b49",
                      fontWeight: 700, fontSize: "0.75rem",
                      cursor: "pointer", fontFamily: "'Montserrat',sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => addAmount(customVal, customLabel)}
                    disabled={saving || !customVal}
                    style={{
                      flex: 2, height: 42, borderRadius: 10, border: "none",
                      background: "linear-gradient(135deg,#c9a227,#a9771c)",
                      color: "#fff", fontWeight: 800, fontSize: "0.78rem",
                      cursor: saving || !customVal ? "not-allowed" : "pointer",
                      fontFamily: "'Montserrat',sans-serif",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      opacity: saving || !customVal ? 0.7 : 1,
                    }}
                  >
                    {saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Add Amount"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── My amounts list ── */}
        <div>
          <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#a9771c",
            letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
            Your Saved Amounts ({amounts.length})
          </div>

          {amounts.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "36px 20px",
              background: "#fff", borderRadius: 18,
              border: "2px dashed rgba(169,118,28,0.15)",
            }}>
              <div style={{ fontSize: "2rem", marginBottom: 10 }}>💰</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#8a6b49", marginBottom: 6 }}>
                No amounts added yet
              </div>
              <div style={{ fontSize: "0.68rem", color: "#bbb" }}>
                Tap any preset above or use + Custom to add amounts
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <AnimatePresence>
                {amounts
                  .slice()
                  .sort((a, b) => a.value - b.value)
                  .map((amount, i) => {
                    const isDefault = defaultAmount === amount.value;
                    return (
                      <motion.div
                        key={amount.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: i * 0.04 }}
                        style={{
                          background: isDefault
                            ? "linear-gradient(135deg,rgba(201,162,39,0.08),rgba(169,119,28,0.04))"
                            : "#fff",
                          border: isDefault
                            ? "2px solid rgba(201,162,39,0.4)"
                            : "1px solid rgba(169,126,39,0.13)",
                          borderRadius: 16,
                          padding: "14px 16px",
                          display: "flex", alignItems: "center", gap: 14,
                          boxShadow: "0 3px 12px rgba(133,104,74,0.06)",
                        }}
                      >
                        {/* Amount icon */}
                        <div style={{
                          width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                          background: isDefault
                            ? "linear-gradient(135deg,#c9a227,#a9771c)"
                            : "linear-gradient(135deg,#fff1cd,#edce8a)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "1rem", fontWeight: 900,
                          color: isDefault ? "#fff" : "#8c6518",
                        }}>
                          ₹
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#3e2b16" }}>
                            ₹{fmt(amount.value)}
                          </div>
                          <div style={{ fontSize: "0.62rem", color: "#a9771c", marginTop: 1 }}>
                            {amount.label || `₹${fmt(amount.value)}`}
                            {isDefault && (
                              <span style={{
                                marginLeft: 6, background: "#c9a227", color: "#fff",
                                borderRadius: 999, padding: "1px 7px",
                                fontSize: "0.55rem", fontWeight: 800,
                              }}>DEFAULT</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          {!isDefault && (
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setDefault(amount)}
                              title="Set as default"
                              style={{
                                height: 32, paddingInline: 10, borderRadius: 8, border: "none",
                                background: "rgba(201,162,39,0.1)",
                                color: "#a9771c", fontWeight: 800, fontSize: "0.6rem",
                                cursor: "pointer", fontFamily: "'Montserrat',sans-serif",
                              }}
                            >
                              Set Default
                            </motion.button>
                          )}
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteAmount(amount)}
                            title="Remove"
                            style={{
                              width: 32, height: 32, borderRadius: 8, border: "none",
                              background: "rgba(192,57,43,0.07)",
                              color: "#c0392b", cursor: "pointer", fontSize: "0.9rem",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            ×
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
