import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

/**
 * Custom hook for accessing the Auth context
 * This provides all authentication-related functionality throughout the app
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
