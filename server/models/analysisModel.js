const mongoose = require("mongoose");

const AnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  asin: {
    type: String,
    required: [true, "Please provide an ASIN"],
  },
  keyword: {
    type: String,
    required: [true, "Please provide a search keyword"],
  },
  result: {
    type: Object,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index for ASIN and keyword to ensure uniqueness for each user
AnalysisSchema.index({ user: 1, asin: 1, keyword: 1 }, { unique: true });

module.exports = mongoose.model("Analysis", AnalysisSchema);
