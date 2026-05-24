import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { CircularProgress, Alert, Snackbar } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import PhoneIcon from "@mui/icons-material/Phone";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";

const API = process.env.REACT_APP_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

export default function AgentDetail() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { id }    = useParams();                          // agent id from route
  const agentFromState = location.state?.agent || null;  // passed from ManageAgents

  const [agent, setAgent]                   = useState(agentFromState);
  const [assignedCustomers, setAssigned]    = useState([]);
  const [loadingAgent, setLoadingAgent]     = useState(!agentFromState);
  const [loadingCustomers, setLoadingCust]  = useState(true);

  // Assign modal state
  const [modalOpen, setModalOpen]           = useState(false);
  const [allCustomers, setAllCustomers]     = useState([]);
  const [loadingAll, setLoadingAll]         = useState(false);
  const [search, setSearch]                 = useState("");
  const [assignSearch, setAssignSearch]     = useState("");
  const [assignmentMode, setAssignmentMode] = useState("customer");
  const [assignmentArea, setAssignmentArea] = useState("");
  const [assignmentPlan, setAssignmentPlan] = useState("");
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selected, setSelected]             = useState([]);   // ids to assign
  const [assigning, setAssigning]           = useState(false);
  const [removingId, setRemovingId]         = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // ── Fetch agent if not in state ───────────────────────────────────────────
  useEffect(() => {
    if (!agentFromState) {
      axios.get(`${API}/api/agents/${id}`, { headers: authHeaders() })
        .then(res => setAgent(res.data.data || res.data))
        .catch(() => setSnackbar({ open: true, message: "Failed to load agent", severity: "error" }))
        .finally(() => setLoadingAgent(false));
    }
  }, [id]);

  // ── Fetch assigned customers ──────────────────────────────────────────────
  const fetchAssigned = async () => {
    setLoadingCust(true);
    try {
      const res = await axios.get(`${API}/api/agents/${id}/customers`, { headers: authHeaders() });
      setAssigned(res.data.data || res.data || []);
    } catch {
      setSnackbar({ open: true, message: "Failed to load customers", severity: "error" });
    } finally {
      setLoadingCust(false);
    }
  };

  useEffect(() => { fetchAssigned(); }, [id]);

  // ── Open assign modal → fetch all customers ───────────────────────────────
  const openAssignModal = async () => {
    setModalOpen(true);
    setSelected([]);
    setAssignSearch("");
    setLoadingAll(true);
    try {
      const res = await axios.get(`${API}/api/admin/users?role=customer`, { headers: authHeaders() });
      const plansRes = await axios.get(`${API}/api/admin/schemes?limit=200`, { headers: authHeaders() });
      const all = res.data.data || res.data || [];
      const planList = plansRes.data.data || [];
      // Exclude already assigned
      const assignedIds = new Set(assignedCustomers.map(c => c._id || c.id));
      setAllCustomers(all.filter(c => !assignedIds.has(c._id || c.id)));
      setAvailablePlans(planList);
    } catch {
      setSnackbar({ open: true, message: "Failed to load customers", severity: "error" });
    } finally {
      setLoadingAll(false);
    }
  };

  // ── Toggle selection ──────────────────────────────────────────────────────
  const toggleSelect = (custId) => {
    setSelected(prev =>
      prev.includes(custId) ? prev.filter(x => x !== custId) : [...prev, custId]
    );
  };

  const toggleAll = () => {
    const visibleIds = filteredAll.map(c => c._id || c.id);
    const allSelected = visibleIds.every(cid => selected.includes(cid));
    if (allSelected) setSelected(prev => prev.filter(x => !visibleIds.includes(x)));
    else setSelected(prev => [...new Set([...prev, ...visibleIds])]);
  };

  // ── Confirm assign ────────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (assignmentMode === "customer" && selected.length === 0) return;
    if (assignmentMode === "area" && !assignmentArea.trim()) {
      setSnackbar({ open: true, message: "Enter an area or city for area-wise assignment.", severity: "error" });
      return;
    }
    if (assignmentMode === "plan" && !assignmentPlan) {
      setSnackbar({ open: true, message: "Select a plan for plan-wise assignment.", severity: "error" });
      return;
    }
    setAssigning(true);
    try {
      await axios.post(
        `${API}/api/agents/${id}/assign-customers`,
        {
          customerIds: selected,
          assignmentType: assignmentMode,
          area: assignmentArea.trim(),
          schemeId: assignmentPlan,
        },
        { headers: authHeaders() }
      );
      setSnackbar({ open: true, message: "Customers assigned successfully.", severity: "success" });
      setModalOpen(false);
      fetchAssigned();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || "Assignment failed", severity: "error" });
    } finally {
      setAssigning(false);
    }
  };

  // ── Remove single customer ────────────────────────────────────────────────
  const handleRemove = async (customer) => {
    const custId = customer._id || customer.id;
    if (!window.confirm(`Remove "${customer.name}" from this agent?`)) return;
    setRemovingId(custId);
    try {
      await axios.delete(
        `${API}/api/agents/${id}/remove-customer/${custId}`,
        { headers: authHeaders() }
      );
      setAssigned(prev => prev.filter(c => (c._id || c.id) !== custId));
      setSnackbar({ open: true, message: `${customer.name} removed`, severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to remove customer", severity: "error" });
    } finally {
      setRemovingId(null);
    }
  };

  // ── Filtered lists ────────────────────────────────────────────────────────
  const filteredAssigned = assignedCustomers.filter(c =>
    !search.trim() ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const filteredAll = allCustomers.filter(c =>
    !assignSearch.trim() ||
    c.name?.toLowerCase().includes(assignSearch.toLowerCase()) ||
    c.phone?.includes(assignSearch)
  );

  if (loadingAgent) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg,#fffdf8 0%,#fff4df 100%)" }}>
      <CircularProgress sx={{ color: "#a9771c" }} />
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #fffdf8 0%, #fff4df 100%)",
      fontFamily: "'Montserrat', sans-serif",
      paddingBottom: 40,
    }}>

      {/* ── Header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(169,126,39,0.12)",
        boxShadow: "0 4px 20px rgba(133,104,74,0.08)",
        padding: "0 16px", height: 58,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          style={{
            background: "#fff4e2", border: "1px solid rgba(169,118,28,0.15)",
            borderRadius: 10, padding: "6px 8px", cursor: "pointer",
            display: "flex", alignItems: "center",
          }}
        >
          <ArrowBackIcon style={{ color: "#a9771c", fontSize: 20 }} />
        </motion.button>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#3e2b16", fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
            Agent Detail
          </div>
          <div style={{ fontSize: "0.45rem", color: "#a9771c", letterSpacing: "0.2em" }}>
            VIEW · ASSIGN · MANAGE
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.04 }}
          onClick={openAssignModal}
          style={{
            height: 36, paddingInline: 14, borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #c9a227, #a9771c)",
            color: "#fff", fontWeight: 800, fontSize: "0.72rem",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            fontFamily: "'Montserrat', sans-serif",
            boxShadow: "0 4px 14px rgba(169,119,28,0.3)",
          }}
        >
          <PersonAddIcon style={{ fontSize: 16 }} /> ASSIGN
        </motion.button>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px" }}>

        {/* ── Agent profile card ── */}
        {agent && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "#fff",
              border: "1px solid rgba(169,126,39,0.14)",
              borderRadius: 20, overflow: "hidden",
              boxShadow: "0 6px 24px rgba(133,104,74,0.09)",
              marginBottom: 20,
            }}
          >
            {/* Gold banner */}
            <div style={{
              background: "linear-gradient(135deg, #c9a227, #a9771c)",
              padding: "18px 20px",
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: "rgba(255,255,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem", fontWeight: 900, color: "#fff",
                flexShrink: 0,
              }}>
                {agent.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display', serif" }}>
                  {agent.name}
                </div>
                <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
                  Agent Account
                </div>
              </div>
            </div>

            {/* Details */}
            <div style={{ padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: 16 }}>
              {[
                { label: "Phone",     value: agent.phone || "—" },
                { label: "Email",     value: agent.email || "—" },
                { label: "Customers", value: assignedCustomers.length },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: "0.55rem", color: "#a9771c", fontWeight: 700, letterSpacing: "0.12em" }}>{label.toUpperCase()}</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#3e2b16", marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Assigned customers section ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#3e2b16", fontFamily: "'Playfair Display', serif" }}>
            Assigned Customers
          </div>
          <div style={{
            background: "rgba(169,118,28,0.1)", border: "1px solid rgba(169,118,28,0.2)",
            borderRadius: 999, padding: "3px 12px",
            fontSize: "0.65rem", fontWeight: 700, color: "#a9771c",
          }}>
            {assignedCustomers.length} total
          </div>
        </div>

        {/* Search assigned */}
        {assignedCustomers.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#fff", border: "1px solid rgba(169,126,39,0.18)",
            borderRadius: 12, padding: "0 14px", marginBottom: 14,
            boxShadow: "0 2px 8px rgba(133,104,74,0.06)",
          }}>
            <SearchIcon style={{ color: "#a9771c", fontSize: 18, flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search assigned customers…"
              style={{
                flex: 1, border: "none", outline: "none", background: "transparent",
                padding: "10px 0", fontSize: "0.8rem", color: "#3e2b16",
                fontFamily: "'Montserrat', sans-serif",
              }}
            />
            {search && <CloseIcon onClick={() => setSearch("")} style={{ color: "#a9771c", fontSize: 16, cursor: "pointer" }} />}
          </div>
        )}

        {/* Loading customers */}
        {loadingCustomers && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <CircularProgress sx={{ color: "#a9771c" }} size={28} />
          </div>
        )}

        {/* Empty */}
        {!loadingCustomers && filteredAssigned.length === 0 && (
          <div style={{
            textAlign: "center", padding: "40px 20px",
            background: "#fff", borderRadius: 18,
            border: "2px dashed rgba(169,118,28,0.2)",
          }}>
            <GroupsIcon style={{ fontSize: 44, color: "rgba(169,118,28,0.2)", marginBottom: 10 }} />
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#8a6b49", marginBottom: 6 }}>
              {search ? "No customers match" : "No customers assigned yet"}
            </div>
            <div style={{ fontSize: "0.68rem", color: "#bbb", marginBottom: 16 }}>
              {search ? "Try a different keyword" : "Tap ASSIGN to add customers to this agent"}
            </div>
            {!search && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={openAssignModal}
                style={{
                  background: "linear-gradient(135deg, #c9a227, #a9771c)",
                  color: "#fff", border: "none", borderRadius: 10,
                  padding: "10px 24px", fontWeight: 800, fontSize: "0.75rem",
                  cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                <PersonAddIcon style={{ fontSize: 16 }} /> Assign Customers
              </motion.button>
            )}
          </div>
        )}

        {/* Customer cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <AnimatePresence>
            {filteredAssigned.map((customer, i) => {
              const cid = customer._id || customer.id;
              return (
                <motion.div
                  key={cid}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(169,126,39,0.12)",
                    borderRadius: 16, overflow: "hidden",
                    boxShadow: "0 3px 12px rgba(133,104,74,0.06)",
                  }}
                >
                  <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                      background: "linear-gradient(135deg, #fff1cd, #edce8a)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: "1rem", fontWeight: 800, color: "#8c6518" }}>
                        {customer.name?.charAt(0)?.toUpperCase() || "C"}
                      </span>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "0.85rem", fontWeight: 800, color: "#3e2b16",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {customer.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                        <PhoneIcon style={{ fontSize: 11, color: "#a9771c" }} />
                        <span style={{ fontSize: "0.65rem", color: "#8a6b49" }}>{customer.phone || "—"}</span>
                      </div>
                    </div>

                    {/* Remove button */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemove(customer)}
                      disabled={removingId === cid}
                      title="Remove from agent"
                      style={{
                        background: "rgba(192,57,43,0.07)",
                        border: "1px solid rgba(192,57,43,0.2)",
                        borderRadius: 8, width: 34, height: 34, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      {removingId === cid
                        ? <CircularProgress size={14} sx={{ color: "#c0392b" }} />
                        : <PersonRemoveIcon style={{ color: "#c0392b", fontSize: 16 }} />
                      }
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Assign Customer Modal (bottom sheet) ── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.5)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
            onClick={() => !assigning && setModalOpen(false)}
          >
            <motion.div
              initial={{ y: 400, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 400, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: "min(580px, 100%)",
                background: "#fff",
                borderRadius: "24px 24px 0 0",
                maxHeight: "85vh",
                display: "flex", flexDirection: "column",
                boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
              }}
            >
              {/* Modal header */}
              <div style={{
                background: "linear-gradient(135deg, #c9a227, #a9771c)",
                padding: "18px 20px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderRadius: "24px 24px 0 0",
                flexShrink: 0,
              }}>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display', serif" }}>
                    Assign Customers
                  </div>
                  <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                    {selected.length > 0 ? `${selected.length} selected` : "Select one or more customers"}
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer" }}
                >
                  <CloseIcon style={{ color: "#fff", fontSize: 18 }} />
                </button>
              </div>

              {/* Search inside modal */}
              <div style={{
                padding: "14px 16px 10px", flexShrink: 0,
                borderBottom: "1px solid rgba(169,126,39,0.1)",
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
                  {[
                    ["customer", "Customer Wise"],
                    ["area", "Area Wise"],
                    ["plan", "Plan Wise"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setAssignmentMode(value)}
                      style={{
                        height: 38,
                        borderRadius: 10,
                        border: assignmentMode === value ? "none" : "1px solid rgba(169,126,39,0.18)",
                        background: assignmentMode === value ? "linear-gradient(135deg, #c9a227, #a9771c)" : "#fffaf5",
                        color: assignmentMode === value ? "#fff" : "#8a6b49",
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: "0.68rem",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {assignmentMode === "area" && (
                  <input
                    value={assignmentArea}
                    onChange={(e) => setAssignmentArea(e.target.value)}
                    placeholder="Enter area or city"
                    style={{ width: "100%", boxSizing: "border-box", marginBottom: 10, border: "1px solid rgba(169,126,39,0.18)", borderRadius: 10, padding: "10px 12px", fontSize: "0.8rem", background: "#fffaf5", color: "#3e2b16", outline: "none" }}
                  />
                )}

                {assignmentMode === "plan" && (
                  <select
                    value={assignmentPlan}
                    onChange={(e) => setAssignmentPlan(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", marginBottom: 10, border: "1px solid rgba(169,126,39,0.18)", borderRadius: 10, padding: "10px 12px", fontSize: "0.8rem", background: "#fffaf5", color: "#3e2b16", outline: "none" }}
                  >
                    <option value="">Select plan</option>
                    {availablePlans.map((plan) => (
                      <option key={plan._id} value={plan.schemeName}>{plan.schemeName} - {plan.user?.name || "Customer"}</option>
                    ))}
                  </select>
                )}

                {assignmentMode === "customer" && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "#fffaf5", border: "1px solid rgba(169,126,39,0.18)",
                  borderRadius: 10, padding: "0 12px",
                }}>
                  <SearchIcon style={{ color: "#a9771c", fontSize: 18 }} />
                  <input
                    value={assignSearch}
                    onChange={e => setAssignSearch(e.target.value)}
                    placeholder="Search customers to assign…"
                    style={{
                      flex: 1, border: "none", outline: "none", background: "transparent",
                      padding: "10px 0", fontSize: "0.8rem", color: "#3e2b16",
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  />
                  {assignSearch && <CloseIcon onClick={() => setAssignSearch("")} style={{ color: "#a9771c", fontSize: 16, cursor: "pointer" }} />}
                </div>
                )}

                {/* Select all row */}
                {assignmentMode === "customer" && filteredAll.length > 0 && (
                  <div
                    onClick={toggleAll}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      marginTop: 10, cursor: "pointer",
                    }}
                  >
                    {filteredAll.every(c => selected.includes(c._id || c.id))
                      ? <CheckBoxIcon style={{ color: "#a9771c", fontSize: 20 }} />
                      : <CheckBoxOutlineBlankIcon style={{ color: "#bbb", fontSize: 20 }} />
                    }
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8a6b49" }}>
                      Select all ({filteredAll.length})
                    </span>
                  </div>
                )}
              </div>

              {/* Customer list */}
              <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px" }}>
                {loadingAll ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <CircularProgress sx={{ color: "#a9771c" }} size={28} />
                  </div>
                ) : assignmentMode === "customer" && filteredAll.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#bbb", fontSize: "0.78rem" }}>
                    {assignSearch ? "No customers match" : "All customers are already assigned to this agent"}
                  </div>
                ) : assignmentMode !== "customer" ? (
                  <div style={{ textAlign: "center", padding: "32px 0", color: "#8a6b49", fontSize: "0.78rem" }}>
                    {assignmentMode === "area" ? "Assign every customer from the entered area or city." : "Assign every customer having the selected scheme."}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filteredAll.map((customer) => {
                      const cid = customer._id || customer.id;
                      const isSelected = selected.includes(cid);
                      return (
                        <motion.div
                          key={cid}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleSelect(cid)}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "12px 14px", borderRadius: 14, cursor: "pointer",
                            border: isSelected
                              ? "2px solid #a9771c"
                              : "1.5px solid rgba(169,126,39,0.12)",
                            background: isSelected
                              ? "rgba(169,118,28,0.06)"
                              : "#fffaf5",
                            transition: "all 0.15s",
                          }}
                        >
                          {/* Checkbox */}
                          {isSelected
                            ? <CheckBoxIcon style={{ color: "#a9771c", fontSize: 22, flexShrink: 0 }} />
                            : <CheckBoxOutlineBlankIcon style={{ color: "#ccc", fontSize: 22, flexShrink: 0 }} />
                          }

                          {/* Avatar */}
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: isSelected
                              ? "linear-gradient(135deg, #c9a227, #a9771c)"
                              : "linear-gradient(135deg, #fff1cd, #edce8a)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <span style={{ fontSize: "0.9rem", fontWeight: 800, color: isSelected ? "#fff" : "#8c6518" }}>
                              {customer.name?.charAt(0)?.toUpperCase() || "C"}
                            </span>
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#3e2b16", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {customer.name}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                              <PhoneIcon style={{ fontSize: 11, color: "#a9771c" }} />
                              <span style={{ fontSize: "0.62rem", color: "#8a6b49" }}>{customer.phone || "—"}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Confirm footer */}
              <div style={{
                padding: "14px 16px",
                borderTop: "1px solid rgba(169,126,39,0.1)",
                flexShrink: 0,
              }}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAssign}
                  disabled={selected.length === 0 || assigning}
                  style={{
                    width: "100%", height: 48, borderRadius: 12, border: "none",
                    background: selected.length === 0
                      ? "rgba(169,118,28,0.2)"
                      : "linear-gradient(135deg, #c9a227, #a9771c)",
                    color: "#fff", fontWeight: 800, fontSize: "0.85rem",
                    cursor: selected.length === 0 || assigning ? "not-allowed" : "pointer",
                    fontFamily: "'Montserrat', sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: selected.length > 0 ? "0 4px 14px rgba(169,119,28,0.3)" : "none",
                  }}
                >
                  {assigning
                    ? <><CircularProgress size={18} sx={{ color: "#fff" }} /> Assigning…</>
                    : selected.length === 0
                      ? "Select customers to assign"
                      : `Assign ${selected.length} Customer${selected.length > 1 ? "s" : ""}`
                  }
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Snackbar
        open={snackbar.open} autoHideDuration={3500}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
