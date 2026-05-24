import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Snackbar, Alert } from "@mui/material";
import { motion } from "framer-motion";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import HistoryIcon from "@mui/icons-material/History";
import CurrencyBitcoinIcon from "@mui/icons-material/CurrencyBitcoin";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import WalletHistory from "./WalletHistory";
import GoldChart from "./GoldChart";
import PlanTab from "./PlanTab";
import EnhancedHeader from "../common/EnhancedHeader";

const easeInOutCubic = [0.4, 0, 0.2, 1];

export default function Wallet() {
  const userId = localStorage.getItem("userId") || "self";
  const token = localStorage.getItem("token");
  const API = process.env.REACT_APP_API_URL;
  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const [walletBalance, setWalletBalance] = useState(0);
  const [goldBalance, setGoldBalance] = useState(0);
  const [goldRate, setGoldRate] = useState(0);
  const [activeTab, setActiveTab] = useState("summary");
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [amount, setAmount] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "", type: "success" });

  useEffect(() => {
    document.body.style.overflow = showAddMoney || showConvert ? "hidden" : "auto";
  }, [showAddMoney, showConvert]);

  const fetchGoldRate = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/gold-rate/current`);
      const rate = Number(res.data?.data?.gold22K || 0);
      if (rate > 0) {
        setGoldRate(rate);
      } else {
        console.warn('Invalid gold rate received:', res.data);
        setGoldRate(0);
      }
    } catch (error) {
      console.error('Error fetching gold rate:', error);
      setGoldRate(0);
    }
  }, [API]);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/wallet/${userId}`, {
        headers: authHeaders,
      });
      setWalletBalance(Number(res.data?.balance || 0));
      setGoldBalance(Number(res.data?.gold || 0));
    } catch (error) {
      setSnack({
        open: true,
        msg: error.response?.data?.message || "Unable to load Digi Gold balance.",
        type: "error",
      });
    }
  }, [API, authHeaders, userId]);

  useEffect(() => {
    fetchGoldRate();
    fetchWallet();
    
    // Refresh gold rate every 5 minutes
    const goldRateInterval = setInterval(fetchGoldRate, 5 * 60 * 1000);
    
    return () => clearInterval(goldRateInterval);
  }, [fetchGoldRate, fetchWallet]);

  async function handleAddMoney() {
    if (!amount || Number(amount) <= 0) {
      return setSnack({ open: true, msg: "Enter valid amount", type: "error" });
    }

    try {
      const res = await axios.post(`${API}/api/wallet/add`, {
        userId,
        amount: Number(amount),
      }, { headers: authHeaders });

      setWalletBalance(Number(res.data?.balance ?? walletBalance + Number(amount)));
      setGoldBalance(Number(res.data?.gold ?? goldBalance));
      setSnack({ open: true, msg: "Money added to Digi Gold.", type: "success" });
      setShowAddMoney(false);
      setAmount("");
      setTimeout(fetchWallet, 800);
    } catch (error) {
      setSnack({
        open: true,
        msg: error.response?.data?.message || "Unable to add money",
        type: "error",
      });
    }
  }

  async function handleConvert() {
    if (!amount || Number(amount) <= 0) {
      return setSnack({ open: true, msg: "Enter amount", type: "error" });
    }
    if (Number(amount) > Number(walletBalance || 0)) {
      return setSnack({ open: true, msg: "Insufficient Digi Gold cash balance", type: "error" });
    }
    if (!goldRate) {
      return setSnack({ open: true, msg: "Gold rate unavailable", type: "error" });
    }

    try {
      const res = await axios.post(`${API}/api/wallet/convert`, {
        userId,
        amount: Number(amount),
      }, { headers: authHeaders });

      setWalletBalance(Number(res.data?.balance ?? 0));
      setGoldBalance(Number(res.data?.gold ?? 0));
      setSnack({ open: true, msg: "Converted to Digi Gold successfully.", type: "success" });
      setShowConvert(false);
      setAmount("");
      setTimeout(fetchWallet, 800);
    } catch (error) {
      setSnack({
        open: true,
        msg: error.response?.data?.message || "Unable to convert balance",
        type: "error",
      });
    }
  }

  const estimatedValue = Number(goldBalance || 0) * Number(goldRate || 0);

  return (
    <div style={pageStyle}>
      <EnhancedHeader title="Digi Gold Wallet" subtitle="Manage your digital gold savings" showLogo />

      {activeTab === "summary" && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: easeInOutCubic }}
        >
          <motion.div 
            style={glass}
            whileHover={{ boxShadow: '0 24px 48px rgba(133, 104, 74, 0.15)', transition: { duration: 0.15 } }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h3 style={{ color: "#7a5a28", marginTop: 0 }}>Digi Gold Wallet</h3>
                <h1 style={{ color: "#2d8a52", margin: "10px 0 4px" }}>Rs {walletBalance.toLocaleString("en-IN")}</h1>
                <p style={{ color: "#6f5334", margin: 0 }}>Gold balance: {goldBalance.toFixed(4)} g</p>
              </motion.div>
              <motion.div 
                style={{ minWidth: 180, background: "#fffaf5", borderRadius: 14, border: "1px solid rgba(169,126,39,0.16)", padding: 14 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(200, 155, 60, 0.2)' }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "#8a6b49" }}>Live 22K rate</div>
                  <motion.button
                    onClick={fetchGoldRate}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 16,
                      color: "#b88324",
                      padding: 0
                    }}
                    title="Refresh gold rate"
                  >
                    ↻
                  </motion.button>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#4b3519", marginTop: 6 }}>Rs {goldRate.toLocaleString("en-IN")}/g</div>
                <div style={{ fontSize: 12, color: "#8a6b49", marginTop: 8 }}>
                  Gold value: Rs {estimatedValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
              </motion.div>
            </div>

            <motion.div 
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 18 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.04, delayChildren: 0.1 }}
            >
              {[
                { title: "Cash Balance", value: `Rs ${walletBalance.toLocaleString("en-IN")}`, helper: "Available to convert" },
                { title: "Gold Holding", value: `${goldBalance.toFixed(4)} g`, helper: "Accumulated Digi Gold" },
                { title: "Estimated Value", value: `Rs ${estimatedValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, helper: "Based on live rate" }
              ].map((card, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  whileHover={{ y: -6, boxShadow: '0 16px 32px rgba(133, 104, 74, 0.12)', transition: { duration: 0.15 } }}
                  style={{ background: "#fffaf5", borderRadius: 14, border: "1px solid rgba(169,126,39,0.16)", padding: 14, cursor: 'pointer', transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)' }}
                >
                  <div style={{ fontSize: 12, color: "#8a6b49" }}>{card.title}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#4b3519", marginTop: 6 }}>{card.value}</div>
                  <div style={{ fontSize: 12, color: "#8a6b49", marginTop: 6 }}>{card.helper}</div>
                </motion.div>
              ))}
            </motion.div>

            <motion.button 
              style={goldBtn} 
              onClick={() => setShowAddMoney(true)}
              whileHover={{ scale: 1.05, boxShadow: '0 12px 32px rgba(200, 155, 60, 0.25)', transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Add Money
            </motion.button>
            <motion.button 
              style={purpleBtn} 
              onClick={() => setShowConvert(true)}
              whileHover={{ scale: 1.05, boxShadow: '0 12px 32px rgba(169, 126, 39, 0.15)', transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              Convert Cash to Digi Gold
            </motion.button>
          </motion.div>

          <motion.div 
            style={glass}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.25 }}
            whileHover={{ boxShadow: '0 24px 48px rgba(133, 104, 74, 0.15)', transition: { duration: 0.15 } }}
          >
            <h3 style={{ color: "#7a5a28", marginTop: 0 }}>Digi Gold Features</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              {[
                { title: "Live Gold Rate", text: "Conversion uses the latest available 22K gold rate." },
                { title: "Full History", text: "Every top-up, conversion, and scheme payment is tracked." },
                { title: "Plan Support", text: "Use Digi Gold balance to support eligible installment payments." },
                { title: "Growth View", text: "See your monthly gold accumulation in the chart tab." }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 + idx * 0.04 }}
                  whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(133, 104, 74, 0.12)', transition: { duration: 0.15 } }}
                  style={{ background: "#fffdf8", borderRadius: 14, border: "1px solid rgba(169,126,39,0.12)", padding: 14, cursor: 'pointer', transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)' }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#4b3519" }}>{feature.title}</div>
                  <div style={{ fontSize: 13, color: "#8a6b49", marginTop: 6, lineHeight: 1.5 }}>{feature.text}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {activeTab === "history" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <WalletHistory />
        </motion.div>
      )}
      {activeTab === "plans" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <PlanTab userId={userId} />
        </motion.div>
      )}
      {activeTab === "chart" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <GoldChart />
        </motion.div>
      )}

      <Modal open={showAddMoney} onClose={() => setShowAddMoney(false)}>
        <h2 style={modalTitle}>Add Money to Digi Gold</h2>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" style={input} />
        <motion.button 
          style={goldBtn} 
          onClick={handleAddMoney}
          whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
          whileTap={{ scale: 0.95 }}
        >
          Confirm
        </motion.button>
        <motion.button 
          style={cancelBtn} 
          onClick={() => setShowAddMoney(false)}
          whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
          whileTap={{ scale: 0.98 }}
        >
          Cancel
        </motion.button>
      </Modal>

      <Modal open={showConvert} onClose={() => setShowConvert(false)}>
        <h2 style={modalTitle}>Convert Cash to Digi Gold</h2>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" style={input} />
        <p style={{ textAlign: "center", marginTop: 10, color: "#6f5334" }}>
          Gold: {goldRate ? (Number(amount || 0) / goldRate).toFixed(4) : "0.0000"} g
        </p>
        <motion.button 
          style={goldBtn} 
          onClick={handleConvert}
          whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
          whileTap={{ scale: 0.95 }}
        >
          Convert
        </motion.button>
        <motion.button 
          style={cancelBtn} 
          onClick={() => setShowConvert(false)}
          whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
          whileTap={{ scale: 0.98 }}
        >
          Cancel
        </motion.button>
      </Modal>

      <Snackbar open={snack.open} autoHideDuration={3200} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.type}>{snack.msg}</Alert>
      </Snackbar>

      <BottomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={overlay} onClick={onClose}>
      <motion.div 
        style={modal} 
        onClick={(e) => e.stopPropagation()} 
        initial={{ scale: 0.8, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.15, ease: easeInOutCubic }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function BottomTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "summary", icon: <AccountBalanceWalletIcon />, text: "Digi Gold" },
    { id: "history", icon: <HistoryIcon />, text: "History" },
    { id: "plans", icon: <CurrencyBitcoinIcon />, text: "Plans" },
    { id: "chart", icon: <ShowChartIcon />, text: "Chart" },
  ];

  return (
    <div style={bottomTabs}>
      {tabs.map((tab) => (
        <motion.div 
          key={tab.id} 
          onClick={() => setActiveTab(tab.id)} 
          whileHover={{ scale: 1.1, transition: { duration: 0.15 } }}
          whileTap={{ scale: 0.95 }}
          style={{ textAlign: "center", color: activeTab === tab.id ? "#b88324" : "#8a6b49", cursor: "pointer", transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {tab.icon}
          <p style={{ fontSize: 12, margin: "4px 0 0" }}>{tab.text}</p>
        </motion.div>
      ))}
    </div>
  );
}

const pageStyle = {
  padding: "20px",
  minHeight: "100vh",
  background: "linear-gradient(180deg,#fffdf8 0%, #fff4df 100%)",
  color: "#3e2b16",
  paddingBottom: "90px",
};

const header = {
  display: "flex",
  alignItems: "center",
  marginBottom: 15,
};

const backBtn = {
  fontSize: 22,
  cursor: "pointer",
  marginRight: 10,
  color: "#b88324",
};

const title = {
  flex: 1,
  textAlign: "center",
  color: "#4b3519",
};

const glass = {
  background: "rgba(255,255,255,0.88)",
  backdropFilter: "blur(18px)",
  borderRadius: 16,
  padding: 20,
  marginTop: 15,
  border: "1px solid rgba(169,126,39,0.12)",
  boxShadow: "0 16px 36px rgba(133, 104, 74, 0.08)",
};

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000,
};

const modal = {
  width: "100%",
  maxWidth: 380,
  background: "rgba(255,255,255,0.96)",
  backdropFilter: "blur(18px)",
  borderRadius: 20,
  padding: 24,
};

const modalTitle = {
  textAlign: "center",
  color: "#4b3519",
};

const input = {
  width: "100%",
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(169,126,39,0.16)",
  marginTop: 15,
  boxSizing: "border-box",
};

const goldBtn = {
  width: "100%",
  marginTop: 15,
  padding: 12,
  background: "#c89b3c",
  color: "#fff",
  fontWeight: "bold",
  borderRadius: 12,
  border: "none",
  cursor: "pointer",
};

const purpleBtn = {
  ...goldBtn,
  background: "#fff4da",
  color: "#7a5a28",
  border: "1px solid rgba(169,126,39,0.16)",
};

const cancelBtn = {
  width: "100%",
  marginTop: 10,
  padding: 10,
  background: "transparent",
  color: "#6f5334",
  border: "1px solid rgba(169,126,39,0.22)",
  borderRadius: 12,
  cursor: "pointer",
};

const bottomTabs = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  height: 70,
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(15px)",
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  borderTop: "1px solid rgba(169,126,39,0.12)",
};
