import React from "react";

const ProsCons = ({ pros = [], cons = [], title = "Pros & Cons" }) => {
  // Ensure pros and cons are arrays
  const safePros = Array.isArray(pros) ? pros : [];
  const safeCons = Array.isArray(cons) ? cons : [];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pros Section */}
        <div>
          <h4 className="text-base font-medium text-green-700 mb-3 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Pros
          </h4>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
            {safePros.length > 0 ? (
              safePros.map((pro, index) => (
                <li key={index} className="pl-2">
                  {pro}
                </li>
              ))
            ) : (
              <li className="pl-2 text-gray-500 italic">No pros identified</li>
            )}
          </ul>
        </div>

        {/* Cons Section */}
        <div>
          <h4 className="text-base font-medium text-red-700 mb-3 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            Cons
          </h4>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
            {safeCons.length > 0 ? (
              safeCons.map((con, index) => (
                <li key={index} className="pl-2">
                  {con}
                </li>
              ))
            ) : (
              <li className="pl-2 text-gray-500 italic">No cons identified</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProsCons;
