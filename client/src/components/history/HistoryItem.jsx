import React, { memo } from "react";
import { Link } from "react-router-dom";
import { formatDistance } from "date-fns";

// Use memo to prevent unnecessary re-renders
const HistoryItem = memo(({ item }) => {
  if (!item) {
    console.error("Missing item in HistoryItem");
    return (
      <div className="border border-red-300 p-4 rounded-lg">
        Invalid analysis item
      </div>
    );
  }

  const { asin, keyword, result, timestamp } = item;

  // Handle potential undefined result
  if (!result) {
    console.warn(`Item with ASIN ${asin} has no result data`);
  }

  // Check if result exists and is not an error
  const hasValidResult =
    result &&
    !result.error &&
    result.product_summary &&
    result.main_product &&
    result.competitors;

  // Format the timestamp
  const formattedTime = timestamp
    ? formatDistance(new Date(timestamp), new Date(), { addSuffix: true })
    : "Unknown time";

  // Get summary data if available
  const summary =
    hasValidResult && result?.product_summary?.description
      ? result.product_summary.description.substring(0, 100) + "..."
      : result?.error
      ? `Error: ${result.message || "Analysis failed"}`
      : "No summary available";

  return (
    <div
      className={`rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl
                ${
                  hasValidResult
                    ? "border-l-4 border-primary-500 bg-white"
                    : "border-l-4 border-red-500 bg-white"
                }`}
    >
      <div
        className={`px-6 py-4 ${
          hasValidResult
            ? "border-b border-gray-100"
            : "border-b border-red-100"
        }`}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-800 flex items-center">
            {hasValidResult ? (
              <svg
                className="w-4 h-4 text-primary-500 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-red-500 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            )}
            {asin}
          </h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {formattedTime}
          </span>
        </div>

        <div className="mb-3">
          <span className="inline-block bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs px-3 py-1 rounded-full">
            {keyword}
          </span>
          {result?.error && (
            <span className="inline-block ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              Error
            </span>
          )}
        </div>

        <p
          className={`text-sm ${
            result?.error ? "text-red-600" : "text-gray-600"
          } mb-3 line-clamp-2`}
        >
          {summary}
        </p>
      </div>

      <div className="px-6 py-3 bg-gray-50">
        {hasValidResult ? (
          <Link
            to={`/results/${asin}/${encodeURIComponent(keyword)}`}
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors"
          >
            View full analysis
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              ></path>
            </svg>
          </Link>
        ) : (
          <div className="flex space-x-4">
            <Link
              to="/"
              className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors"
            >
              Try again
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
            </Link>
          </div>
        )}{" "}
      </div>
    </div>
  );
});

export default HistoryItem;
