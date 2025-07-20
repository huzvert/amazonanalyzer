import api from "./api";

const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post("/users/login", credentials);
      if (response.data.token) {
        const userData = {
          token: response.data.token,
          id: response.data._id, // Fix: Use _id instead of id
          name: response.data.name,
          email: response.data.email,
          preferences: response.data.preferences,
        };

        localStorage.setItem("user", JSON.stringify(userData));
        return userData;
      }
      throw new Error("No token received");
    } catch (error) {
      throw error.response?.data?.message || "Login failed";
    }
  },
  register: async (userData) => {
    try {
      const response = await api.post("/users/register", userData);
      if (response.data.token) {
        const user = {
          token: response.data.token,
          id: response.data._id, // Fix: Use _id instead of id
          name: response.data.name,
          email: response.data.email,
          preferences: response.data.preferences,
        };

        localStorage.setItem("user", JSON.stringify(user));
        return user;
      }
      throw new Error("No token received");
    } catch (error) {
      throw error.response?.data?.message || "Registration failed";
    }
  },
  updateProfile: async (userData) => {
    try {
      console.log("Updating profile with data:", userData);
      const response = await api.put("/users/profile", userData);
      console.log("Profile update response:", response.data);
      if (response.data) {
        // Get the current user data from localStorage
        const currentUser = JSON.parse(localStorage.getItem("user"));

        if (!currentUser) {
          console.error("No user found in localStorage");
          throw new Error("User not found in localStorage");
        }

        // Create an updated user object with the new data
        const updatedUser = {
          ...currentUser,
          name: response.data.name || currentUser.name,
          email: response.data.email || currentUser.email,
        };

        // Handle preferences carefully to ensure they are properly merged
        if (response.data.preferences) {
          // Make sure we have a preferences object
          updatedUser.preferences = updatedUser.preferences || {};

          // Merge the new preferences with existing ones
          Object.entries(response.data.preferences).forEach(([key, value]) => {
            console.log(`Updating preference in localStorage: ${key}=${value}`);
            updatedUser.preferences[key] = value;
          });
        }

        console.log("Updating user in localStorage with:", updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return updatedUser;
      }
      throw new Error("Failed to update profile");
    } catch (error) {
      console.error("Profile update error in authService:", error);
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);
        throw error.response.data.message || "Profile update failed";
      }
      throw error.message || "Profile update failed";
    }
  },

  logout: () => {
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem("user"));
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("user");
  },

  getAuthHeader: () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.token) {
      return { Authorization: `Bearer ${user.token}` };
    } else {
      return {};
    }
  },
};

export default authService;
