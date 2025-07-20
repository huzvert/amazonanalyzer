import React from "react";

const ProductCard = ({ productData }) => {
  const { asin, description } = productData;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-gray-800">
            Product Details
          </h3>
          <div className="mt-2">
            <div className="text-sm text-gray-600">
              <span className="font-medium">ASIN:</span> {asin}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Description:</span>
              <p className="mt-1">{description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
