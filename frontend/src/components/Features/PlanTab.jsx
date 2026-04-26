import React, { useEffect, useState } from "react";
import axios from "axios";
import PassbookCard from "./PassbookCard";
import InstallmentPayPopup from "./InstallmentPayPopUp";

export default function PlanTab({ userId }) {
    const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

    const [plans, setPlans] = useState([]);
    const [expanded, setExpanded] = useState(null);

    const [selectedPlan, setSelectedPlan] = useState(null); // For popup
    const [showPayPopup, setShowPayPopup] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []); // SAFE because fetchPlans is not re-created

    async function fetchPlans() {
        try {
            const res = await axios.get(`${API}/api/payments/user/self`, {
                headers: { "x-user-id": userId },
            });

            if (res.data.success) {
                setPlans(res.data.plans);
            }
        } catch (err) {
            console.error("Plan load error:", err);
        }
    }

    // Calculate next installment amount
    function getNextInstallmentAmount(plan) {
        if (!plan.payments || plan.payments.length === 0) {
            return plan.default_amount || 0; // fallback if no payments exist yet
        }

        // use the first payment amount (always sorted desc)
        return plan.payments[plan.payments.length - 1].amount;
    }

    function handlePayClick(plan) {
        setSelectedPlan(plan);
        setShowPayPopup(true);
    }

    return (
        <div style={{ paddingBottom: "90px" }}>
            {plans.map((plan, idx) => {
                const nextAmount = getNextInstallmentAmount(plan);
                const nextInstNo = plan.installments.paid + 1;

                return (
                    <div
                        key={idx}
                        style={{
                            background: "rgba(255,255,255,0.08)",
                            backdropFilter: "blur(18px)",
                            borderRadius: "16px",
                            padding: "18px",
                            marginTop: "18px",
                            boxShadow: "0 4px 25px rgba(255,215,0,0.18)",
                            border: "1px solid rgba(255,255,255,0.15)",
                        }}
                    >
                        {/* HEADER */}
                        <div
                            style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}
                            onClick={() => setExpanded(expanded === idx ? null : idx)}
                        >
                            <h3 style={{ color: "#FFD700" }}>{plan.plan_name}</h3>
                            <span style={{ color: "#FFD700" }}>
                                {expanded === idx ? "▲" : "▼"}
                            </span>
                        </div>

                        <p style={{ marginTop: "5px", color: "#bbb" }}>
                            Paid: {plan.installments.paid} / {plan.installments.total_inst}
                        </p>

                        {/* NEXT INSTALLMENT */}
                        {plan.installments.pending > 0 && (
                            <div
                                style={{
                                    marginTop: "10px",
                                    padding: "12px",
                                    borderRadius: "14px",
                                    background: "rgba(0,0,0,0.3)",
                                    color: "white",
                                    border: "1px solid rgba(255,215,0,0.3)",
                                }}
                            >
                                <p>
                                    Next Installment: <b>#{nextInstNo}</b>
                                </p>
                                <p>
                                    Amount: <b>₹ {nextAmount}</b>
                                </p>

                                <button
                                    onClick={() => handlePayClick(plan)}
                                    style={{
                                        marginTop: "10px",
                                        width: "100%",
                                        padding: "10px",
                                        background: "#FFD700",
                                        color: "#4B0082",
                                        fontWeight: "bold",
                                        borderRadius: "10px",
                                        border: "none",
                                        fontSize: "16px",
                                    }}
                                >
                                    Pay with Wallet
                                </button>
                            </div>
                        )}

                        {/* EXPANDED PASSBOOK */}
                        {expanded === idx && (
                            <div style={{ marginTop: "15px" }}>
                                {plan.payments.map((txn, i) => (
                                    <PassbookCard key={i} txn={{ ...txn, plan_name: plan.plan_name }} />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* POPUP TO PAY INSTALLMENT */}
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
