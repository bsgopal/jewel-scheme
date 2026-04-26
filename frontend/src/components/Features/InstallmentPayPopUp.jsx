import { useEffect, useState } from "react";
import axios from "axios";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

export default function InstallmentPayPopup({ plan, userId, onClose, refresh }) {
  const API = process.env.REACT_APP_API_URL;
  const [snack, setSnack] = useState({ open: false, msg: "", type: "success" });
  const [wallet, setWallet] = useState(0);
  const [goldRate, setGoldRate] = useState(0);

  const amount = plan?.payments?.length > 0 ? Number(plan.payments[plan.payments.length - 1].amount || 0) : 0;
  const schemeId = plan?.scheme_id || plan?.id;

  useEffect(() => {
    async function init() {
      try {
        const [walletRes, rateRes] = await Promise.all([
          axios.get(`${API}/api/wallet/${userId}`),
          axios.get(`${API}/api/gold-rate/current`),
        ]);
        setWallet(walletRes.data.balance || 0);
        setGoldRate(rateRes.data?.data?.gold22K || 0);
      } catch (error) {
        setWallet(0);
        setGoldRate(0);
      }
    }

    init();
  }, [API, userId]);

  async function payInstallment() {
    try {
      await axios.post(`${API}/api/wallet/pay-installment`, {
        userId,
        schemeId,
        amount,
      });

      setSnack({ open: true, msg: "Installment paid successfully.", type: "success" });
      refresh();
      onClose();
    } catch (error) {
      setSnack({
        open: true,
        msg: error?.response?.data?.message || "Payment failed",
        type: "error",
      });
    }
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2000,
        }}
      >
        <div
          style={{
            width: "90%",
            maxWidth: 420,
            padding: 24,
            borderRadius: 22,
            background: "rgba(255,255,255,0.96)",
            border: "1px solid rgba(169,126,39,0.14)",
            color: "#3e2b16",
          }}
        >
          <h2 style={{ color: "#7a5a28", marginTop: 0 }}>Pay Installment</h2>

          <p>Amount: <b>Rs {amount}</b></p>
          <p>Wallet Balance: <b>Rs {wallet}</b></p>
          <p style={{ color: "#2d8a52" }}>Gold Credit: {goldRate ? (amount / goldRate).toFixed(4) : "0.0000"} g</p>

          <button
            onClick={payInstallment}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "15px",
              borderRadius: "12px",
              background: "#c89b3c",
              color: "#fff",
              fontWeight: "bold",
              border: "none",
            }}
          >
            Pay Now
          </button>

          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "10px",
              borderRadius: "12px",
              background: "transparent",
              border: "1px solid rgba(169,126,39,0.2)",
              color: "#6f5334",
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <MuiAlert severity={snack.type}>{snack.msg}</MuiAlert>
      </Snackbar>
    </>
  );
}
