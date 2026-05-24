/**
 * Enhanced Header Component
 * Professional header with back button, title, and actions
 * Matches Malabar Gold app standards
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { goBackOrFallback } from '../../utils/navigation';
import { getDefaultRoute } from '../../utils/navigation';

export default function EnhancedHeader({
  title,
  subtitle,
  showBack = true,
  actions = [],
  onBackClick,
  backTarget,
  style = {},
  sticky = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const defaultRoute = getDefaultRoute();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
      return;
    }

    if (backTarget) {
      navigate(backTarget, { replace: false });
      return;
    }

    goBackOrFallback(navigate, location, defaultRoute);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: sticky ? 'sticky' : 'relative',
        top: sticky ? 'env(safe-area-inset-top, 0px)' : 0,
        zIndex: sticky ? 20 : 1,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(169, 126, 39, 0.12)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        {showBack && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: '1px solid rgba(169, 126, 39, 0.14)',
              background: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#6b4d26',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
            aria-label="Go back"
          >
            ‹
          </motion.button>
        )}

        <div style={{ minWidth: 0, flex: 1 }}>
          {title && (
            <div
              style={{
                fontSize: 'clamp(16px, 4vw, 20px)',
                fontWeight: 800,
                color: '#3e2b16',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </div>
          )}
          {subtitle && (
            <div
              style={{
                fontSize: 12,
                color: '#8a6b49',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {actions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {actions.map((action, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.onClick}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                border: '1px solid rgba(169, 126, 39, 0.14)',
                background: action.background || '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: action.color || '#6b4d26',
                fontSize: action.icon ? 18 : 14,
                fontWeight: 700,
                transition: 'all 0.2s ease',
              }}
              aria-label={action.label}
            >
              {action.icon || action.label}
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
