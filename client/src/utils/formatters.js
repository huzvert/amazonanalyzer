/**
 * Utility functions for formatting and validation
 */

// Format date to readable string
export const formatDate = (dateString) => {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Format timestamp to "time ago" format
export const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  // Time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  let counter;
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    counter = Math.floor(seconds / secondsInUnit);
    if (counter > 0) {
      return `${counter} ${unit}${counter !== 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
};

// Validate email format
export const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
};

// Validate ASIN format
export const validateASIN = (asin) => {
  // Most Amazon ASINs are 10 characters and alphanumeric
  const re = /^[A-Z0-9]{10}$/;
  return re.test(asin);
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 100) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

// Format price
export const formatPrice = (price) => {
  if (!price) return "N/A";

  // Remove any non-digit characters except decimal point
  const numericPrice = parseFloat(price.toString().replace(/[^0-9.]/g, ""));

  // Check if it's a valid number
  if (isNaN(numericPrice)) return "N/A";

  // Format with dollar sign and 2 decimal places
  return `$${numericPrice.toFixed(2)}`;
};
