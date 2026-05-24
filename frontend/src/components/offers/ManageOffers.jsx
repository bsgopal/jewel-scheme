import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowBack, Add, Delete, Edit, PictureAsPdf, ToggleOn, ToggleOff } from "@mui/icons-material";
import { Alert, Box, Button, Snackbar } from "@mui/material";
import axios from "axios";

const API = process.env.REACT_APP_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${API}${path}`;
};

const typeMeta = {
    banner:   { label: "Banner",   color: "#a9771c", bg: "rgba(169,119,28,0.1)"  },
    pdf:      { label: "PDF",      color: "#1a6fa9", bg: "rgba(26,111,169,0.1)"  },
    standard: { label: "Standard", color: "#8a6b49", bg: "rgba(138,107,73,0.08)" },
};

export default function ManageOffers() {
    const navigate = useNavigate();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const [togglingId, setTogglingId] = useState(null);
    const [filter, setFilter] = useState("all");
    const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
    const [confirmAction, setConfirmAction] = useState(null);

    const fetchOffers = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(`${API}/api/offers?include_all=true`, {
                headers: authHeaders(),
            });
            setOffers(res.data);
        } catch (err) {
            // Failed to fetch offers
            setOffers([]);
            setError(
                err.response?.data?.message ||
                (err.request
                    ? "Unable to load offers right now. Please check your connection and try again."
                    : "Something went wrong while loading offers.")
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchOffers(); }, [fetchOffers]);

    const handleDelete = async (id) => {
        setConfirmAction({
            message: "Delete this offer? This cannot be undone.",
            confirmLabel: "Delete",
            onConfirm: async () => {
                setDeletingId(id);
                try {
                    await axios.delete(`${API}/api/offers/${id}`, { headers: authHeaders() });
                    setOffers((prev) => prev.filter((o) => o.id !== id));
                    setToast({ open: true, message: "Offer deleted.", severity: "success" });
                } catch (err) {
                    // Delete failed
                    setToast({ open: true, message: err.response?.data?.message || "Unable to delete offer.", severity: "error" });
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const handleToggleActive = async (offer) => {
        setTogglingId(offer.id);
        try {
            await axios.put(
                `${API}/api/offers/${offer.id}`,
                { active: !offer.active },
                { headers: { ...authHeaders(), "Content-Type": "application/json" } }
            );
            setOffers((prev) =>
                prev.map((o) => o.id === offer.id ? { ...o, active: !o.active } : o)
            );
        } catch (err) {
            // Toggle failed
        } finally {
            setTogglingId(null);
        }
    };

    const filtered = offers.filter((o) => {
        if (filter === "all") return true;
        if (filter === "inactive") return !o.active;
        return (o.type || "standard") === filter;
    });

    const counts = {
        all:      offers.length,
        banner:   offers.filter((o) => o.type === "banner").length,
        pdf:      offers.filter((o) => o.type === "pdf").length,
        standard: offers.filter((o) => (o.type || "standard") === "standard").length,
        inactive: offers.filter((o) => !o.active).length,
    };

    return (
        <>
        <div className="app-safe-shell" style={{
            minHeight: "100vh",
            background: "linear-gradient(180deg, #fffdf8 0%, #fff4df 100%)",
            fontFamily: "'Montserrat', sans-serif",
            paddingBottom: 40,
        }}>

            {/* ── Header ── */}
            <div className="manage-offers-header" style={{
                position: "sticky", top: "env(safe-area-inset-top, 0px)", zIndex: 100,
                background: "rgba(255,255,255,0.92)", backdropFilter: "blur(14px)",
                borderBottom: "1px solid rgba(169,126,39,0.12)",
                boxShadow: "0 4px 20px rgba(133,104,74,0.08)",
                padding: "10px 16px 12px",
                minHeight: 64,
                display: "flex", alignItems: "center", gap: 12,
            }}>
                <motion.button
                    className="manage-offers-back"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate("/Home")}
                    style={{
                        background: "#fff4e2", border: "1px solid rgba(169,118,28,0.15)",
                        borderRadius: 10, padding: "6px 8px", cursor: "pointer",
                        display: "flex", alignItems: "center", flexShrink: 0,
                    }}
                >
                    <ArrowBack style={{ color: "#a9771c", fontSize: 20 }} />
                </motion.button>

                <div className="manage-offers-title-wrap" style={{ flex: 1, minWidth: 0 }}>
                    <div className="manage-offers-title" style={{ fontSize: "1rem", fontWeight: 800, color: "#3e2b16", fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
                        Manage Offers
                    </div>
                    <div className="manage-offers-subtitle" style={{ fontSize: "0.45rem", color: "#a9771c", letterSpacing: "0.2em" }}>
                        ADD · EDIT · TOGGLE · REMOVE
                    </div>
                </div>

                {/* Add button */}
                <motion.button
                    className="manage-offers-add"
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => navigate("/offers/new")}
                    style={{
                        height: 36, paddingInline: 14, borderRadius: 10, border: "none",
                        background: "linear-gradient(135deg, #c9a227, #a9771c)",
                        color: "#fff", fontWeight: 800, fontSize: "0.75rem",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                        fontFamily: "'Montserrat', sans-serif",
                        boxShadow: "0 4px 14px rgba(169,119,28,0.3)",
                        flexShrink: 0,
                    }}
                >
                    <Add style={{ fontSize: 18 }} /> ADD OFFER
                </motion.button>
            </div>

            <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px" }}>

                {/* ── Info tip ── */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: "#fff8ec", border: "1px solid rgba(169,126,39,0.18)",
                        borderRadius: 12, padding: "10px 14px", marginBottom: 18,
                        fontSize: "0.72rem", color: "#6f5334", lineHeight: 1.7,
                        boxShadow: "0 4px 14px rgba(133,104,74,0.06)",
                    }}
                >
                    🖼 <strong style={{ color: "#a9771c" }}>Banner</strong> offers appear in the home slider automatically &nbsp;·&nbsp;
                    📄 <strong style={{ color: "#1a6fa9" }}>PDF</strong> offers show a downloadable brochure in details page
                </motion.div>

                {/* ── Filter tabs ── */}
                <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
                    {[
                        { key: "all",      label: "All" },
                        { key: "banner",   label: "🖼 Banner" },
                        { key: "pdf",      label: "📄 PDF" },
                        { key: "standard", label: "🏷 Standard" },
                        { key: "inactive", label: "⚫ Inactive" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            style={{
                                flexShrink: 0,
                                height: 32, paddingInline: 12, borderRadius: 999,
                                border: filter === tab.key
                                    ? "1px solid #a9771c"
                                    : "1px solid rgba(169,118,28,0.2)",
                                background: filter === tab.key
                                    ? "rgba(169,118,28,0.12)"
                                    : "rgba(255,255,255,0.7)",
                                color: filter === tab.key
                                    ? "#a9771c"
                                    : "rgba(111,83,52,0.6)",
                                fontWeight: 700, fontSize: "0.68rem", cursor: "pointer",
                                fontFamily: "'Montserrat', sans-serif",
                                transition: "all 0.15s",
                            }}
                        >
                            {tab.label} {counts[tab.key] > 0 && (
                                <span style={{
                                    marginLeft: 4,
                                    background: filter === tab.key ? "#a9771c" : "rgba(169,118,28,0.1)",
                                    color: filter === tab.key ? "#fff" : "#a9771c",
                                    borderRadius: 999, padding: "1px 6px", fontSize: "0.6rem",
                                }}>
                                    {counts[tab.key]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Loading ── */}
                {loading && (
                    <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(169,118,28,0.4)", fontSize: "0.8rem" }}>
                        Loading offers…
                    </div>
                )}

                {/* ── Empty ── */}
                {!loading && error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            textAlign: "center",
                            padding: "28px 18px",
                            marginBottom: 16,
                            background: "#fff6f3",
                            border: "1px solid rgba(192,57,43,0.18)",
                            borderRadius: 14,
                            color: "#a33a2b",
                            fontSize: "0.78rem",
                            lineHeight: 1.6,
                        }}
                    >
                        {error}
                    </motion.div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            textAlign: "center", padding: "50px 20px",
                            color: "rgba(169,118,28,0.35)", fontSize: "0.8rem", fontStyle: "italic",
                        }}
                    >
                        {filter === "all" ? "No offers yet — tap ADD OFFER to create one." : `No ${filter} offers found.`}
                    </motion.div>
                )}

                {/* ── Offers list ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <AnimatePresence>
                        {filtered.map((offer, i) => {
                            const meta = typeMeta[offer.type || "standard"] || typeMeta.standard;
                            const imageUrl = getImageUrl(offer.banner_url || offer.image_url);
                            const hasPdf = Boolean(offer.pdf_url);
                            const daysLeft = offer.valid_to
                                ? Math.ceil((new Date(offer.valid_to) - new Date()) / 86400000)
                                : null;
                            const isExpired = daysLeft !== null && daysLeft <= 0;

                            return (
                                <motion.div
                                    key={offer.id}
                                    layout
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.04 }}
                                    style={{
                                        background: offer.active ? "#fff" : "rgba(255,255,255,0.5)",
                                        border: `1px solid ${offer.active ? "rgba(169,118,28,0.18)" : "rgba(169,118,28,0.08)"}`,
                                        borderRadius: 18,
                                        overflow: "hidden",
                                        opacity: offer.active ? 1 : 0.65,
                                        boxShadow: offer.active
                                            ? "0 4px 16px rgba(133,104,74,0.08)"
                                            : "none",
                                    }}
                                >
                                    {/* Banner image strip */}
                                    {imageUrl && (
                                        <div style={{ position: "relative", height: 120 }}>
                                            <img src={imageUrl} alt={offer.title}
                                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                            <div style={{
                                                position: "absolute", inset: 0,
                                                background: "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(40,20,0,0.7) 100%)",
                                            }} />
                                            {!offer.active && (
                                                <div style={{
                                                    position: "absolute", inset: 0,
                                                    background: "rgba(255,255,255,0.45)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                }}>
                                                    <span style={{
                                                        background: "rgba(100,70,30,0.75)", color: "#fff",
                                                        padding: "4px 12px", borderRadius: 999, fontSize: "0.65rem", fontWeight: 700,
                                                        border: "1px solid rgba(255,255,255,0.2)",
                                                    }}>INACTIVE</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Body */}
                                    <div style={{ padding: "14px 16px" }}>
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>

                                                {/* Type + expired badges */}
                                                <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                                                    <div style={{
                                                        background: meta.bg,
                                                        border: `1px solid ${meta.color}55`,
                                                        borderRadius: 999, padding: "2px 8px",
                                                        fontSize: "0.58rem", color: meta.color, fontWeight: 700,
                                                    }}>
                                                        {meta.label}
                                                    </div>
                                                    {hasPdf && (
                                                        <div style={{
                                                            background: "rgba(26,111,169,0.08)",
                                                            border: "1px solid rgba(26,111,169,0.3)",
                                                            borderRadius: 999, padding: "2px 8px",
                                                            fontSize: "0.58rem", color: "#1a6fa9", fontWeight: 700,
                                                            display: "flex", alignItems: "center", gap: 3,
                                                        }}>
                                                            <PictureAsPdf style={{ fontSize: 10 }} /> PDF
                                                        </div>
                                                    )}
                                                    {isExpired && (
                                                        <div style={{
                                                            background: "rgba(192,57,43,0.08)",
                                                            border: "1px solid rgba(192,57,43,0.3)",
                                                            borderRadius: 999, padding: "2px 8px",
                                                            fontSize: "0.58rem", color: "#c0392b", fontWeight: 700,
                                                        }}>
                                                            EXPIRED
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <div style={{
                                                    fontSize: "0.9rem", fontWeight: 800, color: "#3e2b16",
                                                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                                    fontFamily: "'Playfair Display', serif",
                                                }}>
                                                    {offer.title}
                                                </div>

                                                {/* Subtitle */}
                                                {offer.subtitle && (
                                                    <div style={{
                                                        fontSize: "0.72rem", color: "rgba(111,83,52,0.6)",
                                                        marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                    }}>
                                                        {offer.subtitle}
                                                    </div>
                                                )}

                                                {/* Bonus + days left */}
                                                <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                                                    {offer.bonus_value > 0 && (
                                                        <span style={{ fontSize: "0.65rem", color: "#a9771c", fontWeight: 700 }}>
                                                            🎁 {offer.bonus_value}% Bonus
                                                        </span>
                                                    )}
                                                    {daysLeft !== null && (
                                                        <span style={{
                                                            fontSize: "0.65rem", fontWeight: 600,
                                                            color: isExpired ? "#c0392b" : daysLeft <= 3 ? "#e67e22" : "rgba(111,83,52,0.45)",
                                                        }}>
                                                            {isExpired ? "⚠ Expired" : `⏳ ${daysLeft}d left`}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* ── Action buttons ── */}
                                            <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>

                                                {/* Toggle active */}
                                                <motion.button
                                                    whileTap={{ scale: 0.88 }}
                                                    onClick={() => handleToggleActive(offer)}
                                                    disabled={togglingId === offer.id}
                                                    title={offer.active ? "Deactivate" : "Activate"}
                                                    style={{
                                                        background: offer.active ? "rgba(39,174,96,0.1)" : "rgba(169,118,28,0.06)",
                                                        border: `1px solid ${offer.active ? "rgba(39,174,96,0.35)" : "rgba(169,118,28,0.15)"}`,
                                                        borderRadius: 8, width: 34, height: 34,
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    {offer.active
                                                        ? <ToggleOn style={{ color: "#27ae60", fontSize: 20 }} />
                                                        : <ToggleOff style={{ color: "rgba(169,118,28,0.35)", fontSize: 20 }} />}
                                                </motion.button>

                                                {/* Edit */}
                                                <motion.button
                                                    whileTap={{ scale: 0.88 }}
                                                    onClick={() => navigate(`/offers/edit/${offer.id}`)}
                                                    style={{
                                                        background: "rgba(169,118,28,0.08)",
                                                        border: "1px solid rgba(169,118,28,0.2)",
                                                        borderRadius: 8, width: 34, height: 34,
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <Edit style={{ color: "#a9771c", fontSize: 16 }} />
                                                </motion.button>

                                                {/* Delete */}
                                                <motion.button
                                                    whileTap={{ scale: 0.88 }}
                                                    onClick={() => handleDelete(offer.id)}
                                                    disabled={deletingId === offer.id}
                                                    style={{
                                                        background: "rgba(192,57,43,0.08)",
                                                        border: "1px solid rgba(192,57,43,0.2)",
                                                        borderRadius: 8, width: 34, height: 34,
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <Delete style={{ color: "#c0392b", fontSize: 16 }} />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>

        <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
            <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
                {toast.message}
            </Alert>
        </Snackbar>

        <Snackbar open={Boolean(confirmAction)} onClose={() => setConfirmAction(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
            <Alert
                severity="warning"
                onClose={() => setConfirmAction(null)}
                action={(
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button color="inherit" size="small" onClick={() => setConfirmAction(null)}>Cancel</Button>
                        <Button
                            color="inherit"
                            size="small"
                            onClick={async () => {
                                const action = confirmAction;
                                setConfirmAction(null);
                                await action?.onConfirm?.();
                            }}
                        >
                            {confirmAction?.confirmLabel || "Confirm"}
                        </Button>
                    </Box>
                )}
            >
                {confirmAction?.message || ""}
            </Alert>
        </Snackbar>
        </>
    );
}
