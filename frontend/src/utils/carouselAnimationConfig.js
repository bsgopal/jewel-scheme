/**
 * Carousel Animation Configuration System
 * 
 * This module provides a comprehensive animation configuration system for carousel components.
 * It includes configuration validation, parsing, serialization/deserialization, and debugging utilities.
 * 
 * @module carouselAnimationConfig
 */

/**
 * @typedef {Object} AnimationConfig
 * @property {number} transitionDuration - Transition duration in milliseconds (800-1200ms)
 * @property {string|number[]} easingFunction - Easing function (cubic-bezier or preset name)
 * @property {number} autoScrollSpeed - Auto-scroll interval in milliseconds (2000-10000ms)
 * @property {boolean} autoScrollEnabled - Whether auto-scroll is enabled
 * @property {boolean} pauseOnHover - Whether to pause on hover
 * @property {number} pauseOnHoverDuration - Duration to wait before resuming after hover (ms)
 * @property {number} pauseOnClickDuration - Duration to wait before resuming after click (ms)
 * @property {Object} itemsPerRow - Items per row for responsive breakpoints
 * @property {number} itemsPerRow.mobile - Items per row on mobile (< 640px)
 * @property {number} itemsPerRow.tablet - Items per row on tablet (640-1024px)
 * @property {number} itemsPerRow.laptop - Items per row on laptop (1024-1280px)
 * @property {number} itemsPerRow.desktop - Items per row on desktop (> 1280px)
 * @property {boolean} enableShadowEffects - Whether to enable shadow effects
 * @property {boolean} enableScaleEffects - Whether to enable scale effects
 * @property {boolean} enableStaggerAnimation - Whether to enable stagger animation
 * @property {number} staggerDelay - Stagger delay in milliseconds (80-100ms)
 * @property {boolean} enableGPUAcceleration - Whether to enable GPU acceleration
 * @property {boolean} reduceMotionEnabled - Whether reduced motion is enabled
 */

/**
 * Easing function presets
 * @type {Object<string, number[]>}
 */
