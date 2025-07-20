import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import analysisService from "../services/analysisService";
import authService from "../services/authService";

const AnalysisContext = createContext();

export const useAnalysis = () => useContext(AnalysisContext);

export const AnalysisProvider = ({ children }) => {
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load analysis history when authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      fetchAnalysisHistory();
    }
  }, []);

  // Load analysis from backend
  const analyzeProduct = async (asin, keyword) => {
    setIsLoading(true);

    try {
      // First check if we already have the analysis in our local history
      const existingAnalysis = analysisHistory.find(
        (item) => item.asin === asin && item.keyword === keyword
      );

      if (existingAnalysis) {
        setCurrentAnalysis(existingAnalysis.result);
        toast.success("Analysis loaded from history");
        return existingAnalysis.result;
      }

      // If not, use our analysis service
      const response = await analysisService.getOrCreateAnalysis(asin, keyword);

      if (!response.success) {
        // Try to parse error messages from JSON strings
        let errorMessage = "Failed to analyze product";

        if (typeof response.error === "string") {
          try {
            // Check if it's a stringified JSON object
            if (response.error.includes("{") && response.error.includes("}")) {
              const parsedError = JSON.parse(
                response.error.substring(
                  response.error.indexOf("{"),
                  response.error.lastIndexOf("}") + 1
                )
              );
              errorMessage = parsedError.message || errorMessage;
            } else {
              // Just use the error string
              errorMessage = response.error;
            }
          } catch (e) {
            // If can't parse as JSON, just use the error string
            errorMessage = response.error;
          }
        }

        throw new Error(errorMessage);
      }

      setCurrentAnalysis(response.data);

      // Add to history if not already there
      setAnalysisHistory((prev) => [
        ...prev.filter(
          (item) => !(item.asin === asin && item.keyword === keyword)
        ),
        {
          asin,
          keyword,
          result: response.data,
          timestamp: new Date().toISOString(),
          isNew: response.isNew,
        },
      ]);

      if (response.isNew) {
        toast.success("Analysis completed successfully");
      } else {
        toast.success("Existing analysis loaded");
      }

      return response.data;
    } catch (error) {
      toast.error(`Analysis failed: ${error.message || "Unknown error"}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Load an existing analysis
  const loadAnalysis = (asin, keyword) => {
    setIsLoading(true);

    try {
      // Check if we have it in history
      const existingAnalysis = analysisHistory.find(
        (item) => item.asin === asin && item.keyword === keyword
      );

      if (existingAnalysis) {
        setCurrentAnalysis(existingAnalysis.result);
        return existingAnalysis.result;
      } else {
        // If not in history, try to fetch it
        return analyzeProduct(asin, keyword);
      }
    } finally {
      setIsLoading(false);
    }
  }; // Fetch user's analysis history from the backend
  const fetchAnalysisHistory = async () => {
    setIsLoading(true);

    try {
      const response = await analysisService.getUserAnalyses();

      if (response.success) {
        console.log("Raw history data:", response.data);

        // Process the data to ensure error objects are properly formatted
        const processedData = response.data
          .filter((item) => {
            // Filter out any invalid items
            if (!item || !item.asin || !item.keyword) {
              console.warn("Invalid analysis history item detected", item);
              return false;
            }
            return true;
          })
          .map((item) => {
            try {
              // Make sure error flags are preserved and properly structured
              if (
                item.result &&
                (item.result.error === true ||
                  item.result.isErrorResult === true)
              ) {
                return {
                  ...item,
                  result: {
                    error: true,
                    message: item.result.message || "Analysis failed",
                    // Preserve any other properties that might exist
                    ...(item.result || {}),
                  },
                };
              }

              // Check if result has all required fields
              if (item.result) {
                const requiredFields = [
                  "product_summary",
                  "main_product",
                  "competitors",
                ];
                const missingFields = requiredFields.filter(
                  (field) => !item.result[field]
                );

                if (missingFields.length > 0) {
                  console.warn(
                    `Analysis for ${
                      item.asin
                    } missing fields: ${missingFields.join(", ")}`
                  );
                  return {
                    ...item,
                    result: {
                      error: true,
                      message: `Missing required data: ${missingFields.join(
                        ", "
                      )}`,
                      originalResult: item.result,
                    },
                  };
                }
              }

              return item;
            } catch (err) {
              console.error("Error processing history item:", err);
              return {
                ...item,
                result: {
                  error: true,
                  message: "Error processing analysis data",
                },
              };
            }
          });

        console.log("Processed history data:", processedData);
        setAnalysisHistory(processedData);
      } else {
        toast.error("Failed to load analysis history");
      }
    } catch (error) {
      console.error("Error fetching analysis history:", error);
      toast.error("Failed to load analysis history");
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentAnalysis,
    analysisHistory,
    isLoading,
    analyzeProduct,
    loadAnalysis,
    fetchAnalysisHistory,
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
};
