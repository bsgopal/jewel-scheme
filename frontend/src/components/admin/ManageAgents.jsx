import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { CircularProgress, Alert, Snackbar } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import DeleteIcon from "@mui/icons-material/Delete";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import GroupsIcon from "@mui/icons-material/Groups";
import PhoneIcon from "@mui/icons-material/Phone";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { getBackTarget } from "../../utils/navigation";

const API = process.env.REACT_APP_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

export default function ManageAgents() {
  const navigate = useNavigate();
  const location = useLocation();
  const backTarget = getBackTarget(location, "/Home");

  const [agents, setAgents]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [deletingId, setDeletingId]   = useState(null);
  const [search, setSearch]           = useState("");
  const [addOpen, setAddOpen]         = useState(false);
  const [snackbar, setSnackbar]       = useState({ open: false, message: "", severity: "success" });

  // ── Add agent form state ──────────────────────────────────────────────────
  const [form, setForm]       = useState({ name: "", phone: "", email: "", password: "" });
  const [saving, setSaving]   = useState(false);
  const [formErr, setFormErr] = useState("");

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/agents`, { headers: authHeaders() });
      setAgents(res.data.data || res.data || []);
    } catch {
      setSnackbar({ open: true, message: "Failed to load agents", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgents(); }, []);

  const handleDelete = async (agent) => {
    if (!window.confirm(`Delete agent "${agent.name}"? This cannot be undone.`)) return;
    setDeletingId(agent._id || agent.id);
    try {
      await axios.delete(`${API}/api/agents/${agent._id || agent.id}`, { headers: authHeaders() });
      setAgents(prev => prev.filter(a => (a._id || a.id) !== (agent._id || agent.id)));
      setSnackbar({ open: true, message: "Agent deleted successfully", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to delete agent", severity: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddAgent = async () => {
    if (!form.name || !form.phone || !form.password) {
      setFormErr("Name, phone and password are required.");
      return;
    }
    if (form.phone.length !== 10) {
      setFormErr("Phone number must be 10 digits.");
      return;
    }
    if (form.password.length < 6) {
      setFormErr("Password must be at least 6 characters.");
      return;
    }
    setSaving(true); setFormErr("");
    try {
      const res = await axios.post(
        `${API}/api/agents`,
        { ...form, role: "agent" },
        { headers: authHeaders() }
      );
      setAgents(prev => [...prev, res.data.data || res.data]);
      setSnackbar({ open: true, message: "Agent created successfully!", severity: "success" });
      setAddOpen(false);
      setForm({ name: "", phone: "", email: "", password: "" });
    } catch (err) {
      setFormErr(err.response?.data?.message || "Failed to create agent");
    } finally {
      setSaving(false);
    }
  };

  const filtered = agents.filter(a =>
    !search.trim() ||
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.phone?.includes(search) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
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
          onClick={() => navigate(backTarget)}
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
            Manage Agents
          </div>
          <div style={{ fontSize: "0.45rem", color: "#a9771c", letterSpacing: "0.2em" }}>
            ADD · VIEW · ASSIGN · REMOVE
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setAddOpen(true)}
          style={{
            height: 36, paddingInline: 14, borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #c9a227, #a9771c)",
            color: "#fff", fontWeight: 800, fontSize: "0.75rem",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            fontFamily: "'Montserrat', sans-serif",
            boxShadow: "0 4px 14px rgba(169,119,28,0.3)",
          }}
        >
          <AddIcon style={{ fontSize: 18 }} /> ADD AGENT
        </motion.button>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px" }}>

        {/* ── Stats bar ── */}
        <div style={{
          background: "#fff", borderRadius: 16,
          border: "1px solid rgba(169,126,39,0.12)",
          boxShadow: "0 4px 16px rgba(133,104,74,0.07)",
          padding: "14px 20px", marginBottom: 18,
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: "linear-gradient(135deg, #fff1cd, #edce8a)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <GroupsIcon style={{ color: "#8c6518", fontSize: 24 }} />
          </div>
          <div>
            <div style={{ fontSize: "0.6rem", color: "#8a6b49", fontWeight: 700, letterSpacing: "0.12em" }}>TOTAL AGENTS</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#3e2b16", lineHeight: 1 }}>{agents.length}</div>
          </div>
        </div>

        {/* ── Search ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#fff", border: "1px solid rgba(169,126,39,0.18)",
          borderRadius: 12, padding: "0 14px", marginBottom: 18,
          boxShadow: "0 2px 8px rgba(133,104,74,0.06)",
        }}>
          <SearchIcon style={{ color: "#a9771c", fontSize: 20, flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone or email…"
            style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              padding: "12px 0", fontSize: "0.82rem", color: "#3e2b16",
              fontFamily: "'Montserrat', sans-serif",
            }}
          />
          {search && (
            <CloseIcon
              onClick={() => setSearch("")}
              style={{ color: "#a9771c", fontSize: 18, cursor: "pointer" }}
            />
          )}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <CircularProgress sx={{ color: "#a9771c" }} />
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && filtered.length === 0 && (
          <div style={{
            textAlign: "center", padding: "50px 20px",
            background: "#fff", borderRadius: 18,
            border: "2px dashed rgba(169,118,28,0.2)",
          }}>
            <GroupsIcon style={{ fontSize: 48, color: "rgba(169,118,28,0.25)", marginBottom: 12 }} />
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#8a6b49", marginBottom: 6 }}>
              {search ? "No agents match your search" : "No agents yet"}
            </div>
            <div style={{ fontSize: "0.7rem", color: "#bbb", marginBottom: 20 }}>
              {search ? "Try a different keyword" : "Tap ADD AGENT to create your first agent"}
            </div>
            {!search && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setAddOpen(true)}
                style={{
                  background: "linear-gradient(135deg, #c9a227, #a9771c)",
                  color: "#fff", border: "none", borderRadius: 10,
                  padding: "10px 24px", fontWeight: 800, fontSize: "0.78rem",
                  cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
                }}
              >
                + Add First Agent
              </motion.button>
            )}
          </div>
        )}

        {/* ── Agent list ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <AnimatePresence>
            {filtered.map((agent, i) => {
              const id = agent._id || agent.id;
              const customerCount = agent.assignedCustomers?.length || agent.customerCount || 0;
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(169,126,39,0.14)",
                    borderRadius: 18,
                    overflow: "hidden",
                    boxShadow: "0 4px 16px rgba(133,104,74,0.07)",
                  }}
                >
                  {/* Card body */}
                  <div style={{ padding: "16px 16px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>

                      {/* Avatar */}
                      <div style={{
                        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                        background: "linear-gradient(135deg, #c9a227, #a9771c)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ color: "#fff", fontWeight: 900, fontSize: "1.1rem" }}>
                          {agent.name?.charAt(0)?.toUpperCase() || "A"}
                        </span>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: "0.9rem", fontWeight: 800, color: "#3e2b16",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          fontFamily: "'Playfair Display', serif",
                        }}>
                          {agent.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                          <PhoneIcon style={{ fontSize: 12, color: "#a9771c" }} />
                          <span style={{ fontSize: "0.68rem", color: "#8a6b49" }}>{agent.phone || "—"}</span>
                        </div>
                        {agent.email && (
                          <div style={{ fontSize: "0.62rem", color: "#bbb", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {agent.email}
                          </div>
                        )}
                      </div>

                      {/* Customer count badge */}
                      <div style={{
                        background: "rgba(169,118,28,0.08)", border: "1px solid rgba(169,118,28,0.18)",
                        borderRadius: 10, padding: "6px 12px", textAlign: "center", flexShrink: 0,
                      }}>
                        <div style={{ fontSize: "1rem", fontWeight: 900, color: "#a9771c" }}>{customerCount}</div>
                        <div style={{ fontSize: "0.5rem", color: "#8a6b49", fontWeight: 700 }}>CUSTOMERS</div>
                      </div>
                    </div>
                  </div>

                  {/* Action strip */}
                  <div style={{
                    borderTop: "1px solid rgba(169,126,39,0.08)",
                    display: "flex",
                  }}>
                    {/* View / Assign */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(`/admin/agents/${id}`, { state: { agent } })}
                      style={{
                        flex: 1, height: 42, border: "none",
                        background: "transparent",
                        color: "#a9771c", fontWeight: 700, fontSize: "0.75rem",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 6,
                        fontFamily: "'Montserrat', sans-serif",
                        borderRight: "1px solid rgba(169,126,39,0.08)",
                      }}
                    >
                      <PersonIcon style={{ fontSize: 16 }} />
                      View & Assign
                      <ChevronRightIcon style={{ fontSize: 16 }} />
                    </motion.button>

                    {/* Delete */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleDelete(agent)}
                      disabled={deletingId === id}
                      style={{
                        width: 52, height: 42, border: "none",
                        background: "transparent",
                        color: "#c0392b", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {deletingId === id
                        ? <CircularProgress size={16} sx={{ color: "#c0392b" }} />
                        : <DeleteIcon style={{ fontSize: 18 }} />
                      }
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Add Agent Bottom Sheet ── */}
      <AnimatePresence>
        {addOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.45)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
            onClick={() => !saving && setAddOpen(false)}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: "min(520px, 100%)",
                background: "#fff",
                borderRadius: "24px 24px 0 0",
                overflow: "hidden",
                boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
              }}
            >
              {/* Sheet header */}
              <div style={{
                background: "linear-gradient(135deg, #c9a227, #a9771c)",
                padding: "18px 20px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display', serif" }}>
                    New Agent
                  </div>
                  <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.7)", letterSpacing: "0.15em" }}>
                    CREATE AGENT ACCOUNT
                  </div>
                </div>
                <button
                  onClick={() => setAddOpen(false)}
                  style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer" }}
                >
                  <CloseIcon style={{ color: "#fff", fontSize: 18 }} />
                </button>
              </div>

              <div style={{ padding: "20px" }}>
                {formErr && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: "0.75rem" }}>
                    {formErr}
                  </Alert>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { key: "name",     label: "Full Name *",    type: "text",     placeholder: "Agent full name" },
                    { key: "phone",    label: "Phone *",        type: "tel",      placeholder: "10-digit mobile" },
                    { key: "email",    label: "Email",          type: "email",    placeholder: "Optional" },
                    { key: "password", label: "Password *",     type: "password", placeholder: "Min 6 characters" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{
                        fontSize: "0.6rem", fontWeight: 700, color: "#a9771c",
                        letterSpacing: "0.1em", textTransform: "uppercase",
                        display: "block", marginBottom: 6,
                      }}>
                        {f.label}
                      </label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        value={form[f.key]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{
                          width: "100%", padding: "12px 14px", borderRadius: 10,
                          border: "1.5px solid rgba(169,126,39,0.2)",
                          fontSize: "0.82rem", color: "#3e2b16",
                          background: "#fffaf5", outline: "none",
                          fontFamily: "'Montserrat', sans-serif",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                  <button
                    onClick={() => setAddOpen(false)}
                    style={{
                      flex: 1, height: 46, borderRadius: 12,
                      border: "1.5px solid rgba(169,118,28,0.2)",
                      background: "transparent", color: "#8a6b49",
                      fontWeight: 700, fontSize: "0.78rem",
                      cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAddAgent}
                    disabled={saving}
                    style={{
                      flex: 2, height: 46, borderRadius: 12, border: "none",
                      background: "linear-gradient(135deg, #c9a227, #a9771c)",
                      color: "#fff", fontWeight: 800, fontSize: "0.82rem",
                      cursor: saving ? "not-allowed" : "pointer",
                      fontFamily: "'Montserrat', sans-serif",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: "0 4px 14px rgba(169,119,28,0.3)",
                    }}
                  >
                    {saving ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Create Agent"}
                  </motion.button>
                </div>
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
