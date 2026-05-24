import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CircularProgress, Alert } from "@mui/material";
import { getStoredRole, isAdminLike } from "../../utils/permissions";

const API = process.env.REACT_APP_API_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

// ── Stat chip ─────────────────────────────────────────────────────────────────
function Stat({ label, value, sub, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: accent ? "linear-gradient(135deg,#c9a227,#a9771c)" : "#fff",
        border: accent ? "none" : "1px solid rgba(169,126,39,0.15)",
        borderRadius: 18,
        padding: "18px 20px",
        boxShadow: accent
          ? "0 8px 28px rgba(169,119,28,0.28)"
          : "0 4px 16px rgba(133,104,74,0.07)",
      }}
    >
      <div style={{
        fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.18em",
        color: accent ? "rgba(255,255,255,0.7)" : "#a9771c",
        textTransform: "uppercase", marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{ fontSize: "1.9rem", fontWeight: 900, color: accent ? "#fff" : "#3e2b16", lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: "0.65rem", marginTop: 4, color: accent ? "rgba(255,255,255,0.65)" : "#a9771c" }}>
          {sub}
        </div>
      )}
    </motion.div>
  );
}

// ── Installment card ──────────────────────────────────────────────────────────
function InstCard({ item, onCollect, idx, selected, onToggle }) {
  const overdueDays = item.nextDueDate
    ? Math.max(0, Math.floor((new Date() - new Date(item.nextDueDate)) / 86400000))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.05 }}
      style={{
        background: "#fff",
        border: selected
          ? "1.5px solid rgba(201,162,39,0.5)"
          : overdueDays > 0
            ? "1.5px solid rgba(192,57,43,0.25)"
            : "1px solid rgba(169,126,39,0.13)",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: selected
          ? "0 4px 18px rgba(169,119,28,0.15)"
          : "0 4px 18px rgba(133,104,74,0.07)",
        transition: "border 0.15s, box-shadow 0.15s",
      }}
    >
      {/* top strip */}
      <div style={{
        background: overdueDays > 0
          ? "linear-gradient(90deg,rgba(192,57,43,0.08),transparent)"
          : "linear-gradient(90deg,rgba(169,118,28,0.06),transparent)",
        padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(169,126,39,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

          {/* Checkbox */}
          <div
            onClick={() => onToggle(item.schemeId)}
            style={{
              width: 24, height: 24, borderRadius: 7, flexShrink: 0,
              border: selected ? "none" : "1.5px solid rgba(169,126,39,0.3)",
              background: selected
                ? "linear-gradient(135deg,#c9a227,#a9771c)"
                : "rgba(255,255,255,0.8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s",
              boxShadow: selected ? "0 2px 8px rgba(169,119,28,0.3)" : "none",
            }}
          >
            {selected && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>

          {/* avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 13, flexShrink: 0,
              background: "linear-gradient(135deg,#fff1cd,#edce8a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1rem", fontWeight: 900, color: "#8c6518",
            }}>
              {item.customerName?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#3e2b16" }}>
                {item.customerName}
              </div>
              <div style={{ fontSize: "0.62rem", color: "#a9771c", marginTop: 1 }}>
                {item.phone || item.customerId || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* overdue badge */}
        {overdueDays > 0 && (
          <div style={{
            background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.2)",
            borderRadius: 999, padding: "3px 10px",
            fontSize: "0.6rem", fontWeight: 800, color: "#c0392b",
          }}>
            {overdueDays}d overdue
          </div>
        )}
      </div>

      {/* body */}
      <div style={{
        padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: "0.6rem", color: "#a9771c", fontWeight: 700, letterSpacing: "0.1em" }}>PLAN</div>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#3e2b16", marginTop: 2 }}>
            {item.planName}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.6rem", color: "#a9771c", fontWeight: 700, letterSpacing: "0.1em" }}>DUE AMOUNT</div>
          <div style={{
            fontSize: "1.3rem", fontWeight: 900,
            color: overdueDays > 0 ? "#c0392b" : "#3e2b16", marginTop: 2,
          }}>
            ₹{fmt(item.amount)}
          </div>
        </div>
      </div>

      {/* action strip */}
      <div style={{ padding: "0 18px 14px", display: "flex", gap: 10 }}>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onCollect(item)}
          style={{
            flex: 1, height: 40, borderRadius: 12, border: "none",
            background: "linear-gradient(135deg,#c9a227,#a9771c)",
            color: "#fff", fontWeight: 800, fontSize: "0.75rem",
            cursor: "pointer", fontFamily: "'Montserrat',sans-serif",
            boxShadow: "0 4px 12px rgba(169,119,28,0.28)",
          }}
        >
          💰 Collect ₹{fmt(item.amount)}
        </motion.button>

        {/* Single WhatsApp — hides when card is selected for bulk */}
        {!selected && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              if (!item.phone) return alert("No phone number for this customer");
              const msg = `Hi ${item.customerName}, your gold scheme installment of ₹${fmt(item.amount)} for plan "${item.planName}" is due. Please make the payment to continue enjoying benefits. - Renic Tech`;
              window.open(`https://wa.me/91${item.phone}?text=${encodeURIComponent(msg)}`, "_blank");
            }}
            style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              border: "1px solid rgba(37,211,102,0.3)",
              background: "rgba(37,211,102,0.08)",
              color: "#25d366", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#25d366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.528 5.845L.057 23.5l5.797-1.523A11.956 11.956 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.812 9.812 0 01-5.002-1.368l-.359-.214-3.717.976.993-3.63-.234-.374A9.818 9.818 0 012.182 12C2.182 6.573 6.573 2.182 12 2.182S21.818 6.573 21.818 12 17.427 21.818 12 21.818z" />
            </svg>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AgentDashboard() {
  const navigate = useNavigate();
  const role = getStoredRole();
  const canSeeAllAgentActions = isAdminLike(role);
  const handleLogout = () => {
    localStorage.clear();
    delete axios.defaults.headers.common.Authorization;
    window.location.replace("/");
  };

  const [stats,      setStats]      = useState(null);
  const [pending,    setPending]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [tab,        setTab]        = useState("today");
  const [greeting,   setGreeting]   = useState("");
  const [selected,   setSelected]   = useState(new Set());
  const [sendResult, setSendResult] = useState(null);

  // ── Bulk queue state ──────────────────────────────────────────────────────
  const [bulkQueue,   setBulkQueue]   = useState([]);
  const [bulkIndex,   setBulkIndex]   = useState(0);
  const [bulkSkipped, setBulkSkipped] = useState(0);
  const [bulkSent,    setBulkSent]    = useState(0);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");

    const fetchData = async () => {
      try {
        const [sRes, pRes] = await Promise.all([
          axios.get(`${API}/api/agent/dashboard`,            { headers: headers() }),
          axios.get(`${API}/api/agent/pending-installments`, { headers: headers() }),
        ]);
        setStats(sRes.data.data);
        setPending(pRes.data.data || []);
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const todayStart = today();

  const todayPending   = pending.filter(i => {
    const d = new Date(i.nextDueDate);
    return d >= todayStart && d < new Date(todayStart.getTime() + 86400000);
  });
  const overduePending = pending.filter(i => new Date(i.nextDueDate) < todayStart);
  const allPending     = pending;

  const tabData = tab === "today" ? todayPending : tab === "overdue" ? overduePending : allPending;

  // Reset selection when tab changes
  useEffect(() => { setSelected(new Set()); }, [tab]);

  const toggleSelect = (schemeId) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(schemeId) ? next.delete(schemeId) : next.add(schemeId);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(
      selected.size === tabData.length
        ? new Set()
        : new Set(tabData.map(i => i.schemeId))
    );
  };

  // ── Start bulk queue (no loop, no popup blocker issue) ────────────────────
  const handleBulkWhatsApp = () => {
    const targets   = tabData.filter(i => selected.has(i.schemeId));
    const withPhone = targets.filter(i => i.phone);
    const noPhone   = targets.filter(i => !i.phone);

    if (withPhone.length === 0) {
      setSendResult({ sent: 0, skipped: noPhone.length });
      setTimeout(() => setSendResult(null), 4000);
      setSelected(new Set());
      return;
    }

    setSelected(new Set());
    setBulkQueue(withPhone);
    setBulkIndex(0);
    setBulkSent(0);
    setBulkSkipped(noPhone.length);
  };

  // ── Called when agent taps "Open WhatsApp" for current item in queue ──────
  const handleQueueSend = () => {
    const item = bulkQueue[bulkIndex];
    const msg  = `Hi ${item.customerName}, your gold scheme installment of ₹${fmt(item.amount)} for plan "${item.planName}" is due. Please make the payment to continue enjoying benefits. - Renic Tech`;
    window.open(`https://wa.me/91${item.phone}?text=${encodeURIComponent(msg)}`, "_blank");

    const newSent = bulkSent + 1;
    setBulkSent(newSent);

    if (bulkIndex + 1 >= bulkQueue.length) {
      // done
      setBulkQueue([]);
      setSendResult({ sent: newSent, skipped: bulkSkipped });
      setTimeout(() => setSendResult(null), 4000);
    } else {
      setBulkIndex(i => i + 1);
    }
  };

  // ── Called when agent taps "Skip" ─────────────────────────────────────────
  const handleQueueSkip = () => {
    const newSkipped = bulkSkipped + 1;
    setBulkSkipped(newSkipped);

    if (bulkIndex + 1 >= bulkQueue.length) {
      setBulkQueue([]);
      setSendResult({ sent: bulkSent, skipped: newSkipped });
      setTimeout(() => setSendResult(null), 4000);
    } else {
      setBulkIndex(i => i + 1);
    }
  };

  // ── Cancel entire queue ───────────────────────────────────────────────────
  const handleQueueCancel = () => {
    setSendResult({ sent: bulkSent, skipped: bulkSkipped + (bulkQueue.length - bulkIndex) });
    setBulkQueue([]);
    setTimeout(() => setSendResult(null), 4000);
  };

  const handleCollect = (item) => {
    navigate("/agent/collect-installment", {
      state: {
        customerId:    item.customerId,
        customerName:  item.customerName,
        planName:      item.planName,
        pendingAmount: item.amount,
        schemeId:      item.schemeId,
        backTo:        "/agent-dashboard",
      },
    });
  };

  if (loading) return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "linear-gradient(180deg,#fffdf8,#fff4df)",
    }}>
      <CircularProgress sx={{ color: "#a9771c" }} />
    </div>
  );

  if (error) return (
    <div style={{ padding: 20 }}>
      <Alert severity="error">{error}</Alert>
    </div>
  );

  const queueActive = bulkQueue.length > 0 && bulkIndex < bulkQueue.length;
  const currentItem = queueActive ? bulkQueue[bulkIndex] : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg,#fffdf8 0%,#fff4df 100%)",
      fontFamily: "'Montserrat',sans-serif",
      paddingBottom: queueActive ? 220 : 40, // extra space so queue drawer doesn't hide content
    }}>

      {/* ── Hero header ── */}
      <div style={{
        background: "linear-gradient(135deg,#c9a227 0%,#7a5210 100%)",
        padding: "28px 20px 36px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -40, right: -40, width: 160, height: 160,
          borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -30, left: "40%", width: 100, height: 100,
          borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none",
        }} />

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate("/Home")}
          style={{
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 10, padding: "6px 14px 6px 10px", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
            color: "#fff", fontSize: "0.72rem", fontWeight: 700,
            fontFamily: "'Montserrat',sans-serif", marginBottom: 20,
          }}
        >
          ← Home
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          style={{
            position: "absolute", top: 28, right: 20,
            background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)",
            borderRadius: 10, padding: "7px 14px", cursor: "pointer",
            color: "#fff", fontSize: "0.72rem", fontWeight: 800,
            fontFamily: "'Montserrat',sans-serif",
          }}
        >
          Logout
        </motion.button>

        <div style={{
          fontSize: "0.65rem", color: "rgba(255,255,255,0.6)",
          letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4,
        }}>
          {greeting}
        </div>
        <div style={{
          fontSize: "1.5rem", fontWeight: 900, color: "#fff",
          fontFamily: "'Playfair Display',serif", lineHeight: 1.1, marginBottom: 6,
        }}>
          Agent Desk
        </div>
        <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.55)" }}>
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
          {[
            { label: "My Customers", route: "/agent/customers" },
            ...(canSeeAllAgentActions ? [{ label: "Manage Amounts", route: "/agent/manage-amounts" }] : []),
            ...(canSeeAllAgentActions ? [{ label: "Payment History", route: "/payment-history" }] : []),
          ].map(a => (
            <motion.button
              key={a.label}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(a.route)}
              style={{
                height: 34, paddingInline: 14, borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.12)",
                color: "#fff", fontSize: "0.68rem", fontWeight: 700,
                cursor: "pointer", fontFamily: "'Montserrat',sans-serif",
              }}
            >
              {a.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ padding: "0 16px", marginTop: -18 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          gap: 12,
        }}>
          <Stat label="Assigned Customers" value={stats?.totalCustomers || 0} accent />
          <Stat label="Today's Dues"       value={todayPending.length}
            sub={todayPending.length > 0
              ? `₹${fmt(todayPending.reduce((s, i) => s + (i.amount || 0), 0))} total`
              : "All clear"} />
          <Stat label="Overdue"            value={overduePending.length}
            sub={overduePending.length > 0 ? "Needs attention" : "None"} />
          <Stat label="Today Collection"   value={`₹${fmt(stats?.todayCollectionAmount)}`} />
        </div>
      </div>

      {/* ── Collection section ── */}
      <div style={{ padding: "24px 16px 0" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{
            fontSize: "1rem", fontWeight: 800, color: "#3e2b16",
            fontFamily: "'Playfair Display',serif",
          }}>
            Pending Collections
          </div>
          <div style={{
            background: pending.length > 0 ? "rgba(169,118,28,0.1)" : "rgba(39,174,96,0.1)",
            border: `1px solid ${pending.length > 0 ? "rgba(169,118,28,0.2)" : "rgba(39,174,96,0.2)"}`,
            borderRadius: 999, padding: "3px 12px",
            fontSize: "0.62rem", fontWeight: 800,
            color: pending.length > 0 ? "#a9771c" : "#27ae60",
          }}>
            {pending.length} total
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 16,
          background: "#fff", borderRadius: 14, padding: 4,
          border: "1px solid rgba(169,126,39,0.12)",
          boxShadow: "0 2px 8px rgba(133,104,74,0.06)",
        }}>
          {[
            { key: "today",   label: `Today (${todayPending.length})` },
            { key: "overdue", label: `Overdue (${overduePending.length})` },
            { key: "all",     label: `All (${allPending.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, height: 36, borderRadius: 10, border: "none",
                background: tab === t.key
                  ? "linear-gradient(135deg,#c9a227,#a9771c)"
                  : "transparent",
                color: tab === t.key ? "#fff" : "#8a6b49",
                fontWeight: 800, fontSize: "0.7rem",
                cursor: "pointer", fontFamily: "'Montserrat',sans-serif",
                transition: "all 0.2s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Bulk action bar ── */}
        {tabData.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#fff", borderRadius: 14, padding: "10px 14px",
            border: "1px solid rgba(169,126,39,0.12)",
            marginBottom: 12,
            boxShadow: "0 2px 8px rgba(133,104,74,0.06)",
          }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
              onClick={toggleAll}
            >
              <div style={{
                width: 24, height: 24, borderRadius: 7,
                border: selected.size === tabData.length
                  ? "none" : "1.5px solid rgba(169,126,39,0.3)",
                background: selected.size === tabData.length
                  ? "linear-gradient(135deg,#c9a227,#a9771c)" : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
                boxShadow: selected.size === tabData.length
                  ? "0 2px 8px rgba(169,119,28,0.3)" : "none",
              }}>
                {selected.size === tabData.length && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8a6b49" }}>
                {selected.size > 0
                  ? `${selected.size} of ${tabData.length} selected`
                  : "Select all"}
              </span>
            </div>

            <AnimatePresence>
              {selected.size > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBulkWhatsApp}
                  style={{
                    height: 36, paddingInline: 16, borderRadius: 10,
                    border: "1px solid rgba(37,211,102,0.3)",
                    background: "rgba(37,211,102,0.1)",
                    color: "#25d366", fontWeight: 800, fontSize: "0.72rem",
                    cursor: "pointer", fontFamily: "'Montserrat',sans-serif",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#25d366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.528 5.845L.057 23.5l5.797-1.523A11.956 11.956 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.812 9.812 0 01-5.002-1.368l-.359-.214-3.717.976.993-3.63-.234-.374A9.818 9.818 0 012.182 12C2.182 6.573 6.573 2.182 12 2.182S21.818 6.573 21.818 12 17.427 21.818 12 21.818z" />
                  </svg>
                  Send to {selected.size} via WhatsApp
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Result toast ── */}
        <AnimatePresence>
          {sendResult && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                background: "rgba(39,174,96,0.08)",
                border: "1px solid rgba(39,174,96,0.2)",
                borderRadius: 12, padding: "12px 16px", marginBottom: 12,
                fontSize: "0.75rem", fontWeight: 700, color: "#27ae60",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              <span>
                ✅ Sent to {sendResult.sent} customer{sendResult.sent !== 1 ? "s" : ""}
                {sendResult.skipped > 0 && (
                  <span style={{ color: "#e67e22", marginLeft: 8 }}>
                    · {sendResult.skipped} skipped
                  </span>
                )}
              </span>
              <span
                onClick={() => setSendResult(null)}
                style={{ cursor: "pointer", fontSize: "1rem", color: "#999", marginLeft: 12 }}
              >×</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Cards ── */}
        <AnimatePresence mode="wait">
          {tabData.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                textAlign: "center", padding: "44px 20px",
                background: "#fff", borderRadius: 20,
                border: "2px dashed rgba(169,118,28,0.15)",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 10 }}>
                {tab === "overdue" ? "✅" : "🎉"}
              </div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#8a6b49", marginBottom: 6 }}>
                {tab === "overdue" ? "No overdue installments" : "No pending collections for today"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#bbb" }}>
                {tab === "today" ? "Check 'All' tab for upcoming dues" : "Great work!"}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={tab}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {tabData.map((item, i) => (
                <InstCard
                  key={item.schemeId}
                  item={item}
                  onCollect={handleCollect}
                  idx={i}
                  selected={selected.has(item.schemeId)}
                  onToggle={toggleSelect}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Commission card ── */}
      {(stats?.totalCommission > 0 || stats?.commissionRate > 0) && (
        <div style={{ padding: "20px 16px 0" }}>
          <div style={{
            background: "linear-gradient(135deg,#3e2b16,#5c3d1e)",
            borderRadius: 20, padding: "18px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 8px 28px rgba(62,43,22,0.2)",
          }}>
            <div>
              <div style={{
                fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.18em",
                color: "rgba(201,162,39,0.7)", textTransform: "uppercase", marginBottom: 4,
              }}>
                Your Commission
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#c9a227" }}>
                ₹{fmt(stats?.totalCommission)}
              </div>
              <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
                @ {stats?.commissionRate || 0}% rate · this month
              </div>
            </div>
            <div style={{ fontSize: "2.5rem" }}>💎</div>
          </div>
        </div>
      )}

      {/* ── Bulk Queue Drawer (fixed bottom) ── */}
      <AnimatePresence>
        {queueActive && (
          <motion.div
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999,
              background: "#fff",
              borderTop: "2px solid rgba(37,211,102,0.25)",
              borderRadius: "24px 24px 0 0",
              padding: "20px 20px 32px",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
            }}
          >
            {/* Header row */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", marginBottom: 14,
            }}>
              <div>
                <div style={{
                  fontSize: "0.6rem", fontWeight: 800, color: "#25d366",
                  letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 2,
                }}>
                  WhatsApp Reminders
                </div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#3e2b16" }}>
                  {bulkIndex + 1} of {bulkQueue.length} customers
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleQueueCancel}
                style={{
                  height: 32, paddingInline: 12, borderRadius: 8,
                  border: "1px solid rgba(192,57,43,0.2)",
                  background: "rgba(192,57,43,0.06)",
                  color: "#c0392b", fontWeight: 700, fontSize: "0.65rem",
                  cursor: "pointer", fontFamily: "'Montserrat',sans-serif",
                }}
              >
                Cancel all
              </motion.button>
            </div>

            {/* Progress bar */}
            <div style={{
              height: 5, background: "rgba(37,211,102,0.12)",
              borderRadius: 999, marginBottom: 16, overflow: "hidden",
            }}>
              <motion.div
                animate={{ width: `${(bulkIndex / bulkQueue.length) * 100}%` }}
                transition={{ duration: 0.3 }}
                style={{ height: "100%", background: "#25d366", borderRadius: 999 }}
              />
            </div>

            {/* Current customer card */}
            <div style={{
              background: "rgba(37,211,102,0.04)",
              border: "1px solid rgba(37,211,102,0.15)",
              borderRadius: 16, padding: "14px 16px", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                background: "linear-gradient(135deg,#fff1cd,#edce8a)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.1rem", fontWeight: 900, color: "#8c6518",
              }}>
                {currentItem?.customerName?.charAt(0)?.toUpperCase() || "C"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#3e2b16" }}>
                  {currentItem?.customerName}
                </div>
                <div style={{ fontSize: "0.65rem", color: "#a9771c", marginTop: 3 }}>
                  {currentItem?.planName} · ₹{fmt(currentItem?.amount)} due
                </div>
                <div style={{ fontSize: "0.62rem", color: "#8a6b49", marginTop: 1 }}>
                  +91 {currentItem?.phone}
                </div>
              </div>
              {/* Up next preview */}
              {bulkIndex + 1 < bulkQueue.length && (
                <div style={{
                  textAlign: "right", fontSize: "0.6rem",
                  color: "#bbb", lineHeight: 1.5,
                }}>
                  <div>Next:</div>
                  <div style={{ color: "#a9771c", fontWeight: 700 }}>
                    {bulkQueue[bulkIndex + 1]?.customerName}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleQueueSkip}
                style={{
                  flex: 1, height: 50, borderRadius: 14,
                  border: "1.5px solid rgba(169,126,39,0.2)",
                  background: "transparent", color: "#8a6b49",
                  fontWeight: 700, fontSize: "0.78rem",
                  cursor: "pointer", fontFamily: "'Montserrat',sans-serif",
                }}
              >
                Skip →
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleQueueSend}
                style={{
                  flex: 3, height: 50, borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg,#25d366,#128c4a)",
                  color: "#fff", fontWeight: 800, fontSize: "0.85rem",
                  cursor: "pointer", fontFamily: "'Montserrat',sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  boxShadow: "0 6px 20px rgba(37,211,102,0.3)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.528 5.845L.057 23.5l5.797-1.523A11.956 11.956 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.812 9.812 0 01-5.002-1.368l-.359-.214-3.717.976.993-3.63-.234-.374A9.818 9.818 0 012.182 12C2.182 6.573 6.573 2.182 12 2.182S21.818 6.573 21.818 12 17.427 21.818 12 21.818z" />
                </svg>
                Open WhatsApp
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
