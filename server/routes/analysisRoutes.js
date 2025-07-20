const express = require("express");
const router = express.Router();
const {
  getAnalyses,
  checkAnalysis,
  getAnalysisById,
  createAnalysis,
} = require("../controllers/analysisController");
const { protect } = require("../middleware/authMiddleware");

// All routes are protected
router.use(protect);

// Get all analyses for the logged-in user
router.get("/", getAnalyses);

// Check if an analysis exists
router.get("/check/:asin/:keyword", checkAnalysis);

// Get analysis by ID
router.get("/:id", getAnalysisById);

// Create a new analysis
router.post("/", createAnalysis);

module.exports = router;
