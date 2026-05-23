import { Box, Typography, Chip } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const API = process.env.REACT_APP_API_URL;

export default function OfferCard({ offer }) {
  const navigate = useNavigate();
  const hasBanner = Boolean(offer.banner_url || offer.image_url);
  const hasPdf = Boolean(offer.pdf_url);

  const imageUrl = offer.banner_url || offer.image_url;
  const fullImageUrl = imageUrl
    ? imageUrl.startsWith("http") ? imageUrl : `${API}${imageUrl}`
    : null;

  const daysLeft = offer.valid_to
    ? Math.ceil((new Date(offer.valid_to) - new Date()) / 86400000)
    : null;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/offers/${offer.id}`)}
      style={{
        marginBottom: 16,
        borderRadius: 22,
        overflow: "hidden",
        cursor: "pointer",
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(10px)",
        border: "1.5px solid rgba(255,215,0,0.25)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
      }}
    >
      {/* Banner image */}
      {fullImageUrl ? (
        <div style={{ height: 180, position: "relative", overflow: "hidden" }}>
          <img
            src={fullImageUrl} alt={offer.title}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          {/* gradient overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.65) 100%)",
          }} />

          {/* Type badges top-left */}
          <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
            {hasBanner && (
              <div style={{
                background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,215,0,0.4)",
                borderRadius: 999, padding: "3px 9px",
                fontSize: "0.6rem", color: "#FFD700", fontWeight: 700,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <ImageIcon style={{ fontSize: 11 }} /> BANNER
              </div>
            )}
            {hasPdf && (
              <div style={{
                background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
                border: "1px solid rgba(130,207,255,0.4)",
                borderRadius: 999, padding: "3px 9px",
                fontSize: "0.6rem", color: "#82CFFF", fontWeight: 700,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <PictureAsPdfIcon style={{ fontSize: 11 }} /> PDF
              </div>
            )}
          </div>

          {/* Bonus badge */}
          {offer.bonus_value > 0 && (
            <div style={{
              position: "absolute", bottom: 10, right: 10,
              background: "linear-gradient(135deg, #FFD700, #E8A000)",
              color: "#3B0000", fontWeight: 800, fontSize: "0.82rem",
              padding: "5px 12px", borderRadius: 999,
              boxShadow: "0 4px 12px rgba(255,215,0,0.4)",
            }}>
              {offer.bonus_value}% BONUS
            </div>
          )}
        </div>
      ) : (
        /* No image fallback */
        <div style={{
          height: 80,
          background: "linear-gradient(135deg, #330044, #5b006b)",
          display: "flex", alignItems: "center", padding: "0 18px", gap: 10,
        }}>
          {hasPdf && <PictureAsPdfIcon style={{ color: "#82CFFF", fontSize: 28 }} />}
          <Typography sx={{ color: "#FFD700", fontWeight: 800, fontSize: "1rem" }}>
            {offer.title}
          </Typography>
        </div>
      )}

      {/* Text body */}
      <div style={{ padding: "14px 16px 16px" }}>
        <Typography sx={{ color: "#FFD700", fontWeight: 800, fontSize: "1rem", lineHeight: 1.2 }}>
          {offer.title}
        </Typography>
        {offer.subtitle && (
          <Typography sx={{ color: "#ffdca8", fontSize: "0.85rem", mt: 0.5 }}>
            {offer.subtitle}
          </Typography>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          {/* Valid till */}
          {daysLeft !== null && (
            <Typography sx={{
              color: daysLeft <= 3 ? "#FF8080" : "#ffcc66",
              fontSize: "0.75rem", fontWeight: 600,
            }}>
              {daysLeft <= 0 ? "⚠ Expired" : daysLeft === 1 ? "⏳ Last day!" : `⏳ ${daysLeft} days left`}
            </Typography>
          )}

          {/* PDF pill */}
          {hasPdf && (
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "rgba(130,207,255,0.12)",
              border: "1px solid rgba(130,207,255,0.3)",
              borderRadius: 999, padding: "3px 9px",
              fontSize: "0.62rem", color: "#82CFFF", fontWeight: 700,
            }}>
              <PictureAsPdfIcon style={{ fontSize: 11 }} /> View PDF
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
