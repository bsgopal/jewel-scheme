import React, { useEffect, useState } from "react";
import axios from "axios";
import PassbookCard from "./PassbookCard";
import InstallmentPayPopup from "./InstallmentPayPopUp";

const cardStyle = {
  background: "rgba(255,255,255,0.88)",
  backdropFilter: "blur(18px)",
  borderRadius: "16px",
  padding: "18px",
  marginTop: "18px",
  boxShadow: "0 16px 36px rgba(133, 104, 74, 0.08)",
  border: "1px solid rgba(169,126,39,0.12)",
};

export default function PlanTab({ userId }) {
  const token = localStorage.getItem("token");
  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [plans, setPlans] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayPopup, setShowPayPopup] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      setError("");
      const res = await axios.get(`${API}/api/payments/user/self`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "x-user-id": userId,
        },
      });

      if (res.data.success) {
        const normalizedPlans = (res.data.plans || []).map((plan) => ({
          ...plan,
          installments: {
            paid: plan.payments?.length || 0,
            total_inst: plan.payments?.length || 0,
            pending: 0,
          },
        }));
        setPlans(normalizedPlans);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load Digi Gold linked plans.");
    }
  }

  function getNextInstallmentAmount(plan) {
    if (!plan.payments || plan.payments.length === 0) {
      return plan.default_amount || 0;
    }
    return plan.payments[plan.payments.length - 1].amount;
  }

  function handlePayClick(plan) {
    setSelectedPlan(plan);
    setShowPayPopup(true);
  }

  return (
    <div style={{ paddingBottom: "90px" }}>
      <div style={cardStyle}>
        <h2 style={{ color: "#4b3519", margin: 0 }}>Plans Linked With Digi Gold</h2>
        <p style={{ color: "#8a6b49", margin: "8px 0 0" }}>
          Review plan payments and use your Digi Gold balance to support installment payments.
        </p>
      </div>

      {error && (
        <div style={{ ...cardStyle, color: "#a33a2b" }}>{error}</div>
      )}

      {!error && plans.map((plan, idx) => {
        const nextAmount = getNextInstallmentAmount(plan);

        return (
          <div key={idx} style={cardStyle}>
            <div
              style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}
              onClick={() => setExpanded(expanded === idx ? null : idx)}
            >
              <h3 style={{ color: "#7a5a28", margin: 0 }}>{plan.plan_name}</h3>
              <span style={{ color: "#7a5a28" }}>{expanded === idx ? "▲" : "▼"}</span>
            </div>

            <p style={{ marginTop: "8px", color: "#8a6b49" }}>
              Total recorded payments: {plan.payments?.length || 0}
            </p>

            {nextAmount > 0 && (
              <div style={{ marginTop: "10px", padding: "12px", borderRadius: "14px", background: "#fffaf5", color: "#3e2b16", border: "1px solid rgba(169,126,39,0.18)" }}>
                <p style={{ margin: 0 }}>
                  Suggested payment from Digi Gold: <b>Rs {Number(nextAmount || 0).toLocaleString("en-IN")}</b>
                </p>

                <button
                  onClick={() => handlePayClick(plan)}
                  style={{ marginTop: "10px", width: "100%", padding: "10px", background: "#c89b3c", color: "#fff", fontWeight: "bold", borderRadius: "10px", border: "none", fontSize: "16px" }}
                >
                  Pay With Digi Gold
                </button>
              </div>
            )}

            {expanded === idx && (
              <div style={{ marginTop: "15px" }}>
                {plan.payments?.map((txn, i) => (
                  <PassbookCard key={i} txn={{ ...txn, plan_name: plan.plan_name }} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {!error && plans.length === 0 && (
        <div style={cardStyle}>
          <p style={{ color: "#8a6b49", margin: 0 }}>No plan payment history available yet.</p>
        </div>
      )}

      {showPayPopup && (
        <InstallmentPayPopup
          plan={selectedPlan}
          userId={userId}
          onClose={() => setShowPayPopup(false)}
          refresh={fetchPlans}
        />
      )}
    </div>
  );
}
