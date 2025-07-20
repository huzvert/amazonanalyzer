import React from "react";

const Button = ({
  label,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = "",
}) => {
  // Base classes
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-[1.02] active:scale-[0.98]";

  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  }; // Variant classes
  const variantClasses = {
    primary:
      "bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 focus:ring-primary-500 dark:focus:ring-dark-accent shadow-md hover:shadow-lg",
    secondary:
      "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 hover:from-gray-300 hover:to-gray-400 dark:from-gray-700 dark:to-gray-800 dark:text-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-700 focus:ring-gray-400 dark:focus:ring-gray-500 shadow-sm hover:shadow",
    success:
      "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 focus:ring-green-500 shadow-md hover:shadow-lg",
    danger:
      "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-md hover:shadow-lg",
    outline:
      "bg-white dark:bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-primary-500 dark:hover:border-dark-accent hover:text-primary-600 dark:hover:text-dark-accent transition-all duration-200",
  };

  // Disabled classes
  const disabledClasses = "opacity-50 cursor-not-allowed";

  // Width classes
  const widthClasses = fullWidth ? "w-full" : "";

  // Combine all classes
  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size] || sizeClasses.md}
    ${variantClasses[variant] || variantClasses.primary}
    ${disabled || isLoading ? disabledClasses : ""}
    ${widthClasses}
    ${className}
  `;

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {label}
    </button>
  );
};

export default Button;
