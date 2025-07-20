import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAnalysis } from "../contexts/AnalysisContext";
import { useAuth } from "../contexts/AuthContext";
import ProsCons from "../components/analysis/ProsCons";
import SentimentChart from "../components/analysis/SentimentChart";
import CompetitorComparison from "../components/analysis/CompetitorComparison";
import KeyRecommendations from "../components/analysis/KeyRecommendations";
import ShareAnalysis from "../components/analysis/ShareAnalysis";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";
import useProtectedNavigation from "../hooks/useProtectedNavigation";
import { generateAndDownloadPDF } from "../utils/pdfGenerator";

const Results = () => {
  const { asin, keyword } = useParams();
  const { currentAnalysis, isLoading, loadAnalysis } = useAnalysis();
  const { user } = useAuth();
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [analysisError, setAnalysisError] = useState(null);
  const [userPreferences, setUserPreferences] = useState({
    autoExportPdf: true,
  });
  const navigate = useNavigate();

  // Use our custom hook to handle protected navigation
  useProtectedNavigation(true, "/login");
  useEffect(() => {
    const fetchAnalysis = async () => {
      if (asin && keyword) {
        try {
          setAnalysisError(null);
          const result = await loadAnalysis(asin, decodeURIComponent(keyword));

          // Check if the result is an error response from the Python script
          if (result && result.error === true) {
            setAnalysisError(result.message || "Analysis failed");
            toast.error(`Error: ${result.message || "Analysis failed"}`);
          }
        } catch (error) {
          console.error("Error loading analysis:", error);
          setAnalysisError(error.message || "Failed to load analysis");
          toast.error(`Error: ${error.message || "Failed to load analysis"}`);
        }
      }
    };

    fetchAnalysis();
  }, [asin, keyword, loadAnalysis]);

  // Listen for preference changes from other components
  useEffect(() => {
    const handlePreferenceChange = (event) => {
      const { key, value: eventValue } = event.detail;
      console.log(
        `RESULTS: Received preference change event: ${key}=${eventValue}`
      );

      if (key === "autoExportPdf") {
        console.log(
          `RESULTS: Updating autoExportPdf preference to: ${eventValue}`
        );

        // Get the latest value directly from localStorage
        let finalValue = eventValue;
        try {
          const userData = JSON.parse(localStorage.getItem("user"));
          if (
            userData &&
            userData.preferences &&
            userData.preferences.hasOwnProperty("autoExportPdf")
          ) {
            const storageValue = userData.preferences.autoExportPdf;
            console.log(
              `EXTRA CHECK: Current localStorage value = ${storageValue}`
            );

            // If they don't match, prefer the localStorage value
            if (eventValue !== storageValue) {
              console.log(
                `WARNING: Event value (${eventValue}) differs from localStorage (${storageValue}). Using localStorage.`
              );
              finalValue = storageValue;
            }
          }
        } catch (error) {
          console.error("Error reading localStorage in event handler:", error);
        }

        // Update the preference immediately and log the update
        setUserPreferences((prev) => {
          const updatedPrefs = {
            ...prev,
            [key]: finalValue,
          };
          console.log(
            "RESULTS: Updated preferences after event:",
            updatedPrefs
          );
          return updatedPrefs;
        });

        // Force a re-render by setting a temporary state
        setTimeout(() => {
          // Using a timeout to see the actual updated value after state update
          console.log(
            "RESULTS: Verifying preference was updated:",
            `Current value = ${userPreferences.autoExportPdf}`
          );
        }, 100);
      }
    };

    // Add event listener for preference changes
    console.log("RESULTS: Setting up userPreferenceChanged event listener");
    window.addEventListener("userPreferenceChanged", handlePreferenceChange);

    return () => {
      console.log("RESULTS: Removing userPreferenceChanged event listener");
      window.removeEventListener(
        "userPreferenceChanged",
        handlePreferenceChange
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Get user preferences and set default for autoExportPdf
  useEffect(() => {
    // Function to get latest preferences from localStorage
    const getLatestPreferences = () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        if (
          userData &&
          userData.preferences &&
          userData.preferences.autoExportPdf !== undefined
        ) {
          console.log(
            `DIRECT CHECK: localStorage autoExportPdf = ${userData.preferences.autoExportPdf}`
          );
          return userData.preferences.autoExportPdf;
        }
      } catch (error) {
        console.error("Error reading preferences from localStorage:", error);
      }
      return null;
    };

    // First try to get the most up-to-date value directly from localStorage
    const localStorageValue = getLatestPreferences();
    if (localStorageValue !== null) {
      console.log(
        `Setting preference directly from localStorage: autoExportPdf = ${localStorageValue}`
      );
      setUserPreferences((prev) => ({
        ...prev,
        autoExportPdf: localStorageValue,
      }));
      return;
    }

    // Fall back to user context if localStorage direct access didn't work
    if (user && user.preferences) {
      console.log("User preferences found:", user.preferences);

      // Strictly check for boolean value in the preferences
      const autoExportPdfValue = user.preferences.autoExportPdf;
      console.log(
        `AutoExportPdf value from user context: ${autoExportPdfValue}`
      );

      setUserPreferences((prevPrefs) => {
        const newPrefs = {
          ...prevPrefs,
          // Only use the value if it's explicitly defined
          autoExportPdf:
            autoExportPdfValue !== undefined ? autoExportPdfValue : true,
        };
        console.log("Updated user preferences from user context:", newPrefs);
        return newPrefs;
      });
    } else {
      console.log("No user preferences found, using defaults");
    }
  }, [user]); // Auto-export PDF when analysis is loaded successfully
  useEffect(() => {
    // Get the most up-to-date value directly from localStorage
    const getAutoExportPreferenceFromStorage = () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        if (
          userData &&
          userData.preferences &&
          userData.preferences.hasOwnProperty("autoExportPdf")
        ) {
          const storedValue = userData.preferences.autoExportPdf;
          console.log(
            `CRITICAL CHECK: autoExportPdf in localStorage = ${storedValue}`
          );
          return storedValue;
        }
      } catch (error) {
        console.error("Error reading preferences from localStorage:", error);
      }
      return null; // Return null if we can't find the value
    };

    // Get the current component state value
    const { autoExportPdf } = userPreferences;
    console.log(`Auto-export check - component state value: ${autoExportPdf}`);

    // Always prioritize the localStorage value if available
    const storedPreference = getAutoExportPreferenceFromStorage();
    const finalAutoExportValue =
      storedPreference !== null ? storedPreference : autoExportPdf;

    console.log(`Auto-export FINAL DECISION value: ${finalAutoExportValue}`);
    console.log(
      `Auto-export analysis status: ${
        currentAnalysis ? "loaded" : "not loaded"
      }`
    );

    // If auto-export is disabled, exit early
    if (finalAutoExportValue === false) {
      console.log(
        "Auto-export is explicitly turned OFF - skipping PDF generation"
      );
      return;
    }

    // Create a separate function for PDF generation to improve clarity
    const generatePDF = async () => {
      try {
        console.log("Starting PDF generation process");
        if (!currentAnalysis || currentAnalysis.error || !asin || !keyword) {
          console.log("Required data for PDF is missing - skipping generation");
          return;
        }
        await generateAndDownloadPDF(
          currentAnalysis,
          asin,
          decodeURIComponent(keyword),
          true // This is an auto-export
        );
        console.log("PDF generation completed successfully");
      } catch (error) {
        console.error("PDF generation failed:", error);
      }
    };

    // Check if we have all required data and should generate the PDF
    if (
      finalAutoExportValue === true &&
      currentAnalysis &&
      !currentAnalysis.error &&
      asin &&
      keyword
    ) {
      console.log("Auto-export is ON and data is available - generating PDF");
      generatePDF();
    } else {
      console.log("Auto-export conditions not met - no PDF will be generated");
    }
  }, [currentAnalysis, asin, keyword, userPreferences]);

  const handleCopyResults = () => {
    const textToCopy = JSON.stringify(currentAnalysis, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopySuccess(true);
    toast.success("Results copied to clipboard");
    setTimeout(() => setCopySuccess(false), 2000);
  };
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Analysis Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{analysisError}</p>
              </div>
              <div className="mt-4">
                <Button
                  label="Try Again"
                  onClick={() => navigate("/")}
                  variant="danger"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Basic validation of the analysis data structure
  const validateAnalysisData = () => {
    try {
      // First check if this is an error response from the Python script
      if (currentAnalysis && currentAnalysis.error === true) {
        return {
          valid: false,
          message: currentAnalysis.message || "Analysis failed with an error",
          isError: true,
        };
      }

      const requiredFields = [
        "product_summary",
        "main_product",
        "competitors",
        "key_changes_for_sales",
        "complete_report",
      ];

      const missingFields = requiredFields.filter(
        (field) => !currentAnalysis || !currentAnalysis[field]
      );

      if (missingFields.length > 0) {
        return {
          valid: false,
          message: `Analysis data is missing required fields: ${missingFields.join(
            ", "
          )}`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: `Error validating analysis data: ${error.message}`,
      };
    }
  };

  const dataValidation = validateAnalysisData();
  if (!dataValidation.valid) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Analysis Data Issue
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{dataValidation.message}</p>
                <p className="mt-2">
                  The analysis data may be incomplete or in an unexpected
                  format.
                </p>
              </div>
              <div className="mt-4">
                <Button
                  label="Try Again"
                  onClick={() => navigate("/")}
                  variant="warning"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Raw Analysis Data</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
            {JSON.stringify(currentAnalysis, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  if (!currentAnalysis) {
    return (
      <div className="text-center p-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          No Analysis Found
        </h2>
        <p className="text-gray-600 mb-6">
          We couldn't find any analysis for this product. Please try again with
          a different ASIN or keyword.
        </p>
        <Button
          label="Back to Search"
          onClick={() => navigate("/")}
          variant="primary"
        />
      </div>
    );
  }

  const { product_summary, main_product, competitors, key_changes_for_sales } =
    currentAnalysis;
  const TabNavigation = () => (
    <div className="mb-6 border-b border-gray-200">
      <div className="flex justify-between items-center">
        <nav className="-mb-px flex space-x-8">
          {["summary", "competitors", "recommendations", "details"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {tab}
              </button>
            )
          )}
        </nav>

        {/* Auto-export PDF indicator */}
        <div className="text-xs text-gray-500 flex items-center">
          <span
            className={`inline-block w-3 h-3 rounded-full mr-2 ${
              userPreferences.autoExportPdf ? "bg-green-500" : "bg-red-500"
            }`}
          ></span>
          Auto PDF: {userPreferences.autoExportPdf ? "On" : "Off"}
        </div>
      </div>
    </div>
  );
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Analysis Results: {asin}
        </h1>{" "}
        <div className="flex items-center space-x-4">
          <ShareAnalysis analysisData={currentAnalysis} asin={asin} />

          <Button
            onClick={handleCopyResults}
            label={copySuccess ? "Copied!" : "Copy JSON"}
            variant={copySuccess ? "success" : "primary"}
            size="sm"
          />
        </div>
      </div>
      <TabNavigation />{" "}
      {activeTab === "summary" && (
        <>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Product Summary
            </h2>
            {product_summary ? (
              <>
                <div className="mb-4">
                  <h3 className="font-medium text-gray-700">Description</h3>
                  <p className="text-gray-600">
                    {product_summary.description || "No description available"}
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="font-medium text-gray-700">Main Problems</h3>
                  <p className="text-gray-600">
                    {product_summary.main_problems ||
                      "No main problems identified"}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-yellow-600">
                Product summary data is missing or incomplete.
              </p>
            )}
          </div>

          {/* Main Product Analysis */}
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Main Product Analysis
          </h2>
          {main_product ? (
            <>
              <ProsCons
                pros={main_product.pros || []}
                cons={main_product.cons || []}
                title={`Product Pros & Cons (ASIN: ${asin})`}
              />

              {/* Sentiment Chart */}
              <SentimentChart
                mainProduct={main_product}
                competitors={competitors || []}
              />
            </>
          ) : (
            <div className="bg-yellow-50 p-4 rounded mb-6">
              <p className="text-yellow-700">
                Main product analysis data is missing or incomplete.
              </p>
            </div>
          )}
        </>
      )}{" "}
      {activeTab === "competitors" && (
        <>
          {competitors && competitors.length > 0 ? (
            <>
              <CompetitorComparison
                mainProduct={main_product || {}}
                competitors={competitors}
              />

              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Competitor Breakdown
              </h2>
              {competitors.map((competitor, index) => (
                <div key={index} className="mb-6">
                  <ProsCons
                    pros={competitor.pros || []}
                    cons={competitor.cons || []}
                    title={`Competitor: ${
                      competitor.identifier || `#${index + 1}`
                    }`}
                  />
                </div>
              ))}
            </>
          ) : (
            <div className="bg-yellow-50 p-4 rounded mb-6">
              <p className="text-yellow-700">
                No competitor data available for this product.
              </p>
            </div>
          )}
        </>
      )}{" "}
      {activeTab === "recommendations" && (
        <>
          {key_changes_for_sales && key_changes_for_sales.length > 0 ? (
            <KeyRecommendations recommendations={key_changes_for_sales} />
          ) : (
            <div className="bg-yellow-50 p-4 rounded mb-6">
              <p className="text-yellow-700">
                No recommendation data available for this product.
              </p>
            </div>
          )}
        </>
      )}{" "}
      {activeTab === "details" && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Complete Report
          </h2>

          {currentAnalysis.complete_report ? (
            <>
              <div className="mb-4">
                <h3 className="font-medium text-gray-700">Product Analysis</h3>
                <p className="text-gray-600">
                  {currentAnalysis.complete_report.product_analysis ||
                    "No detailed product analysis available."}
                </p>
              </div>
              <div className="mb-4">
                <h3 className="font-medium text-gray-700">
                  Competitor Analysis
                </h3>
                <p className="text-gray-600">
                  {currentAnalysis.complete_report.competitor_analysis ||
                    "No detailed competitor analysis available."}
                </p>
              </div>
              <div className="mb-4">
                <h3 className="font-medium text-gray-700">Recommendations</h3>
                <p className="text-gray-600">
                  {currentAnalysis.complete_report.recommendations ||
                    "No detailed recommendations available."}
                </p>
              </div>
            </>
          ) : (
            <div className="bg-yellow-50 p-4 rounded mb-6">
              <p className="text-yellow-700">
                Detailed report data is missing or incomplete.
              </p>
            </div>
          )}

          {/* Add raw JSON button for debugging */}
          <div className="mt-8 border-t pt-4">
            <details className="text-sm">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                View Raw Analysis Data (Debug)
              </summary>
              <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(currentAnalysis, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
