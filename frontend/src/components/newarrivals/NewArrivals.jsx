import React, { useEffect, useMemo, useState } from "react";
import { FavoriteBorder, Favorite, Close, ChevronLeft, ChevronRight, ArrowBackIosNew, PhotoCamera } from "@mui/icons-material";
import { Alert, Box, CircularProgress, Modal } from "@mui/material";
import axios from "axios";
import { motion } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import { useNavigate } from "react-router-dom";

export default function NewArrivals() {
  const [arrivals, setArrivals] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const isAdmin = (localStorage.getItem("role") || "").toLowerCase() === "admin";

  const getImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API}${path}`;
  };

  useEffect(() => {
    const fav = localStorage.getItem("favorites");
    if (fav) setFavorites(JSON.parse(fav));
  }, []);

  useEffect(() => {
    const fetchArrivals = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/api/newarrivals`);
        setArrivals(Array.isArray(res.data) ? res.data : []);
        setError("");
      } catch (fetchError) {
        setArrivals([]);
        setError("Unable to load new arrivals right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchArrivals();
  }, [API]);

  const toggleFavorite = (id, event) => {
    event.stopPropagation();
    const updated = favorites.includes(id)
      ? favorites.filter((item) => item !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  const item = selectedIndex !== null ? arrivals[selectedIndex] : null;

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (selectedIndex !== null && selectedIndex < arrivals.length - 1) setSelectedIndex((prev) => prev + 1);
      setZoom(1);
    },
    onSwipedRight: () => {
      if (selectedIndex !== null && selectedIndex > 0) setSelectedIndex((prev) => prev - 1);
      setZoom(1);
    },
    trackMouse: true,
  });

  const pageTitle = useMemo(() => `New Arrivals (${arrivals.length})`, [arrivals.length]);

  let lastTap = 0;
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) setZoom((value) => (value === 1 ? 2 : 1));
    lastTap = now;
  };

  return (
    <div className="app-safe-shell">
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 18 }}>
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
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: "1px solid rgba(169,126,39,0.14)",
                background: "#fff",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <ArrowBackIosNew sx={{ fontSize: 18, color: "#6b4d26" }} />
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#3e2b16" }}>{pageTitle}</div>
              <div style={{ fontSize: 12, color: "#85684a" }}>Fresh jewellery pieces, offers, and showcase items.</div>
            </div>
          </div>
          {isAdmin ? (
            <button
              onClick={() => navigate("/manage-newarrivals")}
              style={{
                height: 38,
                borderRadius: 12,
                border: "1px solid rgba(169,126,39,0.14)",
                background: "linear-gradient(135deg, #7B0000, #C0392B)",
                color: "#FFD700",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "0 12px",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: 12,
                whiteSpace: "nowrap",
              }}
            >
              <PhotoCamera sx={{ fontSize: 17 }} />
              Manage
            </button>
          ) : null}
        </div>

        {loading ? (
          <Box sx={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
            <CircularProgress sx={{ color: "#b88324" }} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : arrivals.length === 0 ? (
          <div
            style={{
              minHeight: "40vh",
              borderRadius: 24,
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(169,126,39,0.12)",
              boxShadow: "0 18px 36px rgba(133,104,74,0.08)",
              display: "grid",
              placeItems: "center",
              color: "#85684a",
              textAlign: "center",
              padding: 24,
            }}
          >
            No arrivals added yet.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {arrivals.map((arrival, index) => (
              <motion.div
                key={arrival.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedIndex(index);
                  setZoom(1);
                }}
                style={{
                  borderRadius: 22,
                  overflow: "hidden",
                  background: "#fff",
                  border: "1px solid rgba(169,126,39,0.12)",
                  boxShadow: "0 14px 30px rgba(133,104,74,0.06)",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    zIndex: 2,
                    background: "linear-gradient(135deg, #8B0000, #C0392B)",
                    color: "#FFD700",
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 999,
                    letterSpacing: "0.08em",
                  }}
                >
                  NEW
                </div>
                <button
                  onClick={(event) => toggleFavorite(arrival.id, event)}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 2,
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(255,255,255,0.88)",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                  }}
                >
                  {favorites.includes(arrival.id) ? <Favorite sx={{ color: "#C0392B", fontSize: 18 }} /> : <FavoriteBorder sx={{ color: "#999", fontSize: 18 }} />}
                </button>

                <img
                  src={getImageUrl(arrival.imageUrl)}
                  alt={arrival.title}
                  style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
                />

                <div style={{ padding: "14px 14px 16px", display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#3B0000" }}>{arrival.title}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#8B0000" }}>Rs {Number(arrival.price || 0).toLocaleString("en-IN")}</div>
                  {arrival.offer ? (
                    <div
                      style={{
                        width: "fit-content",
                        background: "linear-gradient(90deg, #8B0000, #C0392B)",
                        color: "#FFD700",
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: 999,
                      }}
                    >
                      {arrival.offer}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal open={selectedIndex !== null} onClose={() => setSelectedIndex(null)} sx={{ backdropFilter: "blur(6px)" }}>
        <div
          {...handlers}
          onClick={handleDoubleTap}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "92%",
            maxWidth: 440,
            maxHeight: "86vh",
            background: "#fff",
            borderRadius: 20,
            overflow: "hidden",
            outline: "none",
            boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
            border: "1.5px solid rgba(139,26,26,0.15)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #7B0000, #A50000)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#FFD700", letterSpacing: "0.12em" }}>PRODUCT DETAIL</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  if (selectedIndex > 0) {
                    setSelectedIndex((prev) => prev - 1);
                    setZoom(1);
                  }
                }}
                disabled={selectedIndex === 0}
                style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", opacity: selectedIndex === 0 ? 0.35 : 1 }}
              >
                <ChevronLeft sx={{ color: "#FFD700", fontSize: 18 }} />
              </button>
              <span style={{ color: "rgba(255,220,130,0.7)", fontSize: "0.6rem" }}>{selectedIndex !== null ? `${selectedIndex + 1}/${arrivals.length}` : ""}</span>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  if (selectedIndex < arrivals.length - 1) {
                    setSelectedIndex((prev) => prev + 1);
                    setZoom(1);
                  }
                }}
                disabled={selectedIndex === arrivals.length - 1}
                style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", opacity: selectedIndex === arrivals.length - 1 ? 0.35 : 1 }}
              >
                <ChevronRight sx={{ color: "#FFD700", fontSize: 18 }} />
              </button>
              <button onClick={() => setSelectedIndex(null)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer" }}>
                <Close sx={{ color: "#fff", fontSize: 16 }} />
              </button>
            </div>
          </div>

          <div style={{ background: "#FDF5F0", padding: 16, textAlign: "center" }}>
            <img
              src={getImageUrl(item?.imageUrl)}
              alt={item?.title}
              style={{
                maxWidth: "100%",
                maxHeight: 280,
                objectFit: "contain",
                borderRadius: 12,
                transform: `scale(${zoom})`,
                transition: "transform 0.3s ease",
              }}
            />
          </div>

          <div style={{ padding: "16px 20px 20px", display: "grid", gap: 10 }}>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#3B0000" }}>{item?.title}</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#8B0000" }}>Rs {Number(item?.price || 0).toLocaleString("en-IN")}</div>
            {item?.offer ? (
              <div style={{ display: "inline-block", background: "linear-gradient(135deg, #8B0000, #C0392B)", color: "#FFD700", fontSize: "0.65rem", fontWeight: 700, padding: "4px 14px", borderRadius: 20, width: "fit-content" }}>
                {item.offer}
              </div>
            ) : null}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                onClick={(event) => toggleFavorite(item?.id, event)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  border: "1.5px solid rgba(139,26,26,0.25)",
                  background: favorites.includes(item?.id) ? "#FEF0F0" : "#fff",
                  color: "#8B0000",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  cursor: "pointer",
                }}
              >
                {favorites.includes(item?.id) ? "Saved" : "Save"}
              </button>
              <button
                onClick={() => setSelectedIndex(null)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, #7B0000, #C0392B)",
                  color: "#FFD700",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
