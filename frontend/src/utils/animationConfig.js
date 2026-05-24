// Premium Animation Configuration for Jewelry App

export const easeInOutCubic = [0.4, 0, 0.2, 1];

export const animationConfig = {
  // Transition durations (FAST - optimized for snappy UI)
  transitions: {
    fast: 0.15,
    normal: 0.25,
    slow: 0.35,
    verySlow: 0.45,
  },

  // Carousel animations
  carousel: {
    transitionDuration: 0.6,
    easing: easeInOutCubic,
    autoScrollBannerSpeed: 5000,
    autoScrollGridSpeed: 6000,
    pauseOnHoverDelay: 500,
    resumeDelay: 3000,
  },

  // Stagger animations (FAST - reduced delays)
  stagger: {
    itemDelay: 0.03,
    cardDelay: 0.04,
    featureDelay: 0.05,
  },

  // Shadow effects
  shadows: {
    default: '0 14px 30px rgba(133, 104, 74, 0.08)',
    hover: '0 24px 48px rgba(133, 104, 74, 0.15)',
    elevated: '0 28px 56px rgba(133, 104, 74, 0.18)',
    button: '0 8px 24px rgba(0,0,0,0.12)',
    buttonHover: '0 12px 32px rgba(200, 155, 60, 0.25)',
    indicator: '0 4px 12px rgba(200, 155, 60, 0.3)',
  },

  // Color palette
  colors: {
    primaryGold: '#c89b3c',
    lightGold: '#e0b254',
    darkBrown: '#3e2b16',
    mediumBrown: '#6f5334',
    lightBrown: '#8a6b49',
    accentRed: '#7b0000',
    white: '#fff',
    whiteTransparent: 'rgba(255,255,255,0.95)',
  },

  // Scale transforms
  scales: {
    hover: 1.05,
    buttonHover: 1.15,
    indicatorHover: 1.25,
    tap: 0.96,
  },

  // Opacity values
  opacity: {
    full: 1,
    hover: 0.9,
    disabled: 0.4,
    subtle: 0.25,
  },
};

// Page load animation sequence (FAST)
export const pageLoadVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

// Hero section animation (FAST)
export const heroVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: easeInOutCubic,
    },
  },
};

// Card animation (FAST)
export const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      delay: i * animationConfig.stagger.cardDelay,
      ease: easeInOutCubic,
    },
  }),
  hover: {
    y: -8,
    boxShadow: animationConfig.shadows.hover,
    transition: { duration: 0.15 },
  },
};

// Feature card animation (FAST)
export const featureCardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.25,
      delay: i * animationConfig.stagger.featureDelay,
      ease: easeInOutCubic,
    },
  }),
  hover: {
    y: -8,
    boxShadow: animationConfig.shadows.hover,
    transition: { duration: 0.15 },
  },
};

// Button animation (FAST)
export const buttonVariants = {
  hover: {
    scale: animationConfig.scales.buttonHover,
    boxShadow: animationConfig.shadows.buttonHover,
    transition: { duration: 0.15 },
  },
  tap: {
    scale: animationConfig.scales.tap,
  },
};

// Indicator animation (FAST)
export const indicatorVariants = {
  hover: {
    scale: animationConfig.scales.indicatorHover,
    boxShadow: animationConfig.shadows.indicator,
    transition: { duration: 0.15 },
  },
  tap: {
    scale: 0.9,
  },
};

// Container animation (FAST)
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.05,
    },
  },
};

// Smooth transition animation (FAST)
export const smoothTransition = {
  duration: 0.35,
  ease: easeInOutCubic,
};
