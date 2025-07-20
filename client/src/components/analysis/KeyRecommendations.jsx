import React from "react";

const KeyRecommendations = ({ recommendations = [] }) => {
  // Ensure recommendations is an array
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];
  
  // Check if we have any recommendations to display
  if (safeRecommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Key Recommendations for Improvement
        </h2>
        <div className="bg-yellow-50 p-4 rounded">
          <p className="text-yellow-700 text-center">
            No specific recommendations available for this product.
          </p>
        </div>
      </div>
    );
  }

  // Define icons for different types of recommendations
  const getRecommendationIcon = (index) => {
    const icons = [
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-primary-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        key="icon-1"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>,
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-primary-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        key="icon-2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>,
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-primary-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        key="icon-3"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
        />
      </svg>,
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-primary-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        key="icon-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
        />
      </svg>,
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-primary-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        key="icon-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>,
    ];

    return icons[index % icons.length];
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Key Recommendations for Improvement
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {safeRecommendations.map((recommendation, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex items-start"
          >
            <div className="mr-4 mt-1">{getRecommendationIcon(index)}</div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">
                Recommendation {index + 1}
              </h3>
              <p className="text-gray-600">{recommendation}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-gray-500 italic text-center">
        Recommendations are based on competitive analysis and customer reviews
      </div>
    </div>
  );
};

export default KeyRecommendations;
