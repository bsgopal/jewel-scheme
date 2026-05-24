import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import { getStoredRole, isAdminLike } from "../../utils/permissions";

const API = process.env.REACT_APP_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const fmt = (value) => Number(value || 0).toLocaleString("en-IN");
const formatDate = (value) => {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function AgentCustomers() {
  const navigate = useNavigate();
  const role = getStoredRole();
  const canManageEverything = isAdminLike(role);

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = () => {
    localStorage.clear();
    delete axios.defaults.headers.common.Authorization;
    window.location.replace("/");
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/api/agent/customers`, { headers: authHeaders() });
        setCustomers(res.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load customers");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) =>
      [
        customer.name,
        customer.phone,
        customer.customerId,
        customer.email,
        ...(customer.assignedSchemes || []).map((scheme) => scheme.schemeName),
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [customers, search]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg,#fffdf8,#fff4df)" }}>
        <CircularProgress sx={{ color: "#a9771c" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#fffdf8 0%,#fff4df 100%)", fontFamily: "'Montserrat',sans-serif", paddingBottom: 40 }}>
      <div style={{ background: "linear-gradient(135deg,#c9a227 0%,#7a5210 100%)", padding: "24px 16px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -30, top: -24, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <button
          onClick={() => navigate("/agent-dashboard")}
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "6px 12px", cursor: "pointer", color: "#fff", fontWeight: 700, marginBottom: 18, position: "relative" }}
        >
          Back
        </button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "relative" }}>
          <div>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.62)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
              My Customers
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff", fontFamily: "'Playfair Display',serif", marginTop: 4 }}>
              {canManageEverything ? "All Scheme Customers" : "Assigned Scheme Customers"}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.24)", borderRadius: 12, padding: "8px 14px", cursor: "pointer", color: "#fff", fontWeight: 800 }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "-14px auto 0", padding: "0 16px" }}>
        <div style={{ background: "#fff", borderRadius: 22, border: "1px solid rgba(169,126,39,0.12)", boxShadow: "0 10px 30px rgba(133,104,74,0.08)", padding: 18 }}>
          <div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by customer, phone, ID, or scheme"
              style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 14, border: "1px solid rgba(169,126,39,0.18)", outline: "none", background: "#fffaf5", color: "#3e2b16", fontFamily: "'Montserrat',sans-serif", fontSize: "0.85rem" }}
            />
          </div>

          {error ? (
            <div style={{ marginTop: 14, borderRadius: 14, padding: "12px 14px", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.2)", color: "#c0392b", fontWeight: 700 }}>
              {error}
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
            {filteredCustomers.map((customer) => {
              const dueNow = Number(customer.dueAmount || 0);
              const overdue = Number(customer.overdueSchemeCount || 0);
              const statusTone = overdue > 0 ? "#c0392b" : dueNow > 0 ? "#a9771c" : "#2d8a52";
              const currentPlan = customer.currentPlan || null;
              const hasCurrentPlan = Boolean(currentPlan);
              const canSendReminder = Boolean(customer.phone && hasCurrentPlan);
              const reminderAmount = Number(currentPlan?.amount || dueNow || 0);

              return (
                <div
                  key={customer._id}
                  style={{ background: "#fffdf8", borderRadius: 20, border: "1px solid rgba(169,126,39,0.12)", padding: "18px 18px 16px", boxShadow: "0 8px 24px rgba(133,104,74,0.05)" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 14 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg,#fff1cd,#edce8a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8c6518", fontWeight: 900, fontSize: "1.2rem", flexShrink: 0 }}>
                        {customer.name?.charAt(0)?.toUpperCase() || "C"}
                      </div>
                      <div>
                        <div style={{ fontSize: "1rem", fontWeight: 900, color: "#3e2b16" }}>{customer.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "#8a6b49", marginTop: 4 }}>
                          {customer.customerId || "No ID"} | {customer.phone || "No phone"}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: hasCurrentPlan ? "#6f5334" : "#c0392b", marginTop: 6, fontWeight: 700 }}>
                          {hasCurrentPlan
                            ? `Current Plan: ${currentPlan.schemeName} - Rs ${fmt(currentPlan.amount)}`
                            : "No plans"}
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                          <span style={{ background: "rgba(169,118,28,0.1)", border: "1px solid rgba(169,118,28,0.18)", color: "#a9771c", borderRadius: 999, padding: "4px 10px", fontSize: "0.62rem", fontWeight: 800 }}>
                            {customer.activeSchemeCount || 0} active scheme{Number(customer.activeSchemeCount || 0) === 1 ? "" : "s"}
                          </span>
                          <span style={{ background: "rgba(123,0,0,0.08)", border: "1px solid rgba(123,0,0,0.14)", color: statusTone, borderRadius: 999, padding: "4px 10px", fontSize: "0.62rem", fontWeight: 800 }}>
                            {overdue > 0 ? `${overdue} overdue` : dueNow > 0 ? "Due today" : "On track"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ minWidth: 180, textAlign: "right" }}>
                      <div style={{ fontSize: "0.58rem", fontWeight: 800, color: "#a9771c", letterSpacing: "0.12em", textTransform: "uppercase" }}>Due Amount</div>
                      <div style={{ marginTop: 4, fontSize: "1.45rem", fontWeight: 900, color: statusTone }}>
                        Rs {fmt(dueNow)}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "#8a6b49", marginTop: 4 }}>
                        Next due: {formatDate(customer.nextDueDate)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                    <span style={{ background: "#fff", border: "1px solid rgba(169,126,39,0.12)", borderRadius: 999, padding: "7px 12px", fontSize: "0.68rem", color: "#6f5334", fontWeight: 700 }}>
                      Due Amount: Rs {fmt(dueNow)}
                    </span>
                    <span style={{ background: "#fff", border: "1px solid rgba(169,126,39,0.12)", borderRadius: 999, padding: "7px 12px", fontSize: "0.68rem", color: "#6f5334", fontWeight: 700 }}>
                      Next Due: {formatDate(customer.nextDueDate)}
                    </span>
                    <span style={{ background: "#fff", border: "1px solid rgba(169,126,39,0.12)", borderRadius: 999, padding: "7px 12px", fontSize: "0.68rem", color: "#6f5334", fontWeight: 700 }}>
                      Last Payment: {customer.lastPayment?.date ? formatDate(customer.lastPayment.date) : "No payment"}
                    </span>
                  </div>

                  {customer.assignedSchemes?.length ? (
                    <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {customer.assignedSchemes.map((scheme) => (
                        <div
                          key={scheme.id}
                          style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(169,126,39,0.12)", padding: "10px 12px", minWidth: 180 }}
                        >
                          <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#3e2b16" }}>{scheme.schemeName}</div>
                          <div style={{ fontSize: "0.64rem", color: "#8a6b49", marginTop: 4 }}>
                            Rs {fmt(scheme.amount)} | Due {formatDate(scheme.nextDueDate)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 14, border: "1px dashed rgba(192,57,43,0.22)", background: "rgba(192,57,43,0.04)", color: "#a05a52", fontSize: "0.72rem", fontWeight: 700 }}>
                      No active plans for this customer.
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                    <button
                      onClick={() => navigate("/agent-dashboard")}
                      style={{ height: 40, paddingInline: 16, borderRadius: 12, border: "1px solid rgba(169,126,39,0.18)", background: "#fff", color: "#8a6b49", fontWeight: 700, cursor: "pointer" }}
                    >
                      Open Desk
                    </button>
                    <button
                      onClick={() => {
                        if (!canSendReminder) return;
                        const msg = `Hi ${customer.name}, this is a reminder for your jewellery scheme installment for plan "${currentPlan.schemeName}". Current amount is Rs ${fmt(reminderAmount)}. Please contact us to continue your scheme without interruption.`;
                        window.open(`https://wa.me/91${customer.phone}?text=${encodeURIComponent(msg)}`, "_blank");
                      }}
                      disabled={!canSendReminder}
                      style={{ height: 40, paddingInline: 16, borderRadius: 12, border: "1px solid rgba(37,211,102,0.25)", background: canSendReminder ? "rgba(37,211,102,0.08)" : "rgba(160,160,160,0.12)", color: canSendReminder ? "#128c4a" : "#999", fontWeight: 800, cursor: canSendReminder ? "pointer" : "not-allowed" }}
                    >
                      WhatsApp Reminder
                    </button>
                    {canManageEverything ? (
                      <button
                        onClick={() => navigate(`/payment-history/${customer._id}`)}
                        style={{ height: 40, paddingInline: 16, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#c9a227,#a9771c)", color: "#fff", fontWeight: 800, cursor: "pointer" }}
                      >
                        View Payments
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {!filteredCustomers.length ? (
              <div style={{ textAlign: "center", padding: "34px 18px", color: "#8a6b49", border: "2px dashed rgba(169,118,28,0.15)", borderRadius: 18 }}>
                {search ? "No customers match your search." : "No customers are assigned yet."}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
