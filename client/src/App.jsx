import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Results from "./pages/Results";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import AboutUs from "./pages/AboutUs";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { AnalysisProvider } from "./contexts/AnalysisContext";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <AuthProvider>
      <AnalysisProvider>
        <ThemeProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-dark-bg dark:text-dark-text transition-colors duration-200">
              <Toaster position="top-right" />

              {/* Navbar is visible only on mobile */}
              <div className="lg:hidden">
                <Navbar toggleMobileSidebar={toggleMobileSidebar} />
              </div>

              {/* Sidebar and Main Content Layout */}
              <div className="flex flex-grow">
                {/* Sidebar */}
                <Sidebar
                  isMobileSidebarOpen={isMobileSidebarOpen}
                  toggleMobileSidebar={toggleMobileSidebar}
                />

                {/* Main Content */}
                <div className="flex-grow lg:ml-64 transition-all duration-300">
                  <main className="container mx-auto px-4 py-8">
                    {" "}
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute>
                            <Home />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/results/:asin/:keyword"
                        element={
                          <ProtectedRoute>
                            <Results />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/history"
                        element={
                          <ProtectedRoute>
                            <History />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/analytics"
                        element={
                          <ProtectedRoute>
                            <Analytics />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <Settings />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/about" element={<AboutUs />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </div>
            </div>
          </Router>
        </ThemeProvider>
      </AnalysisProvider>
    </AuthProvider>
  );
}

export default App;
