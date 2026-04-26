import React from "react";
import { generateReceiptPDF } from "../../utils/receiptGenerator";
import { formatDisplayDate, getReceiptMeta } from "../../utils/formatters";

export default function PassbookCard({ txn }) {
  const { receiptDate, receiptNumber, installmentNumber, goldRate, grams } = getReceiptMeta(txn);

  const styles = {
    card: {
      background: "linear-gradient(135deg, #2d0033, #4c006b)",
      border: "1px solid #D4AF37",
      borderRadius: "14px",
      padding: "18px",
      marginTop: "15px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: "0 0 18px rgba(212,175,55,0.25)",
      transition: "0.3s",
      animation: "slideUp 0.7s",
    },
    hover: {
      transform: "scale(1.02)",
      boxShadow: "0 0 25px rgba(255,215,0,0.4)",
    },
    left: {
      color: "#fff",
      width: "60%",
    },
    planName: {
      color: "#FFD86B",
      fontSize: "20px",
      fontWeight: "bold",
      marginBottom: "5px",
      textShadow: "0 0 6px rgba(255,215,0,0.4)",
    },
    label: {
      opacity: 0.8,
      fontSize: "13px",
    },
    right: {
      textAlign: "right",
      width: "40%",
    },
    amount: {
      color: "#FFB84D",
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "4px",
    },
    goldRate: { fontSize: "13px", opacity: 0.8 },
    grams: { fontSize: "13px", opacity: 0.8 },
    statusPaid: {
      background: "#00c26e",
      color: "#fff",
      padding: "4px 10px",
      borderRadius: "6px",
      display: "inline-block",
      fontSize: "12px",
      marginTop: "5px",
      fontWeight: "600",
    },
    statusPending: {
      background: "#ffaa00",
      color: "#000",
      padding: "4px 10px",
      borderRadius: "6px",
      display: "inline-block",
      fontSize: "12px",
      marginTop: "5px",
      fontWeight: "600",
    },
    pdfBtn: {
      background: "#FFD86B",
      border: "none",
      padding: "7px 14px",
      borderRadius: "8px",
      marginTop: "8px",
      cursor: "pointer",
      color: "#000",
      fontWeight: "700",
      boxShadow: "0 0 8px rgba(255,215,0,0.6)",
      transition: "0.2s",
    },
  };

  return (
    <div
      style={styles.card}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div style={styles.left}>
        <div style={styles.planName}>{txn.plan_name}</div>
        <p style={styles.label}>Installment #{installmentNumber}</p>
        <p style={styles.label}>Date: {formatDisplayDate(receiptDate)}</p>
        <p style={styles.label}>Receipt: {receiptNumber}</p>

        {txn.status === "completed" ? (
          <span style={styles.statusPaid}>PAID</span>
        ) : (
          <span style={styles.statusPending}>PENDING</span>
        )}
      </div>

      <div style={styles.right}>
        <div style={styles.amount}>Rs {txn.amount}</div>
        <p style={styles.goldRate}>Gold Rate: Rs {goldRate}</p>
        <p style={styles.grams}>Grams Added: {Number(grams || 0).toFixed(3)}</p>

        <button
          style={styles.pdfBtn}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onClick={() => generateReceiptPDF(txn)}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}
