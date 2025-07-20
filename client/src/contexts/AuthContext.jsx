import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Check for existing token on component mount
  useEffect(() => {
    const userData = authService.getCurrentUser();
    if (userData) {
      console.log("AuthContext: Found existing user data on load", userData);
      setUser(userData);
    }
  }, []);
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const userData = await authService.login({ email, password });
      setUser(userData);
      return true;
    } catch (err) {
      console.error("Login error:", err);
      setError(typeof err === "string" ? err : err.message || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);

    try {
      const userData = await authService.register({
        name,
        email,
        password,
      });
      setUser(userData);
      return true;
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        typeof err === "string" ? err : err.message || "Registration failed"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };
  const logout = () => {
    // Use auth service for logout
    authService.logout();

    // Remove user from state
    setUser(null);
  }; // Utility function to broadcast preference changes
  const broadcastPreferenceChange = (key, value) => {
    try {
      // First, directly update localStorage to ensure immediate persistence
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        if (userData) {
          // Ensure preferences object exists
          if (!userData.preferences) {
            userData.preferences = {};
          }

          // Update the specific preference
          userData.preferences[key] = value;

          // Save back to localStorage
          localStorage.setItem("user", JSON.stringify(userData));
          console.log(
            `DIRECT UPDATE: preference in localStorage: ${key}=${value}`
          );
        }
      } catch (storageError) {
        console.error("Error updating localStorage directly:", storageError);
      }

      // Use a custom event to notify other components about preference changes
      const event = new CustomEvent("userPreferenceChanged", {
        detail: { key, value },
        bubbles: true, // Allow event to bubble up
        cancelable: true, // Allow event to be canceled
      });
      console.log(`Broadcasting preference change event: ${key}=${value}`);

      // Dispatch the event on window to ensure global visibility
      window.dispatchEvent(event);

      // Verify event was dispatched
      const testListener = () => {
        console.log(`Test event listener fired for ${key}`);
        window.removeEventListener("userPreferenceChanged", testListener);
      };
      window.addEventListener("userPreferenceChanged", testListener);
    } catch (error) {
      console.error("Error broadcasting preference change:", error);
    }
  };

  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("AuthContext: updateProfile called with", userData);
      const updatedUserData = await authService.updateProfile(userData);
      console.log("AuthContext: received updated data", updatedUserData); // Update the user state with the new data
      const prevUser = user; // Store previous user state for comparison

      // Create a new user object with updated values
      const newUserState = {
        ...prevUser,
        ...updatedUserData,
      };

      // If preferences are being updated, ensure they're properly merged
      if (userData.preferences && updatedUserData.preferences) {
        console.log(
          "Updating preferences in user state:",
          updatedUserData.preferences
        );

        // Make sure we have a preferences object
        newUserState.preferences = {
          ...(prevUser?.preferences || {}),
        }; // Apply updates one by one and broadcast each change
        Object.entries(updatedUserData.preferences).forEach(([key, value]) => {
          // Update the preference
          newUserState.preferences[key] = value;
          console.log(`Setting preference ${key}=${value} in user state`);

          // SPECIAL HANDLING FOR AUTO-EXPORT PDF: Make absolutely sure to update localStorage
          if (key === "autoExportPdf") {
            try {
              const userData = JSON.parse(localStorage.getItem("user"));
              if (userData) {
                if (!userData.preferences) {
                  userData.preferences = {};
                }
                userData.preferences[key] = value;
                localStorage.setItem("user", JSON.stringify(userData));
                console.log(
                  `AUTO-EXPORT FIX: Direct localStorage update for ${key}=${value}`
                );
              }
            } catch (error) {
              console.error(
                "Error updating autoExportPdf in localStorage:",
                error
              );
            }
          }

          // Broadcast the change to all listening components
          broadcastPreferenceChange(key, value);
        });
      }

      console.log("New user state after update:", newUserState);

      // Important: Set the user state directly here instead of using the functional update
      setUser(newUserState);

      return true;
    } catch (err) {
      console.error("Profile update error in AuthContext:", err);
      const errorMessage =
        typeof err === "string" ? err : err.message || "Profile update failed";
      console.error("Setting error message:", errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
