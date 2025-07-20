import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CompetitorComparison = ({ mainProduct, competitors }) => {
  // Defensive check for missing data
  if (!mainProduct || !Array.isArray(competitors) || competitors.length === 0) {
    return (
      <div className="bg-yellow-50 p-4 rounded mb-6">
        <p className="text-yellow-700">
          Competitor comparison data is incomplete or missing.
        </p>
      </div>
    );
  }

  // Ensure all required properties exist
  const safeMainProduct = {
    pros: Array.isArray(mainProduct.pros) ? mainProduct.pros : [],
    cons: Array.isArray(mainProduct.cons) ? mainProduct.cons : [],
    ...mainProduct,
  };

  const safeCompetitors = competitors.map((comp) => ({
    identifier: comp.identifier || "Unknown Competitor",
    pros: Array.isArray(comp.pros) ? comp.pros : [],
    cons: Array.isArray(comp.cons) ? comp.cons : [],
    ...comp,
  }));

  // Calculate metrics for comparison
  const competitorNames = safeCompetitors.map(
    (comp) => comp.identifier.substring(0, 15) + "..."
  );

  // Calculate positivity ratio for each product
  const calculatePositivityRatio = (product) => {
    const prosCount = product.pros.length;
    const consCount = product.cons.length;
    const total = prosCount + consCount;
    // Default to 50% if no data
    return total === 0 ? 50 : Math.round((prosCount / total) * 100);
  };

  const mainProductRatio = calculatePositivityRatio(safeMainProduct);
  const competitorRatios = safeCompetitors.map((comp) =>
    calculatePositivityRatio(comp)
  );

  // Set up chart data
  const data = {
    labels: ["Your Product", ...competitorNames],
    datasets: [
      {
        label: "Positivity Rating (%)",
        data: [mainProductRatio, ...competitorRatios],
        backgroundColor: [
          "rgba(54, 162, 235, 0.6)", // Blue for main product
          ...Array(safeCompetitors.length).fill("rgba(255, 99, 132, 0.6)"), // Red for competitors
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          ...Array(safeCompetitors.length).fill("rgba(255, 99, 132, 1)"),
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Product Comparison by Positivity Rating",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = context.raw || 0;
            return `${label}: ${value}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "Positivity Rating (%)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Products",
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Competitor Comparison
      </h3>
      <div className="h-80">
        <Bar options={options} data={data} />
      </div>

      <div className="mt-6">
        <h4 className="font-medium text-gray-700 mb-2">Key Insights:</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          {mainProductRatio > Math.max(...competitorRatios) ? (
            <li>
              Your product has the highest positivity rating among competitors
            </li>
          ) : (
            <li>Your product's positivity rating is below some competitors</li>
          )}
          {competitorRatios.some((ratio) => ratio > mainProductRatio) && (
            <li>
              Consider analyzing what makes{" "}
              {safeCompetitors[
                competitorRatios.indexOf(Math.max(...competitorRatios))
              ].identifier.substring(0, 15)}
              ... more positively received
            </li>
          )}

          {mainProductRatio < 50 && (
            <li>
              Your product has more cons than pros, consider addressing key
              issues
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CompetitorComparison;
