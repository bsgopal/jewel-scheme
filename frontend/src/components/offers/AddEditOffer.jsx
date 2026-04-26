import {
  TextField, IconButton, Switch
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ImageIcon from "@mui/icons-material/Image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const API = process.env.REACT_APP_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    backgroundColor: "#fff",
    color: "#3e2b16",
    "& fieldset": { borderColor: "rgba(169,126,39,0.2)" },
    "&:hover fieldset": { borderColor: "rgba(169,126,39,0.5)" },
    "&.Mui-focused fieldset": { borderColor: "#a9771c", borderWidth: 1.5 },
  },
  "& .MuiInputLabel-root": { color: "rgba(139,97,30,0.6)", fontSize: "0.86rem" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#a9771c" },
  "& .MuiInputBase-input": { color: "#3e2b16", fontSize: "0.9rem" },
  "& .MuiInputBase-input[type=date]": { colorScheme: "light" },
};

function UploadZone({ label, icon: Icon, accept, uploaded, uploading, onFile, onClear, preview, color }) {
  return (
    <div>
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: 8, borderRadius: 14, overflow: "hidden", position: "relative" }}
          >
            {accept.includes("image") ? (
              <img src={preview} alt="preview"
                style={{ width: "100%", height: 160, objectFit: "cover", display: "block", borderRadius: 14 }} />
            ) : (
              <div style={{
                background: "#fff", padding: "14px 16px", display: "flex",
                alignItems: "center", gap: 10, borderRadius: 14,
                border: "1.5px solid rgba(169,126,39,0.2)",
              }}>
                <PictureAsPdfIcon style={{ color: "#c0392b", fontSize: 28 }} />
                <span style={{ color: "#3e2b16", fontSize: "0.8rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {uploaded?.split("/").pop()}
                </span>
                <CheckCircleIcon style={{ color: "#27ae60", fontSize: 20 }} />
              </div>
            )}
            <button onClick={onClear} style={{
              position: "absolute", top: 8, right: 8,
              background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%",
              width: 26, height: 26, color: "#fff", cursor: "pointer", fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>
      <label style={{ cursor: "pointer", display: "block" }}>
        <input type="file" hidden accept={accept} onChange={(e) => onFile(e.target.files[0])} />
        <div style={{
          border: `1.5px dashed ${uploaded ? color : "rgba(169,126,39,0.3)"}`,
          borderRadius: 14, padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12,
          background: uploaded ? `${color}12` : "#fffdf9",
          transition: "all 0.2s",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: uploaded ? `${color}18` : "#fff4e2",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon style={{ color: uploaded ? color : "#c9a227", fontSize: 22 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: uploaded ? color : "#6f5334", fontSize: "0.82rem", fontWeight: 700 }}>
              {uploading ? "Uploading…" : uploaded ? `Change ${label}` : label}
            </div>
            <div style={{ color: "rgba(111,83,52,0.45)", fontSize: "0.65rem", marginTop: 2 }}>
              {accept.includes("pdf") ? "PDF files only" : "JPG, PNG, WEBP"}
            </div>
          </div>
          {uploaded && <CheckCircleIcon style={{ color: "#27ae60", fontSize: 20 }} />}
        </div>
      </label>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <div style={{ flex: 1, height: 1, background: "rgba(169,126,39,0.15)" }} />
      <span style={{ fontSize: "0.58rem", color: "rgba(139,97,30,0.5)", letterSpacing: "0.2em", fontWeight: 800 }}>
        {children.toUpperCase()}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(169,126,39,0.15)" }} />
    </div>
  );
}

export default function AddEditOffer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: "", subtitle: "", description: "",
    bonus: "", validFrom: "", validTill: "", active: true,
  });
  const [bannerPreview, setBannerPreview] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfUploading, setPdfUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    fetch(`${API}/api/offers/${id}`)
      .then((r) => r.json())
      .then((offer) => {
        setForm({
          title: offer.title || "",
          subtitle: offer.subtitle || "",
          description: offer.description || "",
          bonus: offer.bonus_value || "",
          validFrom: offer.valid_from ? offer.valid_from.slice(0, 10) : "",
          validTill: offer.valid_to ? offer.valid_to.slice(0, 10) : "",
          active: offer.active ?? true,
        });
        if (offer.banner_url) { setBannerUrl(offer.banner_url); setBannerPreview(`${API}${offer.banner_url}`); }
        if (offer.pdf_url) setPdfUrl(offer.pdf_url);
      });
  }, [id, isEdit]);

  const uploadFile = async (file, type, setUrl, setUploading) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("fileType", type);
    try {
      const res = await fetch(`${API}/api/offers/upload`, { method: "POST", headers: authHeaders(), body: fd });
      const data = await res.json();
      if (data.url) setUrl(data.url);
    } catch { setError("Upload failed."); }
    finally { setUploading(false); }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const offerType = bannerUrl ? "banner" : pdfUrl ? "pdf" : "standard";

  const typeBadge = {
    banner:   { label: "🖼 Banner → Home Slider", color: "#a9771c", bg: "#fff4e2", border: "rgba(169,118,28,0.25)" },
    pdf:      { label: "📄 PDF Offer",            color: "#1a6fa9", bg: "#e8f4ff", border: "rgba(26,111,169,0.25)" },
    standard: { label: "🏷 Standard Offer",       color: "#8a6b49", bg: "#f5f0e8", border: "rgba(138,107,73,0.2)" },
  }[offerType];

  const handleSave = async () => {
    if (!form.title) return setError("Title is required.");
    setSaving(true); setError("");
    const body = {
      title: form.title, subtitle: form.subtitle, description: form.description,
      bonus_value: form.bonus || 0,
      valid_from: form.validFrom || undefined,
      valid_to: form.validTill || undefined,
      active: form.active,
      banner_url: bannerUrl || undefined,
      image_url: bannerUrl || undefined,
      pdf_url: pdfUrl || undefined,
      type: offerType,
    };
    try {
      const res = await fetch(
        isEdit ? `${API}/api/offers/${id}` : `${API}/api/offers`,
        { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(body) }
      );
      const data = await res.json();
      if (data.success) navigate("/manage-offers");
      else setError(data.message || "Save failed.");
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #fffdf8 0%, #fff4df 100%)",
      fontFamily: "'Montserrat', sans-serif",
      paddingBottom: 48,
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
        <IconButton
          onClick={() => navigate("/manage-offers")}
          sx={{
            color: "#a9771c", background: "#fff4e2",
            border: "1px solid rgba(169,118,28,0.15)", borderRadius: "10px", p: 0.8,
            "&:hover": { background: "#ffe8bb" },
          }}
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#3e2b16", fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
            {isEdit ? "Edit Offer" : "Add Offer"}
          </div>
          <div style={{ fontSize: "0.5rem", color: "#a9771c", letterSpacing: "0.18em", marginTop: 1 }}>
            {isEdit ? "UPDATE DETAILS" : "CREATE NEW"}
          </div>
        </div>

        <div style={{
          background: typeBadge.bg, border: `1px solid ${typeBadge.border}`,
          borderRadius: 999, padding: "5px 11px",
          fontSize: "0.6rem", fontWeight: 700, color: typeBadge.color, whiteSpace: "nowrap",
        }}>
          {typeBadge.label}
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px" }}>

        {/* Info tip */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "#fff8ec", border: "1px solid rgba(169,126,39,0.18)",
            borderRadius: 14, padding: "12px 16px", marginBottom: 20,
            fontSize: "0.72rem", color: "#6f5334", lineHeight: 1.7,
            boxShadow: "0 4px 14px rgba(133,104,74,0.06)",
          }}
        >
          <strong style={{ color: "#a9771c" }}>How offer types work:</strong><br />
          🖼 Upload a <strong>Banner image</strong> → appears in the <strong>home slider</strong> automatically.<br />
          📄 Attach a <strong>PDF</strong> → customers view/download from the offer details page.<br />
          ✅ You can combine both on the same offer.
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          style={{
            background: "#fff",
            border: "1px solid rgba(169,126,39,0.12)",
            borderRadius: 22, padding: "22px 20px",
            boxShadow: "0 14px 40px rgba(133,104,74,0.1)",
          }}
        >
          <SectionLabel>Offer Details</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
            <TextField fullWidth label="Offer Title *" variant="outlined" sx={fieldSx} {...field("title")} />
            <TextField fullWidth label="Subtitle" variant="outlined" sx={fieldSx} {...field("subtitle")} />
            <TextField fullWidth label="Description (optional)" variant="outlined" multiline rows={2} sx={fieldSx} {...field("description")} />
            <TextField fullWidth label="Bonus % (e.g. 15)" type="number" variant="outlined" sx={fieldSx} {...field("bonus")} />
          </div>

          <SectionLabel>Validity</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <TextField label="Valid From" type="date" variant="outlined"
              sx={fieldSx} InputLabelProps={{ shrink: true }} {...field("validFrom")} />
            <TextField label="Valid Till" type="date" variant="outlined"
              sx={fieldSx} InputLabelProps={{ shrink: true }} {...field("validTill")} />
          </div>

          <SectionLabel>Media</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            <UploadZone
              label="Upload Banner Image"
              icon={ImageIcon}
              accept="image/*"
              uploaded={bannerUrl}
              uploading={bannerUploading}
              preview={bannerPreview}
              color="#a9771c"
              onFile={(f) => { setBannerPreview(URL.createObjectURL(f)); uploadFile(f, "image", setBannerUrl, setBannerUploading); }}
              onClear={() => { setBannerUrl(""); setBannerPreview(""); }}
            />
            <UploadZone
              label="Attach PDF (optional)"
              icon={PictureAsPdfIcon}
              accept="application/pdf"
              uploaded={pdfUrl}
              uploading={pdfUploading}
              preview={pdfUrl ? "pdf" : ""}
              color="#1a6fa9"
              onFile={(f) => uploadFile(f, "pdf", setPdfUrl, setPdfUploading)}
              onClear={() => setPdfUrl("")}
            />
          </div>

          {/* Active toggle */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderRadius: 14,
            background: "#fffdf9", border: "1px solid rgba(169,126,39,0.12)", marginBottom: 22,
          }}>
            <div>
              <div style={{ color: "#3e2b16", fontWeight: 700, fontSize: "0.85rem" }}>Active</div>
              <div style={{ color: "#a9771c", fontSize: "0.65rem", marginTop: 2 }}>
                Inactive offers are hidden from customers
              </div>
            </div>
            <Switch
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: "#a9771c" },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#c9a227" },
              }}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: 16, padding: "10px 14px", borderRadius: 10,
              background: "#fff0f0", border: "1px solid rgba(192,57,43,0.25)",
              color: "#c0392b", fontSize: "0.75rem",
            }}>{error}</div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={handleSave}
            disabled={saving || bannerUploading || pdfUploading}
            style={{
              width: "100%", height: 50, borderRadius: 14, border: "none",
              background: saving ? "rgba(169,119,28,0.25)" : "linear-gradient(135deg, #c9a227, #a9771c)",
              color: "#fff", fontWeight: 800, fontSize: "0.88rem",
              cursor: saving ? "not-allowed" : "pointer",
              letterSpacing: "0.1em", fontFamily: "'Montserrat', sans-serif",
              boxShadow: saving ? "none" : "0 6px 20px rgba(169,119,28,0.3)",
            }}
          >
            {saving ? "Saving…" : isEdit ? "SAVE CHANGES" : "PUBLISH OFFER"}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}