import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import useProtectedNavigation from "../hooks/useProtectedNavigation";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Use our custom hook to handle protected navigation
  // This page should NOT require auth, so false
  useProtectedNavigation(false, "/");

  // Get redirect path from location state or default to home
  const from = location.state?.from || "/";

  // Display error message if authentication fails
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    const success = await login(email, password);

    if (success) {
      toast.success("Login successful!");
      navigate(from);
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Login to Your Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember_me"
                name="remember_me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember_me"
                className="ml-2 block text-sm text-gray-700"
              >
                Remember me
              </label>
            </div>{" "}
            <div className="text-sm">
              <button
                type="button"
                className="font-medium text-primary-600 hover:text-primary-500"
                onClick={() =>
                  toast.info("Password reset feature coming soon!")
                }
              >
                Forgot password?
              </button>
            </div>
          </div>

          <Button
            type="submit"
            label={loading ? "Logging in..." : "Login"}
            isLoading={loading}
            disabled={loading}
            fullWidth
          />
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
