import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import { useAnalysis } from "../contexts/AnalysisContext";
import useProtectedNavigation from "../hooks/useProtectedNavigation";

const Home = () => {
  const [asin, setAsin] = useState("");
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { analyzeProduct } = useAnalysis();
  const navigate = useNavigate();

  // Use our custom hook to handle protected navigation
  useProtectedNavigation(true, "/login");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!asin) {
      return toast.error("Please enter a product ASIN");
    }

    if (!keyword) {
      return toast.error("Please enter a search keyword");
    }

    setIsLoading(true);
    try {
      // Show a loading toast that we'll dismiss on success
      const loadingToast = toast.loading("Analyzing product...");

      await analyzeProduct(asin, keyword);

      // Dismiss the loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Analysis complete!");

      navigate(`/results/${asin}/${encodeURIComponent(keyword)}`);
    } catch (error) {
      console.error("Analysis error:", error);

      // Provide more specific error messages for common issues
      let errorMessage = error.message || "Unknown error";

      if (errorMessage.includes("Failed to generate required embeddings")) {
        errorMessage =
          "Unable to analyze this product. The required data could not be generated. Please try a different ASIN or keyword.";
      }

      toast.error(`Error analyzing product: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center py-10">
      {/* Hero Section with gradient background */}
      <div className="w-full bg-gradient-to-r from-primary-700 to-primary-900 py-16 mb-12 rounded-lg">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Amazon Product Analysis
          </h1>
          <p className="text-xl text-primary-100 mb-8">
            Get comprehensive insights about Amazon products and their
            competitors using advanced AI
          </p>
        </div>
      </div>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Start Your Analysis
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Amazon Product ASIN"
            placeholder="Enter product ASIN (e.g., B09Z65PBXP)"
            value={asin}
            onChange={(e) => setAsin(e.target.value)}
            required
          />

          <Input
            label="Search Keyword"
            placeholder="Enter search keyword (e.g., LED TV)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            required
          />

          <Button
            type="submit"
            label={isLoading ? "Analyzing..." : "Analyze Product"}
            isLoading={isLoading}
            disabled={isLoading}
            fullWidth
            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
          />
        </form>

        <div className="mt-6 text-sm text-gray-600">
          <p className="text-center">
            This tool analyzes Amazon products using AI techniques to provide
            comprehensive insights.
          </p>
        </div>
      </div>

      <div className="mt-16 max-w-4xl text-center px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-primary-500 hover:transform hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-5 text-white">
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Enter ASIN & Keyword
            </h3>
            <p className="text-gray-600">
              Input the Amazon product ASIN and a search keyword to find
              competitors
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-primary-500 hover:transform hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-5 text-white">
              <span className="text-xl font-bold">2</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              AI Analysis
            </h3>
            <p className="text-gray-600">
              Our AI analyzes the product, reviews, and competitors to generate
              insights
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-primary-500 hover:transform hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-5 text-white">
              <span className="text-xl font-bold">3</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Get Insights
            </h3>
            <p className="text-gray-600">
              View detailed analysis with actionable insights and
              recommendations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
