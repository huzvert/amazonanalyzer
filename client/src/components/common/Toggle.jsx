import React from "react";

const Toggle = ({
  checked,
  onChange,
  label,
  description,
  size = "md",
  disabled = false,
}) => {
  const sizeClasses = {
    sm: "w-9 h-5 after:h-4 after:w-4",
    md: "w-11 h-6 after:h-5 after:w-5",
    lg: "w-14 h-7 after:h-6 after:w-6",
  };

  const baseClasses = `
    relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent 
    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 
    focus:ring-primary-500 dark:focus:ring-dark-accent focus:ring-offset-2
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
    ${
      checked
        ? "bg-primary-600 dark:bg-dark-accent"
        : "bg-gray-200 dark:bg-gray-700"
    }
    ${sizeClasses[size] || sizeClasses.md}
  `;

  const knobClasses = `
    pointer-events-none inline-block transform rounded-full 
    bg-white shadow-lg ring-0 transition duration-200 ease-in-out
    ${checked ? "translate-x-full" : "translate-x-0"}
    after:content-[''] after:absolute after:top-[2px] after:left-[2px]
    ${sizeClasses[size] || sizeClasses.md}
  `;

  return (
    <div className="flex items-center">
      {(label || description) && (
        <div className="mr-3">
          {label && (
            <h3 className="font-medium text-gray-800 dark:text-dark-text">
              {label}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={baseClasses}>
          <span className={knobClasses}></span>
        </div>
      </label>
    </div>
  );
};

export default Toggle;
