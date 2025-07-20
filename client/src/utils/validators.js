/**
 * Utility functions for validation
 */

// Validate ASIN format
export const validateASIN = (asin) => {
  // Most Amazon ASINs are 10 characters and alphanumeric
  const re = /^[A-Z0-9]{10}$/;
  return re.test(String(asin).toUpperCase());
};

// Validate email format
export const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
};

// Validate password strength
export const validatePassword = (password) => {
  // At least 8 characters, at least one uppercase, one lowercase, and one number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return re.test(password);
};

// Get password strength description
export const getPasswordStrength = (password) => {
  if (!password) return { strength: 0, text: "No password" };

  let strength = 0;

  // Length check
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;

  // Character type checks
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  // Determine strength text
  let text = "";
  if (strength <= 2) text = "Weak";
  else if (strength <= 4) text = "Medium";
  else text = "Strong";

  return {
    strength: Math.min(strength, 5),
    text,
  };
};

// Validate keyword format (non-empty, alphanumeric with spaces)
export const validateKeyword = (keyword) => {
  if (!keyword || keyword.trim() === "") return false;
  return true;
};
