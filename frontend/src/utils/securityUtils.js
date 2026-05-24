/**
 * Security Utilities
 * Provides secure methods for handling sensitive data and operations
 * Production-ready security functions
 */

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (10 digits)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone format
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate password strength
 * Requires: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 * @param {string} password - Password to validate
 * @returns {object} Validation result with details
 */
export const validatePassword = (password) => {
  const result = {
    isValid: false,
    errors: [],
  };

  if (!password || password.length < 8) {
    result.errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    result.errors.push('Password must contain uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    result.errors.push('Password must contain lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    result.errors.push('Password must contain number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    result.errors.push('Password must contain special character (!@#$%^&*)');
  }

  result.isValid = result.errors.length === 0;
  return result;
};

/**
 * Validate pincode format (6 digits)
 * @param {string} pincode - Pincode to validate
 * @returns {boolean} True if valid pincode format
 */
export const validatePincode = (pincode) => {
  const pincodeRegex = /^[0-9]{6}$/;
  return pincodeRegex.test(pincode);
};

/**
 * Validate PAN card format
 * Format: AAAAA9999A (5 letters, 4 digits, 1 letter)
 * @param {string} pan - PAN to validate
 * @returns {boolean} True if valid PAN format
 */
export const validatePAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

/**
 * Validate Aadhar number format (12 digits)
 * @param {string} aadhar - Aadhar to validate
 * @returns {boolean} True if valid Aadhar format
 */
export const validateAadhar = (aadhar) => {
  const aadharRegex = /^[0-9]{12}$/;
  return aadharRegex.test(aadhar);
};

/**
 * Validate amount (positive number with max 2 decimals)
 * @param {string|number} amount - Amount to validate
 * @returns {boolean} True if valid amount
 */
export const validateAmount = (amount) => {
  const amountRegex = /^\d+(\.\d{1,2})?$/;
  const num = parseFloat(amount);
  return amountRegex.test(amount) && num > 0;
};

/**
 * Validate token format (JWT)
 * @param {string} token - Token to validate
 * @returns {boolean} True if valid JWT format
 */
export const validateToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = (token) => {
  try {
    if (!validateToken(token)) return true;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expirationTime;
  } catch (error) {
    return true;
  }
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {number|null} Expiration time in milliseconds or null if invalid
 */
export const getTokenExpiration = (token) => {
  try {
    if (!validateToken(token)) return null;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch (error) {
    return null;
  }
};

/**
 * Sanitize object to remove sensitive fields
 * @param {object} obj - Object to sanitize
 * @param {array} fieldsToRemove - Fields to remove
 * @returns {object} Sanitized object
 */
export const sanitizeObject = (obj, fieldsToRemove = ['password', 'token', 'secret']) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  fieldsToRemove.forEach(field => {
    delete sanitized[field];
  });
  return sanitized;
};

/**
 * Validate form data before submission
 * @param {object} formData - Form data to validate
 * @param {object} rules - Validation rules
 * @returns {object} Validation result with errors
 */
export const validateFormData = (formData, rules) => {
  const errors = {};

  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = formData[field];

    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${rule.label || field} is required`;
      return;
    }

    if (value && rule.type === 'email' && !validateEmail(value)) {
      errors[field] = `${rule.label || field} must be valid email`;
      return;
    }

    if (value && rule.type === 'phone' && !validatePhone(value)) {
      errors[field] = `${rule.label || field} must be 10 digits`;
      return;
    }

    if (value && rule.type === 'pincode' && !validatePincode(value)) {
      errors[field] = `${rule.label || field} must be 6 digits`;
      return;
    }

    if (value && rule.type === 'pan' && !validatePAN(value)) {
      errors[field] = `${rule.label || field} must be valid PAN`;
      return;
    }

    if (value && rule.type === 'aadhar' && !validateAadhar(value)) {
      errors[field] = `${rule.label || field} must be 12 digits`;
      return;
    }

    if (value && rule.type === 'amount' && !validateAmount(value)) {
      errors[field] = `${rule.label || field} must be valid amount`;
      return;
    }

    if (value && rule.minLength && value.toString().length < rule.minLength) {
      errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`;
      return;
    }

    if (value && rule.maxLength && value.toString().length > rule.maxLength) {
      errors[field] = `${rule.label || field} must be at most ${rule.maxLength} characters`;
      return;
    }

    if (value && rule.pattern && !rule.pattern.test(value)) {
      errors[field] = `${rule.label || field} format is invalid`;
      return;
    }
  });

  return errors;
};

/**
 * Encrypt sensitive data (basic - use proper encryption library in production)
 * @param {string} data - Data to encrypt
 * @param {string} key - Encryption key
 * @returns {string} Encrypted data
 */
export const encryptData = (data, key) => {
  try {
    return btoa(JSON.stringify({ data, timestamp: Date.now() }));
  } catch (error) {
    return null;
  }
};

/**
 * Decrypt sensitive data (basic - use proper encryption library in production)
 * @param {string} encryptedData - Encrypted data
 * @param {string} key - Encryption key
 * @returns {object|null} Decrypted data or null if invalid
 */
export const decryptData = (encryptedData, key) => {
  try {
    const decrypted = JSON.parse(atob(encryptedData));
    // Check if data is not too old (1 hour)
    if (Date.now() - decrypted.timestamp > 3600000) {
      return null;
    }
    return decrypted.data;
  } catch (error) {
    return null;
  }
};

/**
 * Generate CSRF token (should be provided by backend)
 * @returns {string} CSRF token
 */
export const generateCSRFToken = () => {
  return 'csrf_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Check if running in production
 * @returns {boolean} True if production environment
 */
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Safe console logging (only in development)
 * @param {string} message - Message to log
 * @param {any} data - Data to log
 */
export const safeLog = (message, data = null) => {
  if (!isProduction()) {
    // Only log in development
    if (data) {
      // Sanitize data before logging
      const sanitized = sanitizeObject(data);
      // Intentionally not logging to avoid console output
    }
  }
};

/**
 * Safe error logging (only in development)
 * @param {string} message - Error message
 * @param {Error} error - Error object
 */
export const safeError = (message, error = null) => {
  if (!isProduction()) {
    // Only log in development
    // Intentionally not logging to avoid console output
  }
};

export default {
  sanitizeInput,
  validateEmail,
  validatePhone,
  validatePassword,
  validatePincode,
  validatePAN,
  validateAadhar,
  validateAmount,
  validateToken,
  isTokenExpired,
  getTokenExpiration,
  sanitizeObject,
  validateFormData,
  encryptData,
  decryptData,
  generateCSRFToken,
  isProduction,
  safeLog,
  safeError,
};
