/**
 * Utility functions to verify the auto-export PDF functionality
 * This file contains helper functions to check localStorage state and verify user preferences
 */

/**
 * Check the current state of autoExportPdf preference in localStorage
 * @returns {boolean|null} The current preference state, or null if not found
 */
export const checkAutoExportPreference = () => {
  try {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (
      userData &&
      userData.preferences &&
      userData.preferences.hasOwnProperty("autoExportPdf")
    ) {
      return userData.preferences.autoExportPdf;
    }
  } catch (error) {
    console.error("Error checking autoExportPdf preference:", error);
  }
  return null;
};

/**
 * Directly update the autoExportPdf preference in localStorage
 * This can be used for testing to force a specific state
 * @param {boolean} value - The value to set
 * @returns {boolean} Success or failure
 */
export const setAutoExportPreference = (value) => {
  try {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      if (!userData.preferences) {
        userData.preferences = {};
      }
      userData.preferences.autoExportPdf = Boolean(value);
      localStorage.setItem("user", JSON.stringify(userData));
      console.log(`TEST: Set autoExportPdf to ${value} in localStorage`);
      return true;
    }
  } catch (error) {
    console.error("Error setting autoExportPdf preference:", error);
  }
  return false;
};

/**
 * Create a diagnostic report of preference states across different storage locations
 * @returns {Object} An object with the current state of preferences
 */
export const createPreferenceReport = () => {
  const report = {
    localStorage: null,
    timestamp: new Date().toISOString(),
  };

  try {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData && userData.preferences) {
      report.localStorage = {
        autoExportPdf: userData.preferences.autoExportPdf,
        // Add other preferences as needed
      };
    }
  } catch (error) {
    report.error = error.message;
  }

  return report;
};

/**
 * Test the preference persistence by toggling back and forth
 * @returns {Array} An array of test results
 */
export const runPreferenceToggleTest = async () => {
  const results = [];

  // First, read the current state
  const initialState = checkAutoExportPreference();
  results.push({
    step: "Initial state",
    value: initialState,
    timestamp: new Date().toISOString(),
  });

  // Toggle to opposite value
  const newValue = !initialState;
  setAutoExportPreference(newValue);

  // Check if it was set correctly
  const afterToggle = checkAutoExportPreference();
  results.push({
    step: "After toggle",
    value: afterToggle,
    timestamp: new Date().toISOString(),
    success: afterToggle === newValue,
  });

  // Simulate page navigation by waiting 500ms
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Check if value persisted
  const afterDelay = checkAutoExportPreference();
  results.push({
    step: "After simulated navigation",
    value: afterDelay,
    timestamp: new Date().toISOString(),
    success: afterDelay === newValue,
  });

  // Restore original value
  setAutoExportPreference(initialState);

  return results;
};

// Export a diagnostic function that can be called from the browser console
window.diagnosePDFAutoExport = {
  checkPreference: checkAutoExportPreference,
  setPreference: setAutoExportPreference,
  report: createPreferenceReport,
  test: runPreferenceToggleTest,
};

console.log(
  "PDF Auto-Export diagnostic tools loaded. Access via window.diagnosePDFAutoExport"
);
