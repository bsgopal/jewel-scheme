/**
 * EnhancedHeader — Premium page header for all screens
 * Features: sticky glass blur, gold accent line, back button,
 *           optional logo, action buttons, subtitle support.
 */

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { goBackOrFallback, getDefaultRoute } from "../../utils/navigation";
import logo from "../renic-tech-logo.svg";

export default function EnhancedHeader({
  title,
  subtitle,
  showBack = true,
  showLogo = false,
  actions = [],        // [{ icon, label, onClick, background, color }]
  onBackClick,
  backTarget,
  style = {},
  sticky = true,
  accentColor = "linear-gradient(90deg,#c9a227,#a9771c,#7a5a28)",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const defaultRoute = getDefaultRoute();

  const handleBack = () => {
    if (onBackClick) { onBackClick(); return; }
    if (backTarget) { navigate(backTarget, { replace: false }); return; }
    goBackOrFallback(navigate, location, defaultRoute);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      style={{
        position: sticky ? "sticky" : "relative",
        top: sticky ? "env(safe-area-inset-top, 0px)" : 0,
        zIndex: 20,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 2px 18px rgba(133,104,74,0.09)",
        ...style,
      }}
    >
      {/* Gold accent line */}
      <div style={{
        height: 3,
        background: accentColor,
        borderRadius: "0 0 2px 2px",
      }} />

      {/* Main row */}
      <div style={{
        padding: "11px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        minHeight: 54,
      }}>
        {/* Left: back + logo/title */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
          {showBack && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleBack}
              aria-label="Go back"
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: "1px solid rgba(169,126,39,0.18)",
                background: "#fffaf5",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                color: "#a9771c",
                flexShrink: 0,
                fontWeight: 700,
              }}
            >
              ‹
            </motion.button>
          )}

          {showLogo && (
            <img
              src={logo}
              alt="Logo"
              style={{ width: 36, height: 30, objectFit: "contain", flexShrink: 0 }}
            />
          )}

          <div style={{ minWidth: 0, flex: 1 }}>
            {title && (
              <div style={{
                fontSize: "clamp(15px, 3.8vw, 19px)",
                fontWeight: 800,
                color: "#3e2b16",
                lineHeight: 1.18,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "'Playfair Display', serif",
              }}>
                {title}
              </div>
            )}
            {subtitle && (
              <div style={{
                fontSize: 11,
                color: "#8a6b49",
                marginTop: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: 500,
              }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Right: action buttons */}
        {actions.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {actions.map((action, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={action.onClick}
                aria-label={action.label}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  border: "1px solid rgba(169,126,39,0.18)",
                  background: action.background || "#fffaf5",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: action.color || "#a9771c",
                  fontSize: action.icon ? 18 : 13,
                  fontWeight: 700,
                }}
              >
                {action.icon || action.label}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
