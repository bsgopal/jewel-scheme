import React, { useCallback, useEffect, useMemo, useState } from "react";
import { TextField } from "@mui/material";
import { ArrowBack, Delete, Add, PhotoCamera, Edit, Close, Check } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { goBackOrFallback } from "../../utils/navigation";

/* ── Shared input style ── */
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "rgba(255,255,255,0.07)",
    color: "#fff",
    "& fieldset": { borderColor: "rgba(255,200,80,0.25)" },
    "&:hover fieldset": { borderColor: "rgba(255,200,80,0.55)" },
    "&.Mui-focused fieldset": { borderColor: "#FFD700", borderWidth: 1.5 },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,200,80,0.6)", fontSize: "0.88rem" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#FFD700" },
  "& .MuiInputBase-input": { color: "#fff", fontSize: "0.9rem" },
};

/* ── Edit Modal field style (light background) ── */
const editFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "rgba(139,0,0,0.05)",
    color: "#3B0000",
    "& fieldset": { borderColor: "rgba(139,0,0,0.2)" },
    "&:hover fieldset": { borderColor: "rgba(139,0,0,0.45)" },
    "&.Mui-focused fieldset": { borderColor: "#8B0000", borderWidth: 1.5 },
  },
  "& .MuiInputLabel-root": { color: "rgba(139,0,0,0.55)", fontSize: "0.85rem" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#8B0000" },
  "& .MuiInputBase-input": { color: "#3B0000", fontSize: "0.88rem" },
};

