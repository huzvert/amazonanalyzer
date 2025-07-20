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
    ); // Spawn a Python process with --json flag to get cleaner JSON output
    const pythonProcess = spawn("python", [
      pythonScriptPath,
      "--asin",
      asin,
      "--keyword",
      keyword,
      "--json",
    ]);

    let dataString = "";
    let errorString = "";

    // Collect data from script
    pythonProcess.stdout.on("data", (data) => {
      dataString += data.toString();
    });

    // Collect errors from script
    pythonProcess.stderr.on("data", (data) => {
      errorString += data.toString();
      console.error(`Python Error: ${data}`);
    });

    // Handle script completion
    pythonProcess.on("close", async (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        return res.status(500).json({
          message: "Error running analysis script",
          error: errorString,
        });
      }

      try {
        // Check if the output contains an error message in JSON format
        if (dataString.includes('"error":true')) {
          // Try to extract the error JSON
          const errorMatch = dataString.match(/\{.*"error"\s*:\s*true.*\}/s);
          if (errorMatch) {
            const errorJson = JSON.parse(errorMatch[0]);
            return res.status(500).json(errorJson);
          }
        }

        // Function to find the most likely complete JSON object in a string
        const extractValidJson = (str) => {
          // Look for the outermost JSON object
          let depth = 0;
          let startIndex = -1;

          for (let i = 0; i < str.length; i++) {
            if (str[i] === "{") {
              if (depth === 0) {
                startIndex = i;
              }
              depth++;
            } else if (str[i] === "}") {
              depth--;
              if (depth === 0 && startIndex !== -1) {
                // Found a complete JSON object
                try {
                  const jsonCandidate = str.substring(startIndex, i + 1);
                  // Test if it's valid JSON
                  JSON.parse(jsonCandidate);
                  return jsonCandidate;
                } catch (e) {
                  // Not valid JSON, continue searching
                  continue;
                }
              }
            }
          }

          // If we couldn't find a valid JSON object, fall back to the last occurrence approach
          const jsonStartPos = str.lastIndexOf("{");
          const jsonEndPos = str.lastIndexOf("}");

          if (
            jsonStartPos !== -1 &&
            jsonEndPos !== -1 &&
            jsonStartPos < jsonEndPos
          ) {
            return str.substring(jsonStartPos, jsonEndPos + 1);
          }

          return null;
        };

        // Try to extract valid JSON from the output
        const validJson = extractValidJson(dataString);

        if (!validJson) {
          throw new Error("Could not find valid JSON in the output");
        }

        console.log("Extracted JSON:", validJson.substring(0, 100) + "..."); // Clean the JSON string before parsing
        const cleanJsonString = validJson.trim();
        let result;
        try {
          // Try to parse the cleaned JSON
          result = JSON.parse(cleanJsonString);

          // Check if the result is an error response
          if (result.error === true) {
            console.log(
              "Received error response from Python script:",
              result.message
            );
            return res.status(500).json({
              message: result.message || "Error from analysis script",
              error: true,
            });
          }
        } catch (jsonError) {
          console.error("JSON parse error:", jsonError);
          throw new Error(`Failed to parse JSON: ${jsonError.message}`);
        }

        // Save the analysis to the database
        const newAnalysis = await Analysis.create({
          user: req.user._id,
          asin,
          keyword,
          result,
        });

        res.status(201).json(result);
      } catch (error) {
        console.error("Error saving analysis:", error);
        res.status(500).json({
          message: "Error processing analysis result",
          error: error.message,
        });
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
