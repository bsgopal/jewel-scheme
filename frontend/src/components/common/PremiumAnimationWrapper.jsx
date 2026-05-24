import React from 'react';
import { motion } from 'framer-motion';

const easeInOutCubic = [0.4, 0, 0.2, 1];

export const PremiumCard = ({ children, delay = 0, onClick, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.6, delay, ease: easeInOutCubic }}
    whileHover={{ 
      y: -8,
      boxShadow: '0 24px 48px rgba(133, 104, 74, 0.15)',
      transition: { duration: 0.3 }
    }}
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    style={{
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: onClick ? 'pointer' : 'default',
      ...props.style
    }}
    {...props}
  >
    {children}
  </motion.div>
);

export const PremiumButton = ({ children, onClick, ...props }) => (
  <motion.button
    whileHover={{ 
      scale: 1.05,
      boxShadow: '0 12px 32px rgba(200, 155, 60, 0.25)',
      transition: { duration: 0.3 }
    }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    style={{
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      ...props.style
    }}
    {...props}
  >
    {children}
  </motion.button>
);

export const SectionTitle = ({ children, ...props }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, ease: easeInOutCubic }}
    whileHover={{ color: '#c89b3c' }}
    style={{
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      ...props.style
    }}
    {...props}
  >
    {children}
  </motion.div>
);

export const StaggerContainer = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{
      staggerChildren: 0.1,
      delayChildren: delay,
    }}
  >
    {children}
  </motion.div>
);

export const FadeInUp = ({ children, delay = 0, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: easeInOutCubic }}
    {...props}
  >
    {children}
  </motion.div>
);

export const ScaleIn = ({ children, delay = 0, ...props }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6, delay, ease: easeInOutCubic }}
    {...props}
  >
    {children}
  </motion.div>
);

export const HoverLift = ({ children, ...props }) => (
  <motion.div
    whileHover={{ y: -8, transition: { duration: 0.3 } }}
    {...props}
  >
    {children}
  </motion.div>
);

export const PulseGlow = ({ children, ...props }) => (
  <motion.div
    animate={{
      boxShadow: [
        '0 4px 12px rgba(200, 155, 60, 0.2)',
        '0 8px 24px rgba(200, 155, 60, 0.4)',
        '0 4px 12px rgba(200, 155, 60, 0.2)',
      ],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
    {...props}
  >
    {children}
  </motion.div>
);