const EASING_PRESETS = {
  'ease-in-out': [0.4, 0, 0.2, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-linear': [0, 0, 1, 1],
  'ease-in-cubic': [0.32, 0, 0.67, 0],
  'ease-out-cubic': [0.33, 1, 0.68, 1],
  'ease-in-out-cubic': [0.65, 0, 0.35, 1],
};

/**
 * Default animation configuration
 * @type {AnimationConfig}
 */
const DEFAULT_CONFIG = {
  transitionDuration: 1000,
  easingFunction: 'ease-in-out',
  autoScrollSpeed: 5000,
  autoScrollEnabled: true,
  pauseOnHover: true,
  pauseOnHoverDuration: 500,
  pauseOnClickDuration: 3000,
  itemsPerRow: {
    mobile: 1,
    tablet: 2,
    laptop: 3,
    desktop: 4,
  },
  enableShadowEffects: true,
  enableScaleEffects: true,
  enableStaggerAnimation: true,
  staggerDelay: 80,
  enableGPUAcceleration: true,
  reduceMotionEnabled: false,
};

/**
 * Validates transition duration is within acceptable range (800-1200ms)
 * @param {number} duration - Transition duration in milliseconds
 * @returns {boolean} True if valid, false otherwise
 */
function isValidTransitionDuration(duration) {
  return typeof duration === 'number' && duration >= 800 && duration <= 1200;
}

/**
 * Validates auto-scroll speed is within acceptable range (2000-10000ms)
 * @param {number} speed - Auto-scroll speed in milliseconds
 * @returns {boolean} True if valid, false otherwise
 */
function isValidAutoScrollSpeed(speed) {
  return typeof speed === 'number' && speed >= 2000 && speed <= 10000;
}

/**
 * Validates easing function format
 * @param {string|number[]} easing - Easing function (preset name or cubic-bezier array)
 * @returns {boolean} True if valid, false otherwise
 */
function isValidEasingFunction(easing) {
  if (typeof easing === 'string') {
    return easing in EASING_PRESETS;
  }
  if (Array.isArray(easing)) {
    return easing.length === 4 && easing.every(v => typeof v === 'number');
  }
  return false;
}

/**
 * Validates items per row configuration
 * @param {Object} itemsPerRow - Items per row configuration
 * @returns {boolean} True if valid, false otherwise
 */
function isValidItemsPerRow(itemsPerRow) {
  if (!itemsPerRow || typeof itemsPerRow !== 'object') return false;
  const { mobile, tablet, laptop, desktop } = itemsPerRow;
  return (
    typeof mobile === 'number' && mobile >= 1 && mobile <= 4 &&
    typeof tablet === 'number' && tablet >= 1 && tablet <= 4 &&
    typeof laptop === 'number' && laptop >= 1 && laptop <= 4 &&
    typeof desktop === 'number' && desktop >= 1 && desktop <= 4
  );
}

/**
 * Validates a complete animation configuration
 * @param {Partial<AnimationConfig>} config - Configuration to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
function validateConfig(config) {
  const errors = [];

  if (config.transitionDuration !== undefined && !isValidTransitionDuration(config.transitionDuration)) {
    errors.push('transitionDuration must be between 800-1200ms');
  }

  if (config.autoScrollSpeed !== undefined && !isValidAutoScrollSpeed(config.autoScrollSpeed)) {
    errors.push('autoScrollSpeed must be between 2000-10000ms');
  }

  if (config.easingFunction !== undefined && !isValidEasingFunction(config.easingFunction)) {
    errors.push('easingFunction must be a valid preset name or cubic-bezier array [x1, y1, x2, y2]');
  }

  if (config.itemsPerRow !== undefined && !isValidItemsPerRow(config.itemsPerRow)) {
    errors.push('itemsPerRow must have valid mobile, tablet, laptop, and desktop values (1-4)');
  }

  if (config.staggerDelay !== undefined) {
    if (typeof config.staggerDelay !== 'number' || config.staggerDelay < 0 || config.staggerDelay > 200) {
      errors.push('staggerDelay must be between 0-200ms');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Converts easing function to string representation
 * @param {string|number[]} easing - Easing function
 * @returns {string} String representation of easing function
 */
function easingToString(easing) {
  if (typeof easing === 'string') {
    return easing;
  }
  if (Array.isArray(easing)) {
    return `cubic-bezier(${easing.join(', ')})`;
  }
  return 'ease-in-out';
}

/**
 * Converts string representation to easing function
 * @param {string} easingStr - String representation of easing function
 * @returns {string|number[]} Easing function
 */
function stringToEasing(easingStr) {
  if (easingStr in EASING_PRESETS) {
    return easingStr;
  }

  // Try to parse cubic-bezier format
  const cubicBezierMatch = easingStr.match(/cubic-bezier\(([\d., ]+)\)/);
  if (cubicBezierMatch) {
    const values = cubicBezierMatch[1].split(',').map(v => parseFloat(v.trim()));
    if (values.length === 4 && values.every(v => !isNaN(v))) {
      return values;
    }
  }

  return 'ease-in-out';
}

/**
 * Parses props and applies defaults to create a valid configuration
 * @param {Partial<AnimationConfig>} props - Props to parse
 * @returns {AnimationConfig} Complete configuration with defaults applied
 * @throws {Error} If defaults cannot be applied
 */
function parseConfig(props = {}) {
  // Start with default config
  const config = { ...DEFAULT_CONFIG };

  // Apply provided props
  if (props.transitionDuration !== undefined) {
    config.transitionDuration = props.transitionDuration;
  }

  if (props.easingFunction !== undefined) {
    config.easingFunction = props.easingFunction;
  }

  if (props.autoScrollSpeed !== undefined) {
    config.autoScrollSpeed = props.autoScrollSpeed;
  }

  if (props.autoScrollEnabled !== undefined) {
    config.autoScrollEnabled = props.autoScrollEnabled;
  }

  if (props.pauseOnHover !== undefined) {
    config.pauseOnHover = props.pauseOnHover;
  }

  if (props.pauseOnHoverDuration !== undefined) {
    config.pauseOnHoverDuration = props.pauseOnHoverDuration;
  }

  if (props.pauseOnClickDuration !== undefined) {
    config.pauseOnClickDuration = props.pauseOnClickDuration;
  }

  if (props.itemsPerRow !== undefined) {
    config.itemsPerRow = { ...config.itemsPerRow, ...props.itemsPerRow };
  }

  if (props.enableShadowEffects !== undefined) {
    config.enableShadowEffects = props.enableShadowEffects;
  }

  if (props.enableScaleEffects !== undefined) {
    config.enableScaleEffects = props.enableScaleEffects;
  }

  if (props.enableStaggerAnimation !== undefined) {
    config.enableStaggerAnimation = props.enableStaggerAnimation;
  }

  if (props.staggerDelay !== undefined) {
    config.staggerDelay = props.staggerDelay;
  }

  if (props.enableGPUAcceleration !== undefined) {
    config.enableGPUAcceleration = props.enableGPUAcceleration;
  }

  if (props.reduceMotionEnabled !== undefined) {
    config.reduceMotionEnabled = props.reduceMotionEnabled;
  }

  // Validate the resulting configuration
  const validation = validateConfig(config);
  if (!validation.isValid) {
    throw new Error(`Cannot apply defaults: ${validation.errors.join(', ')}`);
  }

  return config;
}

/**
 * Serializes configuration to JSON format
 * @param {AnimationConfig} config - Configuration to serialize
 * @returns {string} JSON string representation
 */
function serializeConfig(config) {
  const serializable = {
    ...config,
    easingFunction: easingToString(config.easingFunction),
    timestamp: new Date().toISOString(),
  };

  return JSON.stringify(serializable, null, 2);
}

/**
 * Deserializes configuration from JSON format
 * @param {string} jsonStr - JSON string representation
 * @returns {AnimationConfig} Deserialized configuration
 * @throws {Error} If JSON is invalid or configuration is invalid
 */
function deserializeConfig(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);

    // Remove timestamp if present
    const { timestamp, ...configData } = data;

    // Convert easing string back to function
    if (configData.easingFunction) {
      configData.easingFunction = stringToEasing(configData.easingFunction);
    }

    // Parse and validate
    return parseConfig(configData);
  } catch (error) {
    throw new Error(`Failed to deserialize configuration: ${error.message}`);
  }
}

