import React from "react";

const Input = ({
  label,
  type = "text",
  name = "",
  value,
  onChange,
  placeholder = "",
  required = false,
  error = "",
  disabled = false,
  className = "",
}) => {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && (
            <span className="text-red-500 dark:text-red-400 ml-1">*</span>
          )}
        </label>
      )}
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            w-full px-4 py-3 bg-white dark:bg-dark-hover border rounded-lg shadow-sm
            placeholder-gray-400 dark:placeholder-gray-500 dark:text-gray-200
            focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-dark-accent focus:border-primary-500 dark:focus:border-dark-accent
            transition-all duration-200
            ${
              error
                ? "border-red-500 dark:border-red-400"
                : "border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-dark-accent"
            }
            ${
              disabled
                ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-75"
                : ""
            }
            ${className}
          `}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            {" "}
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
              clipRule="evenodd"
            />{" "}
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
