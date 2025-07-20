import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * A custom hook for redirecting users based on authentication status
 * @param {boolean} requireAuth - Whether the page requires authentication
 * @param {string} redirectTo - Where to redirect if auth requirement is not met
 */
export const useProtectedNavigation = (
  requireAuth = true,
  redirectTo = "/login"
) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If page requires auth but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      navigate(redirectTo, { state: { from: location.pathname } });
    }

    // If page is for non-authenticated users (like login) but user is already authenticated
    if (!requireAuth && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate, location.pathname, requireAuth, redirectTo]);

  return { isAuthenticated };
};

export default useProtectedNavigation;