/**
 * Prints configuration in a readable format for debugging
 * @param {AnimationConfig} config - Configuration to print
 * @param {Object} animationState - Current animation state (optional)
 * @param {Object} performanceMetrics - Performance metrics (optional)
 * @returns {string} Formatted configuration string
 */
function printConfig(config, animationState = {}, performanceMetrics = {}) {
  const output = {
    timestamp: new Date().toISOString(),
    configuration: {
      transitionDuration: `${config.transitionDuration}ms`,
      easingFunction: easingToString(config.easingFunction),
      autoScrollSpeed: `${config.autoScrollSpeed}ms`,
      autoScrollEnabled: config.autoScrollEnabled,
      pauseOnHover: config.pauseOnHover,
      pauseOnHoverDuration: `${config.pauseOnHoverDuration}ms`,
      pauseOnClickDuration: `${config.pauseOnClickDuration}ms`,
      itemsPerRow: config.itemsPerRow,
      enableShadowEffects: config.enableShadowEffects,
      enableScaleEffects: config.enableScaleEffects,
      enableStaggerAnimation: config.enableStaggerAnimation,
      staggerDelay: `${config.staggerDelay}ms`,
      enableGPUAcceleration: config.enableGPUAcceleration,
      reduceMotionEnabled: config.reduceMotionEnabled,
    },
    animationState: {
      isPlaying: animationState.isPlaying ?? false,
      isPaused: animationState.isPaused ?? false,
      isTransitioning: animationState.isTransitioning ?? false,
      currentIndex: animationState.currentIndex ?? 0,
      totalItems: animationState.totalItems ?? 0,
    },
    performanceMetrics: {
      fps: performanceMetrics.fps ?? 0,
      memoryUsage: performanceMetrics.memoryUsage ?? 'N/A',
      animationFrameCount: performanceMetrics.animationFrameCount ?? 0,
      cpuUsage: performanceMetrics.cpuUsage ?? 'N/A',
    },
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Gets the appropriate items per row for a given viewport width
 * @param {number} viewportWidth - Viewport width in pixels
 * @param {AnimationConfig} config - Animation configuration
 * @returns {number} Items per row for the viewport width
 */
function getItemsPerRowForViewport(viewportWidth, config) {
  if (viewportWidth < 640) {
    return config.itemsPerRow.mobile;
  }
  if (viewportWidth < 1024) {
    return config.itemsPerRow.tablet;
  }
  if (viewportWidth < 1280) {
    return config.itemsPerRow.laptop;
  }
  return config.itemsPerRow.desktop;
}

/**
 * Gets the easing function as a cubic-bezier array
 * @param {string|number[]} easing - Easing function
 * @returns {number[]} Cubic-bezier array [x1, y1, x2, y2]
 */
function getEasingArray(easing) {
  if (Array.isArray(easing)) {
    return easing;
  }
  if (typeof easing === 'string' && easing in EASING_PRESETS) {
    return EASING_PRESETS[easing];
  }
  return EASING_PRESETS['ease-in-out'];
}

/**
 * Creates a configuration for a specific carousel type
 * @param {string} carouselType - Type of carousel ('banner' or 'grid')
 * @param {Partial<AnimationConfig>} overrides - Configuration overrides
 * @returns {AnimationConfig} Configuration for the carousel type
 */
function createCarouselConfig(carouselType, overrides = {}) {
  const baseConfig = {
    ...DEFAULT_CONFIG,
    autoScrollSpeed: carouselType === 'banner' ? 5000 : 6000,
  };

  return parseConfig({ ...baseConfig, ...overrides });
}

// Export all functions and constants
export {
  // Constants
  DEFAULT_CONFIG,
  EASING_PRESETS,

  // Validation functions
  validateConfig,
  isValidTransitionDuration,
  isValidAutoScrollSpeed,
  isValidEasingFunction,
  isValidItemsPerRow,

  // Configuration functions
  parseConfig,
  createCarouselConfig,

  // Serialization functions
  serializeConfig,
  deserializeConfig,

  // Utility functions
  printConfig,
  easingToString,
  stringToEasing,
  getItemsPerRowForViewport,
  getEasingArray,
};

// Default export
export default {
  DEFAULT_CONFIG,
  EASING_PRESETS,
  validateConfig,
  isValidTransitionDuration,
  isValidAutoScrollSpeed,
  isValidEasingFunction,
  isValidItemsPerRow,
  parseConfig,
  createCarouselConfig,
  serializeConfig,
  deserializeConfig,
  printConfig,
  easingToString,
  stringToEasing,
  getItemsPerRowForViewport,
  getEasingArray,
};
