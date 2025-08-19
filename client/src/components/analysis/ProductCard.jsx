import React from "react";

const ProductCard = ({ productData }) => {
  const { asin, description } = productData;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow p-6 mb-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-bold text-gray-900 mb-2 tracking-tight">Product Details</h3>
        <div className="flex flex-col gap-1 text-sm text-gray-700">
          <div>
            <span className="font-semibold text-gray-800">ASIN:</span> <span className="text-gray-600">{asin}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-800">Description:</span>
            <p className="mt-1 text-gray-600 leading-snug">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
