const { spawn } = require("child_process");
const path = require("path");
const Analysis = require("../models/analysisModel");

// @desc    Get all analyses for the logged-in user
// @route   GET /api/analysis
// @access  Private
const getAnalyses = async (req, res) => {
  try {
    const analyses = await Analysis.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    // Map analyses to include error flag in the result for proper handling
    const safeAnalyses = analyses.map((analysis) => {
      const doc = analysis.toObject();

      // Check various error conditions
      if (doc.result) {
        // Case 1: Error flag is already set
        if (doc.result.error === true) {
          return {
            ...doc,
            result: {
              error: true,
              message: doc.result.message || "Analysis failed",
              isErrorResult: true,
            },
          };
        }

        // Case 2: Result structure doesn't have required fields (malformed result)
        const requiredFields = [
          "product_summary",
          "main_product",
          "competitors",
        ];
        const missingFields = requiredFields.filter(
          (field) => !doc.result[field]
        );

        if (missingFields.length > 0) {
          return {
            ...doc,
            result: {
              error: true,
              message: `Missing required data: ${missingFields.join(", ")}`,
              isErrorResult: true,
              originalResult: doc.result, // Keep original for debugging
            },
          };
        }
      } else {
        // Case 3: No result at all
        return {
          ...doc,
          result: {
            error: true,
            message: "No analysis data available",
            isErrorResult: true,
          },
        };
      }

      // Default case: Valid result
      return doc;
    });

    res.json(safeAnalyses);
  } catch (error) {
    console.error("Error fetching analyses:", error);
    res.status(500).json({ message: "Server error while fetching analyses" });
  }
};

// @desc    Check if an analysis exists or create a new one
// @route   GET /api/analysis/:asin/:keyword
// @access  Private
const checkAnalysis = async (req, res) => {
  try {
    const { asin, keyword } = req.params;

    // Check if analysis exists
    const existingAnalysis = await Analysis.findOne({
      user: req.user._id,
      asin,
      keyword,
    });

    if (existingAnalysis) {
      return res.json({
        exists: true,
        data: existingAnalysis.result,
      });
    }

    // If not found
    return res.json({
      exists: false,
    });
  } catch (error) {
    console.error("Error checking analysis:", error);
    res
      .status(500)
      .json({ message: "Server error while checking for analysis" });
  }
};

// @desc    Get a specific analysis by ID
// @route   GET /api/analysis/:id
// @access  Private
const getAnalysisById = async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);

    if (!analysis) {
      return res.status(404).json({ message: "Analysis not found" });
    }

    // Check if analysis belongs to the logged-in user
    if (analysis.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this analysis" });
    }

    res.json(analysis.result);
  } catch (error) {
    console.error("Error fetching analysis by ID:", error);
    res.status(500).json({ message: "Server error while fetching analysis" });
  }
};

// @desc    Create a new analysis
// @route   POST /api/analysis
// @access  Private
const createAnalysis = async (req, res) => {
  try {
    const { asin, keyword } = req.body;

    if (!asin || !keyword) {
      return res.status(400).json({ message: "ASIN and keyword are required" });
    }

    // Check if analysis already exists
    const existingAnalysis = await Analysis.findOne({
      user: req.user._id,
      asin,
      keyword,
    });

    if (existingAnalysis) {
      return res.json(existingAnalysis.result);
    }

    // Define the path to the Python script
    const pythonScriptPath = path.resolve(
      __dirname,
      "../../analysis/src/RAG.py"
    );
    // Log the Python command for debugging
    console.log("[DEBUG] Spawning Python:", `python ${pythonScriptPath} --asin ${asin} --keyword ${keyword} --json`);
    // --- PATCH: Use UTF-8 env and robust stdout buffering ---
    const pythonProcess = spawn("python", [
      pythonScriptPath,
      "--asin",
      asin,
      "--keyword",
      keyword,
      "--json",
      "--force-rebuild"
    ], {
      env: {
        ...process.env,
        PYTHONUTF8: '1'
      }
    });

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.error(`[PYTHON STDERR] ${data}`);
    });

    pythonProcess.on('close', async (code) => {
      console.log("🚨 Exit code:", code);
      console.log("📤 Raw stdout:", stdoutData);
      console.log("❗ stderr:", stderrData);

      // Extract JSON using BEGIN/END markers from Python output
      const start = stdoutData.indexOf("===BEGIN_JSON===");
      const end = stdoutData.indexOf("===END_JSON===");
      if (start !== -1 && end !== -1) {
        const jsonString = stdoutData.slice(start + 16, end).trim();
        let result;
        try {
          result = JSON.parse(jsonString);
        } catch (e) {
          console.error("❌ JSON parsing failed:", e);
          return res.status(500).json({ error: "Malformed JSON from Python" });
        }
        // Fallbacks for missing fields
        result.product_summary = result.product_summary || "⚠️ Field missing in AI response.";
        result.main_product = result.main_product || "⚠️ Field missing in AI response.";
        result.key_changes_for_sales = result.key_changes_for_sales || "⚠️ Field missing in AI response.";
        result.complete_report = result.complete_report || "⚠️ Field missing in AI response.";
        result.competitors = Array.isArray(result.competitors) ? result.competitors : [];
        // Save the analysis to the database
        await Analysis.create({
          user: req.user._id,
          asin,
          keyword,
          result,
        });
        return res.status(201).json(result);
      } else {
        console.error("❌ JSON markers not found in Python output.");
        return res.status(500).json({ error: "JSON markers not found in Python output." });
      }
    });
  } catch (error) {
    console.error("Error creating analysis:", error);
    res.status(500).json({ message: "Server error while creating analysis" });
  }
};

module.exports = {
  getAnalyses,
  checkAnalysis,
  getAnalysisById,
  createAnalysis,
};
