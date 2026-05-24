import React, { useEffect, useState } from "react";
import axios from "axios";
import { Alert } from "@mui/material";
import { motion } from "framer-motion";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

const pageCard = {
  background: "rgba(255,255,255,0.88)",
  backdropFilter: "blur(18px)",
  borderRadius: 16,
  padding: 18,
  border: "1px solid rgba(169,126,39,0.12)",
  boxShadow: "0 16px 36px rgba(133, 104, 74, 0.08)",
};

export default function WalletHistory() {
  const userId = localStorage.getItem("userId") || "self";
  const token = localStorage.getItem("token");
  const API = process.env.REACT_APP_API_URL;

  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      setError("");
      const res = await axios.get(`${API}/api/wallet/history/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const items = Array.isArray(res.data) ? res.data : res.data?.history || [];
      setHistory(items);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load Digi Gold history.");
      setHistory([]);
    }
  }

  const getMeta = (item) => {
    switch (item.type) {
      case "credit":
        return { title: "Money Added", color: "#2d8a52", icon: <AddCircleIcon style={{ fontSize: 30, color: "#2d8a52" }} /> };
      case "convert":
        return { title: "Cash to Digi Gold", color: "#b88324", icon: <CurrencyExchangeIcon style={{ fontSize: 30, color: "#b88324" }} /> };
      case "wallet_payment":
        return { title: "Scheme Paid From Digi Gold", color: "#a33a2b", icon: <ReceiptLongIcon style={{ fontSize: 30, color: "#a33a2b" }} /> };
      default:
        return { title: "Transaction", color: "#7a5a28", icon: <AccountBalanceWalletIcon style={{ fontSize: 30, color: "#7a5a28" }} /> };
    }
  };

  return (
    <div style={{ paddingBottom: "80px", display: "grid", gap: 14 }}>
      <div style={pageCard}>
        <h2 style={{ color: "#4b3519", margin: 0 }}>Digi Gold Transaction History</h2>
        <p style={{ color: "#8a6b49", margin: "8px 0 0" }}>
          Every top-up, conversion, and scheme payment made using Digi Gold is shown here.
        </p>
      </div>

      {error && <Alert severity="error" sx={{ borderRadius: "14px" }}>{error}</Alert>}

      {!error && history.length === 0 && (
        <div style={{ ...pageCard, textAlign: "center" }}>
          <p style={{ color: "#8a6b49", margin: 0 }}>No Digi Gold history available yet.</p>
        </div>
      )}

      {history.map((item, index) => {
        const meta = getMeta(item);
        return (
          <motion.div
            key={item.id || index}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
            style={pageCard}
          >
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,244,218,0.9)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                {meta.icon}
              </div>

              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, color: meta.color, fontSize: 16 }}>{meta.title}</h4>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#85684a" }}>
                  {new Date(item.created_at).toLocaleString("en-IN")}
                </p>
                {item.remarks && (
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6f5334" }}>{item.remarks}</p>
                )}
                {Number(item.gold || 0) > 0 && (
                  <p style={{ margin: "6px 0 0", color: "#2d8a52", fontWeight: 700 }}>
                    {Number(item.gold).toFixed(4)} g added
                  </p>
                )}
              </div>

              <div style={{ textAlign: "right" }}>
                <h3 style={{ margin: 0, color: meta.color, fontSize: 20 }}>
                  Rs {Number(item.amount || 0).toLocaleString("en-IN")}
                </h3>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#8a6b49" }}>
                  Cash: Rs {Number(item.balance_after?.cash || 0).toLocaleString("en-IN")}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#8a6b49" }}>
                  Gold: {Number(item.balance_after?.gold || 0).toFixed(4)} g
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
