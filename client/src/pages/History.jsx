import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "../contexts/AnalysisContext";
import HistoryItem from "../components/history/HistoryItem";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";
import useProtectedNavigation from "../hooks/useProtectedNavigation";

const History = () => {
  const { analysisHistory, isLoading, fetchAnalysisHistory } = useAnalysis();
  const navigate = useNavigate();

  // Use our custom hook to handle protected navigation
  useProtectedNavigation(true, "/login");

  useEffect(() => {
    // Fetch analysis history only once on component mount
    fetchAnalysisHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use useMemo to compute error and success items only when analysisHistory changes
  const { errorItems, successItems } = useMemo(() => {
    if (!analysisHistory || analysisHistory.length === 0) {
      return { errorItems: [], successItems: [] };
    }

    const errors = [];
    const successes = [];

    // Single loop iteration for better performance
    analysisHistory.forEach((item) => {
      if (item && item.asin && item.keyword) {
        if (item.result && item.result.error === true) {
          errors.push(item);
        } else {
          successes.push(item);
        }
      }
    });

    return { errorItems: errors, successItems: successes };
  }, [analysisHistory]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-primary-700 to-primary-900 rounded-lg shadow-lg p-8 mb-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Your Analysis History</h1>
            <p className="text-primary-100 mt-2">
              View and manage your previous product analyses
            </p>
          </div>
          <Button
            onClick={() => navigate("/")}
            label="New Analysis"
            variant="outline"
            className="bg-white text-primary-700 border-white hover:bg-opacity-90"
          />
        </div>
      </div>

      {analysisHistory.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center border border-gray-100">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              No analyses yet
            </h2>
            <p className="text-gray-600 mb-6 max-w-md">
              You haven't performed any product analyses yet. Start by analyzing
              your first product to get valuable insights!
            </p>
            <Button
              onClick={() => navigate("/")}
              label="Analyze Your First Product"
              className="bg-gradient-to-r from-primary-600 to-primary-700"
            />
          </div>
        </div>
      ) : (
        <div>
          {successItems.length > 0 && (
            <>
              <div className="flex items-center mb-4">
                <div className="w-2 h-8 bg-primary-600 rounded-r mr-3"></div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Completed Analyses
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {successItems.map((item, index) => {
                  // Ensure we have a valid item before rendering
                  if (!item || !item.asin || !item.keyword) {
                    console.warn("Invalid success item at index", index);
                    return null;
                  }
                  return <HistoryItem key={`success-${index}`} item={item} />;
                })}
              </div>
            </>
          )}

          {errorItems.length > 0 && (
            <>
              <div className="flex items-center mb-4">
                <div className="w-2 h-8 bg-red-500 rounded-r mr-3"></div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Failed Analyses
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {errorItems.map((item, index) => {
                  // Ensure we have a valid item before rendering
                  if (!item || !item.asin || !item.keyword) {
                    console.warn("Invalid error item at index", index);
                    return null;
                  }
                  return <HistoryItem key={`error-${index}`} item={item} />;
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default History;
