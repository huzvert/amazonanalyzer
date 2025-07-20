require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const { spawn } = require("child_process");

// Check if environment variables are loaded
console.log("Environment variables loaded:");
console.log("PORT:", process.env.PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);

// Import routes
const userRoutes = require("./routes/userRoutes");
const analysisRoutes = require("./routes/analysisRoutes");

// Connect to MongoDB
const connectDB = require("./config/db");
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/analysis", analysisRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: err.message || "An unexpected error occurred" });
});

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static(path.join(__dirname, "../Frontend/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../Frontend/build", "index.html"));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
