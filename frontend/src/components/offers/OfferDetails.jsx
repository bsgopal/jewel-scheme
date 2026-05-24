import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Snackbar } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { goBackOrFallback } from "../../utils/navigation";

const API = process.env.REACT_APP_API_URL;

export default function OfferDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const isAdmin = ["Admin", "SuperAdmin", "admin", "staff"].includes(role);

  const [offer, setOffer] = useState(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/offers/${id}`).then((res) => setOffer(res.data));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/api/offers/${offer.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      navigate("/offers");
    } catch (error) {
      setToast({ open: true, message: error.response?.data?.message || "Unable to delete offer.", severity: "error" });
    } finally {
      setDeleting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!offer) return (
    <Box sx={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(180deg, #fffdf8 0%, #fff4df 100%)",
    }}>
      <CircularProgress sx={{ color: "#a9771c" }} />
    </Box>
  );

  const bannerUrl = offer.banner_url || offer.image_url;
  const fullBanner = bannerUrl
    ? (bannerUrl.startsWith("http") ? bannerUrl : `${API}${bannerUrl}`)
    : null;
  const fullPdf = offer.pdf_url
    ? (offer.pdf_url.startsWith("http") ? offer.pdf_url : `${API}${offer.pdf_url}`)
    : null;
  const daysLeft = offer.valid_to
    ? Math.ceil((new Date(offer.valid_to) - new Date()) / 86400000)
    : null;
  const isExpired = daysLeft !== null && daysLeft <= 0;

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
          onClick={() => goBackOrFallback(navigate, location, "/offers")}
          style={{
            background: "#fff4e2", border: "1px solid rgba(169,118,28,0.15)",
            borderRadius: 10, padding: "6px 8px", cursor: "pointer",
            display: "flex", alignItems: "center",
          }}
        >
          <ArrowBackIosNewIcon style={{ color: "#a9771c", fontSize: 18 }} />
        </motion.button>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: "1rem", fontWeight: 800, color: "#3e2b16",
            fontFamily: "'Playfair Display', serif", lineHeight: 1,
          }}>
            Offer Details
          </div>
          <div style={{ fontSize: "0.45rem", color: "#a9771c", letterSpacing: "0.2em" }}>
            VIEW · DOWNLOAD · SHARE
          </div>
        </div>

        {isAdmin && (
          <div style={{ display: "flex", gap: 8 }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(`/offers/edit/${offer.id}`)}
              style={{
                background: "rgba(169,118,28,0.08)", border: "1px solid rgba(169,118,28,0.2)",
                borderRadius: 8, width: 34, height: 34,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
            >
              <EditIcon style={{ color: "#a9771c", fontSize: 16 }} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setConfirmOpen(true)}
              disabled={deleting}
              style={{
                background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.2)",
                borderRadius: 8, width: 34, height: 34,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
            >
              <DeleteIcon style={{ color: "#c0392b", fontSize: 16 }} />
            </motion.button>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto" }}>

        {/* ── Hero Banner ── */}
        {fullBanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ position: "relative" }}
          >
            <img
              src={fullBanner} alt={offer.title}
              style={{ width: "100%", height: 240, objectFit: "cover", display: "block" }}
            />
            {/* Gradient fade to cream */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, rgba(255,253,248,0) 40%, rgba(255,253,248,1) 100%)",
            }} />
            {/* Bonus badge on image */}
            {offer.bonus_value > 0 && (
              <div style={{
                position: "absolute", top: 14, right: 14,
                background: "linear-gradient(135deg, #c9a227, #a9771c)",
                color: "#fff", fontWeight: 800, fontSize: "0.85rem",
                padding: "7px 14px", borderRadius: 999,
                boxShadow: "0 4px 16px rgba(169,119,28,0.4)",
                fontFamily: "'Montserrat', sans-serif",
              }}>
                {offer.bonus_value}% BONUS
              </div>
            )}
          </motion.div>
        )}

        {/* ── Content card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            margin: fullBanner ? "-20px 16px 0" : "20px 16px 0",
            background: "#fff",
            border: "1px solid rgba(169,126,39,0.14)",
            borderRadius: 22,
            padding: "22px 20px 24px",
            boxShadow: "0 8px 32px rgba(133,104,74,0.1)",
            position: "relative", zIndex: 2,
          }}
        >
          {/* Title */}
          <div style={{
            fontSize: "1.3rem", fontWeight: 800, color: "#3e2b16",
            fontFamily: "'Playfair Display', serif", lineHeight: 1.2, marginBottom: 6,
          }}>
            {offer.title}
          </div>

          {/* Subtitle */}
          {offer.subtitle && (
            <div style={{ color: "#8a6b49", fontSize: "0.88rem", marginBottom: 12 }}>
              {offer.subtitle}
            </div>
          )}

          {/* Description */}
          {offer.description && (
            <div style={{
              color: "rgba(111,83,52,0.7)", fontSize: "0.8rem",
              lineHeight: 1.7, marginBottom: 18,
            }}>
              {offer.description}
            </div>
          )}

          {/* ── Meta pills ── */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
            {offer.bonus_value > 0 && (
              <div style={pill("#a9771c")}>🎁 {offer.bonus_value}% Gold Bonus</div>
            )}
            {daysLeft !== null && (
              <div style={pill(isExpired ? "#c0392b" : daysLeft <= 3 ? "#e67e22" : "#a9771c")}>
                ⏳ {isExpired ? "Expired" : daysLeft === 1 ? "Last day!" : `${daysLeft} days left`}
              </div>
            )}
            {offer.valid_to && (
              <div style={pill("#8a6b49")}>
                Valid till {new Date(offer.valid_to).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </div>
            )}
            {!offer.active && (
              <div style={pill("#c0392b")}>⚫ Inactive</div>
            )}
          </div>

          {/* ── PDF Section ── */}
          {fullPdf && (
            <div style={{
              background: "rgba(26,111,169,0.05)",
              border: "1px solid rgba(26,111,169,0.2)",
              borderRadius: 16, padding: "16px",
              marginBottom: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <PictureAsPdfIcon style={{ color: "#1a6fa9", fontSize: 28 }} />
                <div>
                  <div style={{ color: "#1a6fa9", fontWeight: 700, fontSize: "0.82rem" }}>
                    PDF Document Attached
                  </div>
                  <div style={{ color: "rgba(26,111,169,0.5)", fontSize: "0.62rem" }}>
                    Offer brochure / scheme details
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {/* View inline */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setPdfOpen(!pdfOpen)}
                  style={{
                    flex: 1, height: 40, borderRadius: 10,
                    border: "1px solid rgba(26,111,169,0.3)",
                    background: pdfOpen ? "rgba(26,111,169,0.1)" : "transparent",
                    color: "#1a6fa9", fontWeight: 700, fontSize: "0.75rem",
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 6,
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  <OpenInNewIcon style={{ fontSize: 15 }} />
                  {pdfOpen ? "Hide PDF" : "View PDF"}
                </motion.button>

                {/* Download */}
                <motion.a
                  whileTap={{ scale: 0.96 }}
                  href={fullPdf} download target="_blank" rel="noreferrer"
                  style={{
                    flex: 1, height: 40, borderRadius: 10,
                    background: "rgba(26,111,169,0.08)",
                    border: "1px solid rgba(26,111,169,0.2)",
                    color: "#1a6fa9", fontWeight: 700, fontSize: "0.75rem",
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 6,
                    textDecoration: "none", fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  <DownloadIcon style={{ fontSize: 15 }} />
                  Download
                </motion.a>
              </div>

              {/* Inline PDF viewer */}
              <AnimatePresence>
                {pdfOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 420 }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      marginTop: 12, borderRadius: 10, overflow: "hidden",
                      border: "1px solid rgba(26,111,169,0.15)",
                    }}
                  >
                    <iframe
                      src={fullPdf} title="Offer PDF"
                      style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── Divider ── */}
          {isAdmin && (
            <div style={{
              height: 1, background: "rgba(169,126,39,0.1)", margin: "4px 0 18px",
            }} />
          )}

          {/* ── Admin actions ── */}
          {isAdmin && (
            <div style={{ display: "flex", gap: 10 }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/offers/edit/${offer.id}`)}
                style={{
                  flex: 1, height: 46, borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #c9a227, #a9771c)",
                  color: "#fff", fontWeight: 800, fontSize: "0.8rem",
                  cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  boxShadow: "0 4px 14px rgba(169,119,28,0.25)",
                }}
              >
                <EditIcon style={{ fontSize: 16 }} /> Edit Offer
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
                style={{
                  flex: 1, height: 46, borderRadius: 12,
                  background: "rgba(192,57,43,0.07)",
                  border: "1px solid rgba(192,57,43,0.25)",
                  color: "#c0392b", fontWeight: 800, fontSize: "0.8rem",
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontFamily: "'Montserrat', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <DeleteIcon style={{ fontSize: 16 }} />
                {deleting ? "Deleting…" : "Delete"}
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>

      <Snackbar open={confirmOpen} onClose={() => setConfirmOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert
          severity="warning"
          onClose={() => setConfirmOpen(false)}
          action={(
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button color="inherit" size="small" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button
                color="inherit"
                size="small"
                onClick={async () => {
                  setConfirmOpen(false);
                  await handleDelete();
                }}
              >
                Delete
              </Button>
            </Box>
          )}
        >
          Delete this offer?
        </Alert>
      </Snackbar>
    </div>
  );
}

// ── Pill helper ───────────────────────────────────────────────────────────────
const pill = (color) => ({
  display: "inline-flex", alignItems: "center",
  padding: "4px 12px", borderRadius: 999,
  background: `${color}14`,
  border: `1px solid ${color}40`,
  color: color, fontSize: "0.68rem", fontWeight: 700,
  fontFamily: "'Montserrat', sans-serif",
});
