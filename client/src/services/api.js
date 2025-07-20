import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
      console.log(`API request to ${config.url} with auth token`);
    } else {
      console.log(`API request to ${config.url} without auth token`);
    }
    return config;
  },
  (error) => {
    console.error("API request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log(`API response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error("API response error:", error);

    if (error.response) {
      console.error(
        `API error status: ${error.response.status}, URL: ${error.config?.url}`
      );
      console.error("Error data:", error.response.data);

      // Handle authentication errors
      if (error.response.status === 401) {
        console.error("Authentication error - redirecting to login");
        // Clear local storage on auth failure
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
