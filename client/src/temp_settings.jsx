import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import PageTransition from "../components/common/PageTransition";
import { toast } from "react-hot-toast";

const Settings = () => {
  const { user } = useAuth();
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
    darkMode: false,
    emailNotifications: true,
    dataRetention: "90days",
    showCompetitors: 5,
  });

  // Initialize form data from user object
  useEffect(() => {
    if (user) {
      setFormData({
        ...formData,
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleTogglePreference = (name) => {
    setPreferences({
      ...preferences,
      [name]: !preferences[name],
    });

    // Simulate saving preference to backend
    toast.success(`${name} preference updated!`);
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
    setIsEditing(!isEditing);
    if (!isEditing) {
      // Reset password fields when starting to edit
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

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

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    }, 1000);
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-900 rounded-lg shadow-lg p-8 mb-8 text-white">
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
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <ul>
                <li>
                  <button
                    className={`w-full text-left px-6 py-4 ${
                      activeTab === "profile"
                        ? "bg-primary-50 text-primary-700 border-l-4 border-primary-600"
                        : "text-gray-700 hover:bg-gray-50"
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
                        ? "bg-primary-50 text-primary-700 border-l-4 border-primary-600"
                        : "text-gray-700 hover:bg-gray-50"
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
                        ? "bg-primary-50 text-primary-700 border-l-4 border-primary-600"
                        : "text-gray-700 hover:bg-gray-50"
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
                        ? "bg-primary-50 text-primary-700 border-l-4 border-primary-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setActiveTab("security")}
                  >
                    Security
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Profile Information
                    </h2>
                    <Button
                      label={isEditing ? "Cancel" : "Edit Profile"}
                      variant={isEditing ? "outline" : "primary"}
                      onClick={handleEditToggle}
                      size="sm"
                    />
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                      <Input
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="mb-6">
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
              )}

              {/* Preferences Tab */}
              {activeTab === "preferences" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    App Preferences
                  </h2>

                  <div className="space-y-6">
                    {/* Theme Toggle */}
                    <div className="flex justify-between items-center py-4 border-b border-gray-200">
                      <div>
                        <h3 className="font-medium text-gray-800">Dark Mode</h3>
                        <p className="text-sm text-gray-600">
                          Switch between light and dark theme
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.darkMode}
                          onChange={() => handleTogglePreference("darkMode")}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    {/* Number of Competitors */}
                    <div className="py-4 border-b border-gray-200">
                      <h3 className="font-medium text-gray-800 mb-2">
                        Competitors to Display
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Select how many competitors to show in analysis results
                      </p>
                      <div className="flex items-center space-x-2">
                        {[3, 5, 10, 15].map((num) => (
                          <button
                            key={num}
                            onClick={() =>
                              handlePreferenceChange("showCompetitors", num)
                            }
                            className={`px-4 py-2 rounded-md transition-colors ${
                              preferences.showCompetitors === num
                                ? "bg-primary-100 text-primary-800 font-medium"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Data Retention */}
                    <div className="py-4 border-b border-gray-200">
                      <h3 className="font-medium text-gray-800 mb-2">
                        Data Retention
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
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
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="30days">30 Days</option>
                        <option value="90days">90 Days</option>
                        <option value="6months">6 Months</option>
                        <option value="1year">1 Year</option>
                        <option value="forever">Keep Forever</option>
                      </select>
                    </div>

                    {/* Default Analysis Settings */}
                    <div className="py-4">
                      <h3 className="font-medium text-gray-800 mb-4">
                        Default Analysis Settings
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">
                            Analysis Layout
                          </h4>
                          <div className="flex space-x-3">
                            <button
                              className="px-4 py-2 border border-primary-100 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                              onClick={() =>
                                toast.success("Layout preference saved!")
                              }
                            >
                              Compact
                            </button>
                            <button
                              className="px-4 py-2 border border-primary-600 rounded-md bg-primary-50 text-primary-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                              onClick={() =>
                                toast.success("Layout preference saved!")
                              }
                            >
                              Detailed
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">
                            Auto-export Options
                          </h4>
                          <div className="flex items-center">
                            <input
                              id="auto-export-pdf"
                              type="checkbox"
                              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                              onChange={() =>
                                toast.success("Auto-export preference saved!")
                              }
                            />
                            <label
                              htmlFor="auto-export-pdf"
                              className="ml-2 text-sm font-medium text-gray-700"
                            >
                              Generate PDF automatically
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Notification Settings
                  </h2>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center py-4 border-b border-gray-200">
                      <div>
                        <h3 className="font-medium text-gray-800">
                          Email Notifications
                        </h3>
                        <p className="text-sm text-gray-600">
                          Receive analysis reports via email
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications}
                          onChange={() =>
                            handleTogglePreference("emailNotifications")
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="py-4 border-b border-gray-200">
                      <h3 className="font-medium text-gray-800 mb-3">
                        Analysis Completion
                      </h3>
                      <div className="flex items-center mb-4">
                        <input
                          id="notify-success"
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label
                          htmlFor="notify-success"
                          className="ml-2 text-gray-700"
                        >
                          Successful analyses
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="notify-failed"
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label
                          htmlFor="notify-failed"
                          className="ml-2 text-gray-700"
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
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Security Settings
                  </h2>

                  <div className="space-y-8">
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-yellow-500"
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
                          <p className="text-sm text-yellow-700">
                            Your account security is important. We recommend
                            changing your password regularly.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">
                        Change Password
                      </h3>
                      <form className="space-y-4">
                        <div>
                          <Input
                            label="Current Password"
                            type="password"
                            name="currentPasswordSecurity"
                            placeholder="Enter your current password"
                            required
                          />
                        </div>
                        <div>
                          <Input
                            label="New Password"
                            type="password"
                            name="newPasswordSecurity"
                            placeholder="Enter your new password"
                            required
                          />
                        </div>
                        <div>
                          <Input
                            label="Confirm New Password"
                            type="password"
                            name="confirmPasswordSecurity"
                            placeholder="Confirm your new password"
                            required
                          />
                        </div>
                        <Button
                          label="Update Password"
                          onClick={(e) => {
                            e.preventDefault();
                            toast.success("Password updated successfully!");
                          }}
                        />
                      </form>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">
                        Two-Factor Authentication
                      </h3>
                      <p className="text-gray-600 mb-4">
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

                    <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                      <h3 className="text-lg font-medium text-red-800 mb-4">
                        Delete Account
                      </h3>
                      <p className="text-red-600 mb-4">
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
