import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Bars3Icon } from "@heroicons/react/24/outline";

const Navbar = ({ toggleMobileSidebar }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Mobile menu button */}
          <button
            onClick={toggleMobileSidebar}
            className="text-gray-700 hover:text-primary-600 focus:outline-none"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent"
            >
              Amazon Product Synthesis
            </Link>
          </div>

          {/* Authentication - Only show on mobile */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700 hidden sm:inline">
                  Welcome, {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm text-gray-700 hover:text-primary-600"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
