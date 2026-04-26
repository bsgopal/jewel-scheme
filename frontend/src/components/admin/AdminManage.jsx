import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Snackbar,
  TextField,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AdminContentWorkspace from "./AdminContentWorkspace";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";
const tabs = ["Overview", "Users", "Agents", "Schemes", "Payments", "Plans", "Content"];

function Panel({ children }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.92)",
        borderRadius: 24,
        border: "1px solid rgba(169,126,39,0.12)",
        boxShadow: "0 18px 36px rgba(133,104,74,0.08)",
        padding: 20,
      }}
    >
      {children}
    </div>
  );
}

export default function AdminManage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [activeTab, setActiveTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const [dashboard, setDashboard] = useState(null);
  const [insights, setInsights] = useState(null);
  const [users, setUsers] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [schemeSearch, setSchemeSearch] = useState("");
  const [schemeStatus, setSchemeStatus] = useState("all");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [planStatus, setPlanStatus] = useState("all");
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ role: "customer", isActive: true, isVerified: true });
  const [editingScheme, setEditingScheme] = useState(null);
  const [schemeForm, setSchemeForm] = useState({ status: "active", notes: "" });
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ status: "pending", paymentMethod: "Cash", notes: "" });

  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });

  const loadAll = useCallback(async () => {
    const requestConfig = { headers: { Authorization: `Bearer ${token}` } };

    setLoading(true);
    try {
      const [dashboardRes, insightsRes, usersRes, schemesRes, paymentsRes, plansRes] = await Promise.all([
        axios.get(`${API}/api/admin/dashboard`, requestConfig),
        axios.get(`${API}/api/admin/operational-insights`, requestConfig),
        axios.get(`${API}/api/admin/users`, { ...requestConfig, params: { limit: 200 } }),
        axios.get(`${API}/api/admin/schemes`, { ...requestConfig, params: { limit: 200 } }),
        axios.get(`${API}/api/admin/payments`, { ...requestConfig, params: { limit: 200 } }),
        axios.get(`${API}/api/plan-catalog`, { ...requestConfig, params: { include_all: "true" } }),
      ]);

      setDashboard(dashboardRes.data?.data || null);
      setInsights(insightsRes.data?.data || null);
      setUsers(usersRes.data?.data || []);
      setSchemes(schemesRes.data?.data || []);
      setPayments(paymentsRes.data?.data || []);
      setPlans(plansRes.data?.data || []);
    } catch (error) {
      showToast("Unable to load admin data.", "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();

    return users.filter((user) => {
      const roleMatch = roleFilter === "all" || user.role === roleFilter;
      const searchMatch = !query
        || user.name?.toLowerCase().includes(query)
        || user.phone?.includes(query)
        || user.email?.toLowerCase().includes(query)
        || user.customerId?.toLowerCase().includes(query);
      return roleMatch && searchMatch;
    });
  }, [roleFilter, userSearch, users]);

  const filteredSchemes = useMemo(() => {
    const query = schemeSearch.trim().toLowerCase();

    return schemes.filter((scheme) => {
      const statusMatch = schemeStatus === "all" || scheme.status === schemeStatus;
      const searchMatch = !query
        || scheme.schemeName?.toLowerCase().includes(query)
        || scheme.schemeId?.toLowerCase().includes(query)
        || scheme.user?.name?.toLowerCase().includes(query)
        || scheme.user?.customerId?.toLowerCase().includes(query);
      return statusMatch && searchMatch;
    });
  }, [schemeSearch, schemeStatus, schemes]);

  const filteredPayments = useMemo(() => {
    const query = paymentSearch.trim().toLowerCase();

    return payments.filter((payment) => {
      const statusMatch = paymentStatus === "all" || payment.status === paymentStatus;
      const searchMatch = !query
        || payment.user?.name?.toLowerCase().includes(query)
        || payment.user?.customerId?.toLowerCase().includes(query)
        || payment.scheme?.schemeName?.toLowerCase().includes(query)
        || payment.paymentId?.toLowerCase().includes(query);
      return statusMatch && searchMatch;
    });
  }, [paymentSearch, paymentStatus, payments]);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (planStatus === "active") return plan.active;
      if (planStatus === "inactive") return !plan.active;
      return true;
    });
  }, [planStatus, plans]);

  const agentUsers = useMemo(() => users.filter((user) => user.role === "agent"), [users]);

  const openEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      role: user.role || "customer",
      isActive: Boolean(user.isActive),
      isVerified: Boolean(user.isVerified),
    });
  };

  const saveUser = async () => {
    try {
      await axios.put(`${API}/api/admin/users/${editingUser._id}`, userForm, { headers: { Authorization: `Bearer ${token}` } });
      setEditingUser(null);
      await loadAll();
      showToast("User updated.");
    } catch (error) {
      showToast("Unable to update user.", "error");
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.name}?`)) return;

    try {
      await axios.delete(`${API}/api/admin/users/${user._id}`, { headers: { Authorization: `Bearer ${token}` } });
      await loadAll();
      showToast("User deleted.");
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to delete user.", "error");
    }
  };

  const openEditScheme = (scheme) => {
    setEditingScheme(scheme);
    setSchemeForm({
      status: scheme.status || "active",
      notes: scheme.notes || "",
    });
  };

  const saveScheme = async () => {
    try {
      await axios.put(`${API}/api/admin/schemes/${editingScheme._id}`, schemeForm, { headers: { Authorization: `Bearer ${token}` } });
      setEditingScheme(null);
      await loadAll();
      showToast("Scheme updated.");
    } catch (error) {
      showToast("Unable to update scheme.", "error");
    }
  };

  const openEditPayment = (payment) => {
    setEditingPayment(payment);
    setPaymentForm({
      status: payment.status || "pending",
      paymentMethod: payment.paymentMethod || "Cash",
      notes: payment.notes || "",
    });
  };

  const savePayment = async () => {
    try {
      await axios.put(`${API}/api/admin/payments/${editingPayment._id}`, paymentForm, { headers: { Authorization: `Bearer ${token}` } });
      setEditingPayment(null);
      await loadAll();
      showToast("Payment updated.");
    } catch (error) {
      showToast("Unable to update payment.", "error");
    }
  };

  const deletePayment = async (payment) => {
    if (!window.confirm(`Delete payment ${payment.paymentId || ""}?`)) return;

    try {
      await axios.delete(`${API}/api/admin/payments/${payment._id}`, { headers: { Authorization: `Bearer ${token}` } });
      await loadAll();
      showToast("Payment deleted.");
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to delete payment.", "error");
    }
  };

  const deletePlan = async (planId) => {
    if (!window.confirm("Delete this plan?")) return;

    try {
      await axios.delete(`${API}/api/plan-catalog/${planId}`, { headers: { Authorization: `Bearer ${token}` } });
      await loadAll();
      showToast("Plan deleted.");
    } catch (error) {
      showToast("Unable to delete plan.", "error");
    }
  };

  return (
    <div className="app-safe-shell">
      <div style={{ maxWidth: 1260, margin: "0 auto", display: "grid", gap: 18 }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            borderRadius: 18,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(169,126,39,0.12)",
            boxShadow: "0 18px 36px rgba(133,104,74,0.08)",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 12, border: "1px solid rgba(169,126,39,0.14)", background: "#fff", cursor: "pointer" }}>
              <ArrowBackIcon sx={{ color: "#6b4d26", fontSize: 18 }} />
            </button>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#3e2b16" }}>Admin Manage Center</div>
              <div style={{ fontSize: 12, color: "#85684a" }}>Users, agents, plans, payments, banners, offers, and arrivals in one place.</div>
            </div>
          </div>

          <button onClick={() => navigate("/CreateAccount")} style={{ height: 42, borderRadius: 999, border: "none", background: "linear-gradient(135deg, #7B0000, #C0392B)", color: "#FFD700", padding: "0 16px", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <AddIcon sx={{ fontSize: 18 }} /> Add User
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ height: 40, borderRadius: 999, border: activeTab === tab ? "none" : "1px solid rgba(169,126,39,0.14)", background: activeTab === tab ? "linear-gradient(135deg, #7B0000, #C0392B)" : "#fff", color: activeTab === tab ? "#FFD700" : "#6f5334", padding: "0 16px", cursor: "pointer", fontWeight: 700 }}>
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <Box sx={{ minHeight: "45vh", display: "grid", placeItems: "center" }}>
            <CircularProgress sx={{ color: "#b88324" }} />
          </Box>
        ) : null}

        {!loading && activeTab === "Overview" ? (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {[
                ["Customers", dashboard?.overview?.totalUsers || 0],
                ["Schemes", dashboard?.overview?.totalSchemes || 0],
                ["Active Schemes", dashboard?.overview?.activeSchemes || 0],
                ["Today Collection", `Rs ${Number(dashboard?.today?.collection || 0).toLocaleString("en-IN")}`],
                ["Pending Redemptions", dashboard?.overview?.pendingRedemptions || 0],
                ["Agents", agentUsers.length],
              ].map(([label, value]) => (
                <Panel key={label}>
                  <div style={{ fontSize: 12, color: "#8a6b49" }}>{label}</div>
                  <div style={{ marginTop: 8, fontSize: 30, fontWeight: 800, color: "#3e2b16" }}>{value}</div>
                </Panel>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              <Panel>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#3e2b16" }}>Agent Visibility</div>
                <div style={{ color: "#85684a", marginTop: 6 }}>Admin can open the same collection desk used by agents and review overdue schemes from here.</div>
                <button onClick={() => navigate("/agent-dashboard")} style={{ marginTop: 16, height: 42, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7B0000, #C0392B)", color: "#FFD700", padding: "0 16px", cursor: "pointer", fontWeight: 700 }}>
                  Open Agent Desk
                </button>
              </Panel>

              <Panel>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#3e2b16" }}>Overdue Collections</div>
                <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                  {(insights?.overdueSchemes || []).slice(0, 4).map((scheme) => (
                    <div key={scheme._id} style={{ padding: 12, borderRadius: 14, background: "#fffdf8", border: "1px solid rgba(169,126,39,0.12)" }}>
                      <div style={{ fontWeight: 700, color: "#3e2b16" }}>{scheme.user?.name}</div>
                      <div style={{ color: "#85684a", marginTop: 4 }}>{scheme.schemeName} • {scheme.user?.customerId}</div>
                    </div>
                  ))}
                  {!insights?.overdueSchemes?.length ? <div style={{ color: "#85684a" }}>No overdue schemes right now.</div> : null}
                </div>
              </Panel>
            </div>
          </div>
        ) : null}

        {!loading && activeTab === "Users" ? (
          <Panel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
              <TextField placeholder="Search users" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
              <TextField select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
                <MenuItem value="agent">Agent</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {filteredUsers.map((user) => (
                <div key={user._id} style={{ border: "1px solid rgba(169,126,39,0.12)", borderRadius: 18, padding: 16, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: "#fffdf8" }}>
                  <div>
                    <div style={{ fontWeight: 800, color: "#3e2b16", fontSize: 18 }}>{user.name}</div>
                    <div style={{ color: "#85684a", marginTop: 4 }}>{user.customerId || "-"} • {user.phone || "-"}</div>
                    <div style={{ color: "#85684a", marginTop: 4 }}>{user.email || "-"}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Chip label={user.role} sx={{ textTransform: "capitalize", fontWeight: 700 }} />
                    <Chip label={user.isActive ? "Active" : "Inactive"} sx={{ bgcolor: user.isActive ? "rgba(45,138,82,0.12)" : "rgba(163,58,43,0.12)", color: user.isActive ? "#2d8a52" : "#a33a2b", fontWeight: 700 }} />
                    <button onClick={() => openEditUser(user)} style={{ height: 38, borderRadius: 12, border: "1px solid rgba(169,126,39,0.14)", background: "#fff", color: "#6f5334", padding: "0 12px", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <EditOutlinedIcon sx={{ fontSize: 16 }} /> Edit
                    </button>
                    <button onClick={() => deleteUser(user)} style={{ height: 38, borderRadius: 12, border: "1px solid rgba(163,58,43,0.16)", background: "#fff7f5", color: "#a33a2b", padding: "0 12px", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {!filteredUsers.length ? <div style={{ color: "#85684a" }}>No users match the current filters.</div> : null}
            </div>
          </Panel>
        ) : null}

        {!loading && activeTab === "Agents" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <Panel>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#3e2b16" }}>Agent Accounts</div>
                <button onClick={() => navigate("/agent-dashboard")} style={{ height: 38, borderRadius: 12, border: "1px solid rgba(169,126,39,0.14)", background: "#fff", color: "#6f5334", padding: "0 12px", cursor: "pointer", fontWeight: 700 }}>
                  Open Desk
                </button>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {agentUsers.map((user) => (
                  <div key={user._id} style={{ border: "1px solid rgba(169,126,39,0.12)", borderRadius: 18, padding: 16, background: "#fffdf8", display: "grid", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 800, color: "#3e2b16", fontSize: 18 }}>{user.name}</div>
                      <Chip label={user.isActive ? "Active Agent" : "Inactive Agent"} sx={{ bgcolor: user.isActive ? "rgba(45,138,82,0.12)" : "rgba(163,58,43,0.12)", color: user.isActive ? "#2d8a52" : "#a33a2b", fontWeight: 700 }} />
                    </div>
                    <div style={{ color: "#85684a" }}>{user.phone} • {user.email}</div>
                    <div style={{ color: "#85684a" }}>{user.customerId || "-"}</div>
                  </div>
                ))}
                {!agentUsers.length ? <div style={{ color: "#85684a" }}>No agents created yet.</div> : null}
              </div>
            </Panel>

            <Panel>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#3e2b16", marginBottom: 14 }}>Top Customers For Follow-up</div>
              <div style={{ display: "grid", gap: 12 }}>
                {(insights?.topCustomers || []).slice(0, 6).map((customer) => (
                  <div key={customer._id} style={{ border: "1px solid rgba(169,126,39,0.12)", borderRadius: 18, padding: 16, background: "#fffdf8" }}>
                    <div style={{ fontWeight: 800, color: "#3e2b16" }}>{customer.name}</div>
                    <div style={{ color: "#85684a", marginTop: 4 }}>{customer.customerId} • {customer.phone}</div>
                    <div style={{ color: "#85684a", marginTop: 4 }}>
                      Rs {Number(customer.totalSavings || 0).toLocaleString("en-IN")} • {Number(customer.totalGoldWeight || 0).toFixed(4)} g
                    </div>
                  </div>
                ))}
                {!insights?.topCustomers?.length ? <div style={{ color: "#85684a" }}>No customer insights available yet.</div> : null}
              </div>
            </Panel>
          </div>
        ) : null}

        {!loading && activeTab === "Schemes" ? (
          <Panel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
              <TextField placeholder="Search by customer, scheme, or scheme ID" value={schemeSearch} onChange={(e) => setSchemeSearch(e.target.value)} />
              <TextField select value={schemeStatus} onChange={(e) => setSchemeStatus(e.target.value)}>
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="matured">Matured</MenuItem>
                <MenuItem value="redeemed">Redeemed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
              </TextField>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {filteredSchemes.map((scheme) => (
                <div key={scheme._id} style={{ border: "1px solid rgba(169,126,39,0.12)", borderRadius: 18, padding: 16, background: "#fffdf8", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 800, color: "#3e2b16" }}>{scheme.schemeName}</div>
                    <div style={{ color: "#85684a", marginTop: 4 }}>{scheme.user?.name} • {scheme.user?.customerId}</div>
                    <div style={{ color: "#85684a", marginTop: 4 }}>Rs {Number(scheme.totalAmountPaid || 0).toLocaleString("en-IN")} • {Number(scheme.totalGoldWeight || 0).toFixed(4)} g</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Chip label={scheme.status} sx={{ textTransform: "capitalize", fontWeight: 700 }} />
                    <button onClick={() => openEditScheme(scheme)} style={{ height: 38, borderRadius: 12, border: "1px solid rgba(169,126,39,0.14)", background: "#fff", color: "#6f5334", padding: "0 12px", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <EditOutlinedIcon sx={{ fontSize: 16 }} /> Edit
                    </button>
                  </div>
                </div>
              ))}
              {!filteredSchemes.length ? <div style={{ color: "#85684a" }}>No schemes match the current filters.</div> : null}
            </div>
          </Panel>
        ) : null}

        {!loading && activeTab === "Payments" ? (
          <Panel>
            <div style={{ marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <TextField fullWidth placeholder="Search by customer, scheme, or payment ID" value={paymentSearch} onChange={(e) => setPaymentSearch(e.target.value)} />
              <TextField select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {filteredPayments.map((payment) => (
                <div key={payment._id} style={{ border: "1px solid rgba(169,126,39,0.12)", borderRadius: 18, padding: 16, background: "#fffdf8", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 800, color: "#3e2b16" }}>Rs {Number(payment.amount || 0).toLocaleString("en-IN")}</div>
                    <div style={{ color: "#85684a", marginTop: 4 }}>{payment.user?.name} • {payment.user?.customerId}</div>
                    <div style={{ color: "#85684a", marginTop: 4 }}>{payment.scheme?.schemeName} • {payment.paymentId || "-"}</div>
                  </div>
                  <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
                    <Chip label={payment.status} sx={{ textTransform: "capitalize", fontWeight: 700 }} />
                    <div style={{ color: "#85684a" }}>{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("en-IN") : "-"}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button onClick={() => openEditPayment(payment)} style={{ height: 38, borderRadius: 12, border: "1px solid rgba(169,126,39,0.14)", background: "#fff", color: "#6f5334", padding: "0 12px", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                        <EditOutlinedIcon sx={{ fontSize: 16 }} /> Edit
                      </button>
                      <button onClick={() => deletePayment(payment)} style={{ height: 38, borderRadius: 12, border: "1px solid rgba(163,58,43,0.16)", background: "#fff7f5", color: "#a33a2b", padding: "0 12px", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                        <DeleteOutlineIcon sx={{ fontSize: 16 }} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!filteredPayments.length ? <div style={{ color: "#85684a" }}>No payments match the current filters.</div> : null}
            </div>
          </Panel>
        ) : null}

        {!loading && activeTab === "Plans" ? (
          <Panel>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <TextField select value={planStatus} onChange={(e) => setPlanStatus(e.target.value)} sx={{ minWidth: 200 }}>
                <MenuItem value="all">All Plans</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
              <button onClick={() => navigate("/createnewplan")} style={{ height: 42, borderRadius: 999, border: "none", background: "linear-gradient(135deg, #7B0000, #C0392B)", color: "#FFD700", padding: "0 16px", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <AddIcon sx={{ fontSize: 18 }} /> Create Plan
              </button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {filteredPlans.map((plan) => (
                <div key={plan.id} style={{ border: "1px solid rgba(169,126,39,0.12)", borderRadius: 18, padding: 16, background: "#fffdf8", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 800, color: "#3e2b16", fontSize: 18 }}>{plan.plan_name}</div>
                    <div style={{ color: "#85684a", marginTop: 4 }}>{plan.plan_type} • {plan.jewellery_type}</div>
                    <div style={{ color: "#85684a", marginTop: 4 }}>Rs {Number(plan.amount_per_inst || 0).toLocaleString("en-IN")} / month</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Chip label={plan.active ? "Active" : "Inactive"} sx={{ bgcolor: plan.active ? "rgba(45,138,82,0.12)" : "rgba(163,58,43,0.12)", color: plan.active ? "#2d8a52" : "#a33a2b", fontWeight: 700 }} />
                    <button onClick={() => navigate(`/createnewplan/${plan.id}`)} style={{ height: 38, borderRadius: 12, border: "1px solid rgba(169,126,39,0.14)", background: "#fff", color: "#6f5334", padding: "0 12px", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <EditOutlinedIcon sx={{ fontSize: 16 }} /> Edit
                    </button>
                    <button onClick={() => deletePlan(plan.id)} style={{ height: 38, borderRadius: 12, border: "1px solid rgba(163,58,43,0.16)", background: "#fff7f5", color: "#a33a2b", padding: "0 12px", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {!filteredPlans.length ? <div style={{ color: "#85684a" }}>No plans match the current filters.</div> : null}
            </div>
          </Panel>
        ) : null}

        {!loading && activeTab === "Content" ? <AdminContentWorkspace /> : null}
      </div>

      <Dialog open={Boolean(editingUser)} onClose={() => setEditingUser(null)} PaperProps={{ sx: { borderRadius: 3, minWidth: 360 } }}>
        <DialogTitle>Update User</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}>
          <TextField select label="Role" value={userForm.role} onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))}>
            <MenuItem value="customer">Customer</MenuItem>
            <MenuItem value="agent">Agent</MenuItem>
            <MenuItem value="staff">Staff</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
          <TextField select label="Active" value={String(userForm.isActive)} onChange={(e) => setUserForm((prev) => ({ ...prev, isActive: e.target.value === "true" }))}>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </TextField>
          <TextField select label="Verified" value={String(userForm.isVerified)} onChange={(e) => setUserForm((prev) => ({ ...prev, isVerified: e.target.value === "true" }))}>
            <MenuItem value="true">Verified</MenuItem>
            <MenuItem value="false">Not Verified</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <button onClick={() => setEditingUser(null)} style={{ padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(169,126,39,0.14)", background: "#fff", cursor: "pointer" }}>Cancel</button>
          <button onClick={saveUser} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #7B0000, #C0392B)", color: "#FFD700", cursor: "pointer", fontWeight: 700 }}>Save</button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editingScheme)} onClose={() => setEditingScheme(null)} PaperProps={{ sx: { borderRadius: 3, minWidth: 360 } }}>
        <DialogTitle>Update Scheme</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}>
          <TextField select label="Status" value={schemeForm.status} onChange={(e) => setSchemeForm((prev) => ({ ...prev, status: e.target.value }))}>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="paused">Paused</MenuItem>
            <MenuItem value="matured">Matured</MenuItem>
            <MenuItem value="redeemed">Redeemed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
          <TextField label="Notes" multiline minRows={3} value={schemeForm.notes} onChange={(e) => setSchemeForm((prev) => ({ ...prev, notes: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <button onClick={() => setEditingScheme(null)} style={{ padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(169,126,39,0.14)", background: "#fff", cursor: "pointer" }}>Cancel</button>
          <button onClick={saveScheme} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #7B0000, #C0392B)", color: "#FFD700", cursor: "pointer", fontWeight: 700 }}>Save</button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editingPayment)} onClose={() => setEditingPayment(null)} PaperProps={{ sx: { borderRadius: 3, minWidth: 360 } }}>
        <DialogTitle>Update Payment</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}>
          <TextField select label="Status" value={paymentForm.status} onChange={(e) => setPaymentForm((prev) => ({ ...prev, status: e.target.value }))}>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="processing">Processing</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
          <TextField select label="Payment Method" value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}>
            <MenuItem value="Cash">Cash</MenuItem>
            <MenuItem value="UPI">UPI</MenuItem>
            <MenuItem value="NetBanking">Net Banking</MenuItem>
            <MenuItem value="BankTransfer">Bank Transfer</MenuItem>
            <MenuItem value="Cheque">Cheque</MenuItem>
            <MenuItem value="DebitCard">Debit Card</MenuItem>
            <MenuItem value="CreditCard">Credit Card</MenuItem>
          </TextField>
          <TextField label="Notes" multiline minRows={3} value={paymentForm.notes} onChange={(e) => setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <button onClick={() => setEditingPayment(null)} style={{ padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(169,126,39,0.14)", background: "#fff", cursor: "pointer" }}>Cancel</button>
          <button onClick={savePayment} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #7B0000, #C0392B)", color: "#FFD700", cursor: "pointer", fontWeight: 700 }}>Save</button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3200} onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
        <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))}>{toast.message}</Alert>
      </Snackbar>
    </div>
  );
}
