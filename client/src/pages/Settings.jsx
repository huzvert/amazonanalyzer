import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Toggle from "../components/common/Toggle";
import PageTransition from "../components/common/PageTransition";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    dataRetention: "90days",
    showCompetitors: 5,
    autoExportPdf: true,
  }); // Initialize form data from user object
  useEffect(() => {
    if (user) {
      console.log("Initializing form data from user:", user);
      setFormData((prevFormData) => {
        const updatedData = {
          ...prevFormData,
          name: user.name || "",
          email: user.email || "",
        };
        console.log("Updated form data from user:", updatedData);
        return updatedData;
      });

      // Initialize preferences from user if available
      if (user.preferences) {
        console.log("Initializing preferences from user:", user.preferences);
        setPreferences((prevPrefs) => ({
          ...prevPrefs,
          ...user.preferences,
        }));
      }
    }
  }, [user]);
  const handleInputChange = (e) => {
    try {
      const { name, value } = e.target;
      console.log("Input change detected:", name, value);

      setFormData((prevFormData) => {
        console.log("Updating form data for field:", name);
        const updatedData = {
          ...prevFormData,
          [name]: value,
        };
        console.log("Updated form data:", updatedData);
        return updatedData;
      });
    } catch (error) {
      console.error("Error in handleInputChange:", error);
    }
  };
  const handleTogglePreference = async (name) => {
    // Update local state first for immediate UI feedback
    const newPreferenceValue = !preferences[name];
    console.log(`Toggling preference ${name} to ${newPreferenceValue}`);

    setPreferences({
      ...preferences,
      [name]: newPreferenceValue,
    });
    try {
      // Save preference to backend
      const preferencesUpdate = {
        preferences: {
          [name]: newPreferenceValue,
        },
      };

      // INSTANT UPDATE: Directly update localStorage to ensure immediate effect
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        if (userData) {
          // Ensure preferences object exists
          if (!userData.preferences) {
            userData.preferences = {};
          }

          // Update the preference directly
          userData.preferences[name] = newPreferenceValue;

          // Save back to localStorage
          localStorage.setItem("user", JSON.stringify(userData));
          console.log(
            `DIRECT SETTINGS UPDATE: preference in localStorage: ${name}=${newPreferenceValue}`
          );
        }
      } catch (localStorageError) {
        console.error(
          "Error updating localStorage directly from Settings:",
          localStorageError
        );
      }

      // Log the update being sent
      console.log(`Sending preference update to server:`, preferencesUpdate);
      console.log(`Current user before update:`, user);

      const success = await updateProfile(preferencesUpdate);

      if (success) {
        // Verify the preference was actually updated in the user object
        console.log(`After update - Current user:`, user);
        console.log(`After update - User preferences:`, user?.preferences);
        console.log(
          `After update - ${name} preference value:`,
          user?.preferences?.[name]
        );

        toast.success(`${name} preference updated!`);
        // Log final state for debugging
        console.log(
          `Preference ${name} successfully updated to:`,
          newPreferenceValue
        );
      } else {
        // Revert local state if update failed
        setPreferences({
          ...preferences,
          [name]: !newPreferenceValue,
        });
        toast.error(`Failed to update ${name} preference.`);
      }
    } catch (error) {
      console.error(`Error updating ${name} preference:`, error);
      // Revert local state if update failed
      setPreferences({
        ...preferences,
        [name]: !newPreferenceValue,
      });
      toast.error(`Failed to update ${name} preference.`);
    }
  };

  const handlePreferenceChange = (name, value) => {
    setPreferences({
      ...preferences,
      [name]: value,
    });

    // Simulate saving preference to backend
    toast.success(`${name} preference updated to ${value}!`);
  };
  const handleEditToggle = () => {
    console.log("Edit toggle clicked. Current editing state:", isEditing);
    // Toggle editing state
    setIsEditing((prevState) => {
      console.log("Setting isEditing to:", !prevState);
      return !prevState;
    });

    // If we're entering edit mode, reset password fields
    if (!isEditing) {
      console.log("Entering edit mode, resetting password fields");
      setFormData((prevData) => ({
        ...prevData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } else {
      console.log("Exiting edit mode");
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    console.log("Form submission started with data:", formData);

    // Password validation
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error("New passwords don't match!");
        setIsLoading(false);
        return;
      }

      if (!formData.currentPassword) {
        toast.error("Current password is required to set a new password");
        setIsLoading(false);
        return;
      }
    }

    // Prepare user data for update
    const userData = {
      name: formData.name,
      email: formData.email,
    };

    // Add password data if user is changing password
    if (formData.newPassword && formData.currentPassword) {
      userData.currentPassword = formData.currentPassword;
      userData.newPassword = formData.newPassword;
    }

    console.log("Submitting profile update:", userData);

    try {
      const success = await updateProfile(userData);
      console.log("Profile update result:", success);

      if (success) {
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      } else {
        console.error("Profile update failed");
        toast.error("Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Profile update error in component:", error);
      toast.error(
        typeof error === "string"
          ? error
          : error.message || "An error occurred while updating your profile"
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-900 dark:from-dark-card dark:to-gray-900 rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-primary-100 mt-2">
                Manage your account and preferences
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-dark-border">
              <ul>
                <li>
                  <button
                    className={`w-full text-left px-6 py-4 ${
                      activeTab === "profile"
                        ? "bg-gray-100 dark:bg-dark-hover text-primary-600 dark:text-dark-accent border-l-4 border-primary-500 dark:border-dark-accent"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover hover:text-primary-500 dark:hover:text-dark-accent"
                    }`}
                    onClick={() => setActiveTab("profile")}
                  >
                    Profile Information
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left px-6 py-4 ${
                      activeTab === "preferences"
                        ? "bg-gray-100 dark:bg-dark-hover text-primary-600 dark:text-dark-accent border-l-4 border-primary-500 dark:border-dark-accent"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover hover:text-primary-500 dark:hover:text-dark-accent"
                    }`}
                    onClick={() => setActiveTab("preferences")}
                  >
                    App Preferences
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left px-6 py-4 ${
                      activeTab === "notifications"
                        ? "bg-gray-100 dark:bg-dark-hover text-primary-600 dark:text-dark-accent border-l-4 border-primary-500 dark:border-dark-accent"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover hover:text-primary-500 dark:hover:text-dark-accent"
                    }`}
                    onClick={() => setActiveTab("notifications")}
                  >
                    Notifications
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left px-6 py-4 ${
                      activeTab === "security"
                        ? "bg-gray-100 dark:bg-dark-hover text-primary-600 dark:text-dark-accent border-l-4 border-primary-500 dark:border-dark-accent"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover hover:text-primary-500 dark:hover:text-dark-accent"
                    }`}
                    onClick={() => setActiveTab("security")}
                  >
                    Security
                  </button>
                </li>
              </ul>
            </div>
          </div>{" "}
          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6 border border-gray-200 dark:border-dark-border text-gray-800 dark:text-dark-text">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div>
                  {" "}
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-primary-600 dark:text-dark-accent">
                      Profile Information
                    </h2>
                    <div className="flex gap-2">
                      <Button
                        label="Test Update"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          console.log("Test update clicked");
                          try {
                            const testData = {
                              name: user.name,
                              email: user.email,
                            };
                            console.log(
                              "Testing profile update with:",
                              testData
                            );
                            const success = await updateProfile(testData);
                            if (success) {
                              toast.success("Test update successful!");
                            } else {
                              toast.error("Test update failed");
                            }
                          } catch (err) {
                            console.error("Test update error:", err);
                            toast.error(
                              "Test update error: " +
                                (err.message || "Unknown error")
                            );
                          }
                        }}
                      />
                      <Button
                        label={isEditing ? "Cancel" : "Edit Profile"}
                        variant={isEditing ? "outline" : "primary"}
                        onClick={() => {
                          console.log("Edit profile button clicked!");
                          handleEditToggle();
                        }}
                        size="sm"
                      />
                    </div>
                  </div>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                      {console.log("Name input disabled:", !isEditing)}
                      <Input
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                      />
                      {!isEditing && (
                        <p className="text-xs text-gray-500 mt-1">
                          Click the "Edit Profile" button to make changes
                        </p>
                      )}
                    </div>

                    <div className="mb-6">
                      {console.log("Email input disabled:", !isEditing)}
                      <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    {isEditing && (
                      <>
                        <div className="mb-6">
                          <Input
                            label="Current Password"
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            placeholder="Enter your current password to change it"
                          />
                        </div>

                        <div className="mb-6">
                          <Input
                            label="New Password"
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            placeholder="Leave blank to keep current password"
                          />
                        </div>

                        <div className="mb-6">
                          <Input
                            label="Confirm New Password"
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirm your new password"
                          />
                        </div>

                        <Button
                          type="submit"
                          label={isLoading ? "Saving..." : "Save Changes"}
                          disabled={isLoading}
                          isLoading={isLoading}
                        />
                      </>
                    )}
                  </form>
                </div>
              )}{" "}
              {/* Preferences Tab */}
              {activeTab === "preferences" && (
                <div>
                  <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-bold text-primary-600 dark:text-dark-accent mb-6"
                  >
                    App Preferences
                  </motion.h2>

                  <div className="space-y-6">
                    {/* Theme Toggle */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex justify-between items-center py-4 border-b border-gray-200 dark:border-dark-border"
                    >
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-dark-text">
                          Dark Mode
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Switch between light and dark theme
                        </p>
                      </div>
                      <Toggle
                        checked={darkMode}
                        onChange={toggleDarkMode}
                        size="md"
                      />
                    </motion.div>{" "}
                    {/* Number of Competitors */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="py-4 border-b border-gray-200 dark:border-dark-border"
                    >
                      <h3 className="font-medium text-gray-800 dark:text-dark-text mb-2">
                        Competitors to Display
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {[3, 5, 10, 15].map((num) => (
                          <button
                            key={num}
                            onClick={() =>
                              handlePreferenceChange("showCompetitors", num)
                            }
                            className={`px-3 py-1 rounded-md ${
                              preferences.showCompetitors === num
                                ? "bg-primary-500 dark:bg-dark-accent text-white"
                                : "bg-gray-200 dark:bg-dark-hover text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                    {/* Data Retention */}
                    <div className="py-4 border-b border-gray-200 dark:border-dark-border">
                      <h3 className="font-medium text-gray-800 dark:text-dark-text mb-2">
                        Data Retention
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Choose how long to keep your analysis history
                      </p>
                      <select
                        value={preferences.dataRetention}
                        onChange={(e) =>
                          handlePreferenceChange(
                            "dataRetention",
                            e.target.value
                          )
                        }
                        className="w-full p-2 bg-white dark:bg-dark-hover border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-dark-accent"
                      >
                        <option value="30days">30 Days</option>
                        <option value="90days">90 Days</option>
                        <option value="6months">6 Months</option>
                        <option value="1year">1 Year</option>
                        <option value="forever">Keep Forever</option>
                      </select>
                    </div>{" "}
                    {/* Default Analysis Settings */}
                    <div className="py-4">
                      <h3 className="font-medium text-gray-800 dark:text-dark-text mb-4">
                        Default Analysis Settings
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 dark:bg-dark-hover p-4 rounded-lg border border-gray-200 dark:border-dark-border">
                          <h4 className="font-medium text-primary-600 dark:text-dark-accent mb-2">
                            Analysis Layout
                          </h4>
                          <div className="flex space-x-3">
                            <button
                              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
                              onClick={() =>
                                toast.success("Layout preference saved!")
                              }
                            >
                              Compact
                            </button>
                            <button
                              className="px-4 py-2 border border-primary-500 dark:border-dark-accent rounded-md bg-primary-500/20 dark:bg-dark-accent/20 text-primary-600 dark:text-dark-accent font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
                              onClick={() =>
                                toast.success("Layout preference saved!")
                              }
                            >
                              Detailed
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-dark-hover p-4 rounded-lg border border-gray-200 dark:border-dark-border">
                          <h4 className="font-medium text-primary-600 dark:text-dark-accent mb-2">
                            Auto-export Options
                          </h4>{" "}
                          <div className="flex items-center">
                            <input
                              id="auto-export-pdf"
                              type="checkbox"
                              checked={preferences.autoExportPdf}
                              className="w-4 h-4 text-primary-600 dark:text-dark-accent bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 dark:focus:ring-dark-accent"
                              onChange={() => {
                                handleTogglePreference("autoExportPdf");
                              }}
                            />
                            <label
                              htmlFor="auto-export-pdf"
                              className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Generate PDF automatically
                            </label>
                          </div>{" "}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text mb-6">
                    Notification Settings
                  </h2>

                  <div className="space-y-6">
                    {" "}
                    <div className="flex justify-between items-center py-4 border-b border-gray-200 dark:border-dark-border">
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-dark-text">
                          Email Notifications
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Receive analysis reports via email
                        </p>
                      </div>
                      <Toggle
                        checked={preferences.emailNotifications}
                        onChange={() =>
                          handleTogglePreference("emailNotifications")
                        }
                      />
                    </div>
                    <div className="py-4 border-b border-gray-200 dark:border-dark-border">
                      <h3 className="font-medium text-gray-800 dark:text-dark-text mb-3">
                        Analysis Completion
                      </h3>
                      <div className="flex items-center mb-4">
                        <input
                          id="notify-success"
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-primary-600 dark:text-dark-accent bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 dark:focus:ring-dark-accent"
                        />
                        <label
                          htmlFor="notify-success"
                          className="ml-2 text-gray-700 dark:text-gray-300"
                        >
                          Successful analyses
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="notify-failed"
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-primary-600 dark:text-dark-accent bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 dark:focus:ring-dark-accent"
                        />
                        <label
                          htmlFor="notify-failed"
                          className="ml-2 text-gray-700 dark:text-gray-300"
                        >
                          Failed analyses
                        </label>
                      </div>
                    </div>
                    <div className="py-4">
                      <Button
                        label="Save Notification Preferences"
                        onClick={() =>
                          toast.success("Notification preferences saved!")
                        }
                      />
                    </div>
                  </div>
                </div>
              )}{" "}
              {/* Security Tab */}
              {activeTab === "security" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text mb-6">
                    Security Settings
                  </h2>

                  <div className="space-y-8">
                    {" "}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-yellow-500 dark:text-yellow-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Your account security is important. We recommend
                            using strong, unique passwords and enabling
                            two-factor authentication.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="border border-gray-200 dark:border-dark-border rounded-lg p-6 bg-white dark:bg-dark-card">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-dark-text mb-4">
                        Two-Factor Authentication
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Add an extra layer of security to your account by
                        enabling two-factor authentication.
                      </p>
                      <Button
                        label="Enable Two-Factor Authentication"
                        variant="outline"
                        onClick={() =>
                          toast.success(
                            "Two-factor authentication setup started!"
                          )
                        }
                      />
                    </div>
                    <div className="border border-red-200 dark:border-red-800/50 rounded-lg p-6 bg-red-50 dark:bg-red-900/20">
                      <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-4">
                        Delete Account
                      </h3>
                      <p className="text-red-600 dark:text-red-400 mb-4">
                        Permanently delete your account and all associated data.
                        This action cannot be undone.
                      </p>
                      <Button
                        label="Delete Account"
                        variant="danger"
                        onClick={() => {
                          const confirm = window.confirm(
                            "Are you sure you want to delete your account? This action cannot be undone."
                          );
                          if (confirm) {
                            toast.error("Account deletion requested!");
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Settings;
