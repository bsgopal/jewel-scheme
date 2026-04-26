import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

// Icons
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

export default function WalletHistory() {
    const userId = localStorage.getItem("userId");
    const API = process.env.REACT_APP_API_URL;

    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetchHistory();
    }, []); // OK

    async function fetchHistory() {
        try {
            const res = await axios.get(`${API}/api/wallet/history/${userId}`);
            setHistory(res.data.history);
        } catch (err) {
            console.error("History Fetch Error", err);
        }
    }

    const glassCard = {
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(18px)",
        borderRadius: "14px",
        padding: "15px",
        border: "1px solid rgba(255,255,255,0.2)",
        marginBottom: "15px",
        color: "white",
        display: "flex",
        alignItems: "center",
        boxShadow: "0 4px 25px rgba(255,215,0,0.25)"
    };

    // Pick icon based on transaction type
    const getIcon = (type) => {
        switch (type) {
            case "add_money":
                return <AddCircleIcon style={{ fontSize: 32, color: "#00ff88" }} />;
            case "convert":
                return <CurrencyExchangeIcon style={{ fontSize: 32, color: "#FFD700" }} />;
            case "wallet_payment":
                return <AccountBalanceWalletIcon style={{ fontSize: 32, color: "#ff4444" }} />;
            default:
                return <AccountBalanceWalletIcon style={{ fontSize: 32 }} />;
        }
    };

    return (
        <div style={{ paddingBottom: "80px" }}>
            <h2 style={{ color: "#FFD700", marginBottom: "15px" }}>Transaction History</h2>

            {history.length === 0 && (
                <p style={{ color: "#ccc", textAlign: "center", marginTop: "30px" }}>
                    No history available.
                </p>
            )}

            {history.map((item, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    style={glassCard}
                >
                    <div style={{ marginRight: "15px" }}>{getIcon(item.type)}</div>

                    <div style={{ flexGrow: 1 }}>
                        <h4 style={{ margin: 0, color: "#FFD700" }}>
                            {item.type === "add_money" && "Money Added"}
                            {item.type === "convert" && "Cash → Gold"}
                            {item.type === "wallet_payment" && "Wallet Payment"}
                        </h4>

                        <p style={{ margin: "5px 0", fontSize: "14px", opacity: 0.9 }}>
                            {new Date(item.created_at).toLocaleString()}
                        </p>

                        {item.gold_grams > 0 && (
                            <p style={{ margin: "5px 0", color: "#00ff88" }}>
                                + {item.gold_grams} g Gold
                            </p>
                        )}
                    </div>

                    <h3
                        style={{
                            margin: 0,
                            color:
                                item.type === "add_money"
                                    ? "#00ff88"
                                    : item.type === "convert"
                                        ? "#FFD700"
                                        : "#ff4444",
                        }}
                    >
                        ₹ {item.amount}
                    </h3>
                </motion.div>
            ))}
        </div>
    );
}