export default function ManageNewArrivals() {
  /* ── Add form state ── */
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [offer, setOffer] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  /* ── Arrivals list ── */
  const [arrivals, setArrivals] = useState([]);

  /* ── Edit state ── */
  const [editItem, setEditItem] = useState(null);       // item being edited
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editOffer, setEditOffer] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editUploading, setEditUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const API = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");
  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  /* ── Fetch ── */
  const fetchArrivals = useCallback(() => {
    axios
      .get(`${API}/api/newarrivals`, { headers })
      .then((res) => setArrivals(res.data))
      .catch(() => {
        // Failed to fetch arrivals
      });
  }, [API, headers]);

  useEffect(() => { fetchArrivals(); }, [fetchArrivals]);

  /* ── Upload helper (reusable) ── */
  const uploadImage = async (file, setUrl, setLoading) => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await axios.post(`${API}/api/newarrivals/upload`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      setUrl(res.data.url);
    } catch (err) {
      // Upload failed
    } finally {
      setLoading(false);
    }
  };

  /* ── Add ── */
  const handleSubmit = () => {
    if (!title || !price || !imageUrl) return;
    setIsSubmitting(true);
    axios
      .post(`${API}/api/newarrivals`, { title, price, offer, image_url: imageUrl }, { headers })
      .then(() => {
        fetchArrivals();
        setTitle(""); setPrice(""); setOffer(""); setImageUrl("");
      })
      .finally(() => setIsSubmitting(false));
  };

  /* ── Delete ── */
  const handleDelete = (id) => {
    axios.delete(`${API}/api/newarrivals/${id}`, { headers }).then(fetchArrivals);
  };

  /* ── Open edit modal ── */
  const openEdit = (item) => {
    setEditItem(item);
    setEditTitle(item.title);
    setEditPrice(String(item.price));
    setEditOffer(item.offer || "");
    setEditImageUrl(item.imageUrl || item.image_url || "");
  };

  /* ── Close edit modal ── */
  const closeEdit = () => {
    setEditItem(null);
    setEditTitle(""); setEditPrice(""); setEditOffer(""); setEditImageUrl("");
  };

  /* ── Save edit ── */
  const handleSave = () => {
    if (!editTitle || !editPrice || !editImageUrl) return;
    setIsSaving(true);
    axios
      .put(
        `${API}/api/newarrivals/${editItem.id}`,
        { title: editTitle, price: editPrice, offer: editOffer, image_url: editImageUrl },
        { headers }
      )
      .then(() => { fetchArrivals(); closeEdit(); })
      .catch(() => {
        // Failed to save
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FAF5F0",
      fontFamily: "'Montserrat', sans-serif",
      paddingTop: "env(safe-area-inset-top)",
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #7B0000, #A50000)",
        padding: "0 16px",
        height: 60,
        display: "flex", alignItems: "center", gap: 12,
        borderBottom: "1.5px solid rgba(255,200,80,0.3)",
        boxShadow: "0 3px 16px rgba(100,0,0,0.35)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => goBackOrFallback(navigate, location, "/newarrivals")}
          style={{
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,200,80,0.3)",
            borderRadius: 10, padding: "6px 8px", cursor: "pointer",
            display: "flex", alignItems: "center",
          }}
        >
          <ArrowBack style={{ color: "#FFD700", fontSize: 20 }} />
        </motion.button>
        <div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#FFD700", fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
            Manage Arrivals
          </div>
          <div style={{ fontSize: "0.45rem", color: "rgba(255,220,130,0.7)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Add · Edit · Remove
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 40px" }}>

        {/* ── Add Form Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
        >
          <div style={{
            background: "linear-gradient(145deg, #7B0000, #A50000)",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 8px 32px rgba(100,0,0,0.3)",
            border: "1px solid rgba(255,200,80,0.2)",
            marginBottom: 28,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,200,80,0.2)" }} />
              <span style={{ fontSize: "0.6rem", color: "rgba(255,215,0,0.7)", letterSpacing: "0.2em", fontWeight: 700 }}>
                ✦ NEW ARRIVAL ✦
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,200,80,0.2)" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <TextField fullWidth label="Jewellery Name" value={title}
                onChange={(e) => setTitle(e.target.value)} variant="outlined" sx={fieldSx} />
              <TextField fullWidth label="Price (₹)" type="number" value={price}
                onChange={(e) => setPrice(e.target.value)} variant="outlined" sx={fieldSx} />
              <TextField fullWidth label="Offer (optional)" value={offer}
                onChange={(e) => setOffer(e.target.value)} variant="outlined" sx={fieldSx} />

              <label style={{ cursor: "pointer" }}>
                <input type="file" hidden accept="image/*"
                  onChange={(e) => uploadImage(e.target.files[0], setImageUrl, setUploading)} />
                <div style={{
                  border: "1.5px dashed rgba(255,200,80,0.4)",
                  borderRadius: 12, padding: "14px",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: "rgba(255,255,255,0.06)", cursor: "pointer",
                }}>
                  <PhotoCamera style={{ color: "#FFD700", fontSize: 20 }} />
                  <span style={{ color: "rgba(255,215,0,0.8)", fontSize: "0.75rem", fontWeight: 600 }}>
                    {uploading ? "Uploading…" : imageUrl ? "Change Image" : "Upload Image"}
                  </span>
                </div>
              </label>

              <AnimatePresence>
                {imageUrl && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <img src={`${API}${imageUrl}`} alt="preview"
                      style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 12, border: "1.5px solid rgba(255,200,80,0.3)" }} />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}
                onClick={handleSubmit}
                disabled={isSubmitting || !title || !price || !imageUrl}
                style={{
                  height: 48, borderRadius: 12, border: "none",
                  background: isSubmitting || !title || !price || !imageUrl
                    ? "rgba(255,215,0,0.3)" : "linear-gradient(135deg, #FFD700, #E8A000)",
                  color: "#3B0000", fontWeight: 800, fontSize: "0.85rem",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontFamily: "'Montserrat', sans-serif", letterSpacing: "0.1em",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                }}
              >
                <Add style={{ fontSize: 18 }} />
                {isSubmitting ? "Adding…" : "ADD ARRIVAL"}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ── Arrivals Grid ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, #C0392B)" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#8B0000", letterSpacing: "0.2em" }}>
            ✦ ALL ARRIVALS ✦
          </span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, #C0392B)" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <AnimatePresence>
            {arrivals.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ y: -4 }}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 14,
                  overflow: "hidden",
                  border: "1.5px solid rgba(139,26,26,0.12)",
                  boxShadow: "0 4px 16px rgba(139,26,26,0.08)",
                  position: "relative",
                }}
              >
                <img
                  src={`${API}${item.imageUrl || item.image_url}`} alt={item.title}
                  style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }}
                />

                {/* ── Action buttons: Edit + Delete ── */}
                <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 5 }}>
                  {/* Edit */}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => openEdit(item)}
                    style={{
                      background: "rgba(20,20,20,0.75)", border: "none",
                      borderRadius: "50%", width: 28, height: 28,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", backdropFilter: "blur(4px)",
                    }}
                  >
                    <Edit style={{ fontSize: 13, color: "#FFD700" }} />
                  </motion.button>

                  {/* Delete */}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => handleDelete(item.id)}
                    style={{
                      background: "rgba(139,0,0,0.85)", border: "none",
                      borderRadius: "50%", width: 28, height: 28,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Delete style={{ fontSize: 13, color: "#fff" }} />
                  </motion.button>
                </div>

                <div style={{ padding: "10px 10px 12px" }}>
                  <div style={{
                    fontSize: "0.65rem", fontWeight: 700, color: "#3B0000",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3,
                  }}>{item.title}</div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#8B0000", fontFamily: "'Playfair Display', serif" }}>
                    ₹{item.price}
                  </div>
                  {item.offer && (
                    <div style={{
                      marginTop: 5,
                      background: "linear-gradient(90deg, #8B0000, #C0392B)",
                      color: "#FFD700", fontSize: "0.5rem", fontWeight: 700,
                      padding: "2px 7px", borderRadius: 8, display: "inline-block",
                    }}>{item.offer}</div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {arrivals.length === 0 && (
          <div style={{
            textAlign: "center", padding: "40px 20px",
            color: "#B09060", fontSize: "0.75rem", fontStyle: "italic",
          }}>
            No arrivals added yet
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          ── Edit Modal (Bottom Sheet style) ──
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {editItem && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeEdit}
              style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.55)",
                zIndex: 200,
                backdropFilter: "blur(3px)",
              }}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              style={{
                position: "fixed",
                bottom: 0, left: 0, right: 0,
                zIndex: 210,
                background: "#FFF8F2",
                borderRadius: "24px 24px 0 0",
                padding: "0 20px 40px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 -8px 40px rgba(100,0,0,0.25)",
                border: "1.5px solid rgba(139,0,0,0.15)",
                borderBottom: "none",
              }}
            >
              {/* Drag handle */}
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(139,0,0,0.2)" }} />
              </div>

              {/* Modal header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 0 18px",
                borderBottom: "1px solid rgba(139,0,0,0.1)",
                marginBottom: 20,
              }}>
                <div>
                  <div style={{
                    fontSize: "1rem", fontWeight: 800, color: "#7B0000",
                    fontFamily: "'Playfair Display', serif", lineHeight: 1,
                  }}>
                    Edit Arrival
                  </div>
                  <div style={{ fontSize: "0.55rem", color: "rgba(139,0,0,0.5)", letterSpacing: "0.18em", marginTop: 3 }}>
                    UPDATE DETAILS
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={closeEdit}
                  style={{
                    background: "rgba(139,0,0,0.08)", border: "1px solid rgba(139,0,0,0.15)",
                    borderRadius: 10, width: 34, height: 34,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Close style={{ fontSize: 18, color: "#8B0000" }} />
                </motion.button>
              </div>

              {/* Current image preview */}
              {editImageUrl && (
                <div style={{ marginBottom: 16, position: "relative" }}>
                  <img
                    src={`${API}${editImageUrl}`}
                    alt="current"
                    style={{
                      width: "100%", height: 160, objectFit: "cover",
                      borderRadius: 14, border: "1.5px solid rgba(139,0,0,0.15)",
                    }}
                  />
                  <div style={{
                    position: "absolute", bottom: 8, left: 8,
                    background: "rgba(0,0,0,0.6)", borderRadius: 6,
                    padding: "2px 8px", fontSize: "0.55rem", color: "#FFD700", fontWeight: 700,
                    letterSpacing: "0.1em",
                  }}>
                    CURRENT IMAGE
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <TextField
                  fullWidth label="Jewellery Name" value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  variant="outlined" sx={editFieldSx}
                />
                <TextField
                  fullWidth label="Price (₹)" type="number" value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  variant="outlined" sx={editFieldSx}
                />
                <TextField
                  fullWidth label="Offer (optional)" value={editOffer}
                  onChange={(e) => setEditOffer(e.target.value)}
                  variant="outlined" sx={editFieldSx}
                />

                {/* Change image upload */}
                <label style={{ cursor: "pointer" }}>
                  <input type="file" hidden accept="image/*"
                    onChange={(e) => uploadImage(e.target.files[0], setEditImageUrl, setEditUploading)} />
                  <div style={{
                    border: "1.5px dashed rgba(139,0,0,0.3)",
                    borderRadius: 12, padding: "13px",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    background: "rgba(139,0,0,0.04)", cursor: "pointer",
                  }}>
                    <PhotoCamera style={{ color: "#8B0000", fontSize: 18 }} />
                    <span style={{ color: "#8B0000", fontSize: "0.75rem", fontWeight: 600 }}>
                      {editUploading ? "Uploading…" : "Replace Image"}
                    </span>
                  </div>
                </label>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  {/* Cancel */}
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={closeEdit}
                    style={{
                      flex: 1, height: 46, borderRadius: 12,
                      border: "1.5px solid rgba(139,0,0,0.2)",
                      background: "transparent",
                      color: "#8B0000", fontWeight: 700, fontSize: "0.8rem",
                      cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
                      letterSpacing: "0.08em",
                    }}
                  >
                    CANCEL
                  </motion.button>

                  {/* Save */}
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={handleSave}
                    disabled={isSaving || !editTitle || !editPrice || !editImageUrl}
                    style={{
                      flex: 2, height: 46, borderRadius: 12, border: "none",
                      background: isSaving || !editTitle || !editPrice || !editImageUrl
                        ? "rgba(139,0,0,0.2)"
                        : "linear-gradient(135deg, #7B0000, #C0392B)",
                      color: isSaving || !editTitle || !editPrice || !editImageUrl ? "rgba(139,0,0,0.4)" : "#FFD700",
                      fontWeight: 800, fontSize: "0.82rem",
                      cursor: isSaving ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      fontFamily: "'Montserrat', sans-serif", letterSpacing: "0.1em",
                      boxShadow: isSaving ? "none" : "0 4px 16px rgba(139,0,0,0.3)",
                    }}
                  >
                    <Check style={{ fontSize: 16 }} />
                    {isSaving ? "SAVING…" : "SAVE CHANGES"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
