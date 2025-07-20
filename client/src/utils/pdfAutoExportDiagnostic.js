/**
 * PDF Auto-Export Diagnostic Utility
 *
 * This utility provides functions to help debug and fix issues with PDF auto-export functionality.
 * It can be used to check the current state of the autoExportPdf preference and fix any inconsistencies.
 */

/**
 * Check the current auto-export PDF preference in various places
 * @returns {Object} The current state of the preference in different storage mechanisms
 */
export const checkAutoExportState = () => {
  const state = {
    localStorage: null,
    timestamp: new Date().toISOString(),
  };

  // Check localStorage
  try {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData && userData.preferences) {
      state.localStorage = userData.preferences.autoExportPdf;
    }
  } catch (error) {
    state.localStorage = `ERROR: ${error.message}`;
  }

  return state;
};

/**
 * Forcibly set the auto-export PDF preference in localStorage
 * @param {boolean} value - The boolean value to set
 * @returns {boolean} Whether the operation was successful
 */
export const forceAutoExportPreference = (value) => {
  try {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) {
      console.error("No user data found in localStorage");
      return false;
    }

    // Ensure preferences object exists
    if (!userData.preferences) {
      userData.preferences = {};
    }

    // Set the preference
    userData.preferences.autoExportPdf = Boolean(value);

    // Save back to localStorage
    localStorage.setItem("user", JSON.stringify(userData));

    console.log(`FORCE: Set autoExportPdf=${value} in localStorage`);
    return true;
  } catch (error) {
    console.error("Error forcing autoExportPdf preference:", error);
    return false;
  }
};

/**
 * Verify that localStorage and state are in sync for the auto-export preference
 * @param {Object} userPreferences - The component's userPreferences state
 * @returns {Object} Diagnostic information about any discrepancies
 */
export const verifyPreferenceSync = (userPreferences) => {
  const result = {
    inSync: false,
    storageValue: null,
    componentValue: userPreferences?.autoExportPdf,
  };

  try {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData && userData.preferences) {
      result.storageValue = userData.preferences.autoExportPdf;
      result.inSync = result.storageValue === result.componentValue;
    }
  } catch (error) {
    result.error = error.message;
  }

  return result;
};

/**
 * Run a full diagnostic of the auto-export PDF functionality
 * @returns {Object} Comprehensive diagnostic information
 */
export const runDiagnostic = () => {
  const diagnostic = {
    timestamp: new Date().toISOString(),
    localStorage: null,
    recommendations: [],
  };

  // Check localStorage
  try {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) {
      diagnostic.recommendations.push(
        "No user data found in localStorage. User may need to log in again."
      );
    } else if (!userData.preferences) {
      diagnostic.recommendations.push(
        "User preferences object not found in localStorage. Initialize it with default values."
      );
    } else {
      diagnostic.localStorage = userData.preferences.autoExportPdf;

      if (userData.preferences.autoExportPdf === undefined) {
        diagnostic.recommendations.push(
          "autoExportPdf preference is undefined. Set it to a default value of false."
        );
      } else if (typeof userData.preferences.autoExportPdf !== "boolean") {
        diagnostic.recommendations.push(
          `autoExportPdf preference is not a boolean (found ${typeof userData
            .preferences.autoExportPdf}). Convert it to a boolean.`
        );
      }
    }
  } catch (error) {
    diagnostic.error = error.message;
    diagnostic.recommendations.push(
      "Error parsing localStorage. It may be corrupted. Consider clearing and reinitializing user data."
    );
  }

  return diagnostic;
};

// Expose functions on window for console debugging
if (typeof window !== "undefined") {
  window.pdfAutoExportDiagnostic = {
    check: checkAutoExportState,
    force: forceAutoExportPreference,
    verify: verifyPreferenceSync,
    diagnose: runDiagnostic,
  };

  console.log(
    "PDF Auto-Export diagnostic tools loaded. Access via window.pdfAutoExportDiagnostic in the browser console."
  );
}
