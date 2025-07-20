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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SentimentChart = ({ mainProduct, competitors }) => {
  // Defensive check for missing data
  if (!mainProduct || !mainProduct.pros || !mainProduct.cons) {
    return (
      <div className="bg-yellow-50 p-4 rounded mb-6">
        <p className="text-yellow-700">
          Competitive analysis data is incomplete or missing.
        </p>
      </div>
    );
  }

  // Filter out any competitors with incomplete data
  const validCompetitors = Array.isArray(competitors)
    ? competitors.filter(
        (comp) => comp && Array.isArray(comp.pros) && Array.isArray(comp.cons)
      )
    : [];

  // Extract main product data with safety checks
  const mainProductProsCount = Array.isArray(mainProduct.pros)
    ? mainProduct.pros.length
    : 0;
  const mainProductConsCount = Array.isArray(mainProduct.cons)
    ? mainProduct.cons.length
    : 0;

  // Calculate strength ratio (pros to total points)
  const mainProductTotal = mainProductProsCount + mainProductConsCount;
  const mainProductStrengthRatio =
    mainProductTotal === 0 ? 0 : mainProductProsCount / mainProductTotal;

  // Take up to 3 competitors for readability
  const topCompetitors = validCompetitors.slice(0, 3);

  // Prepare labels and data
  const labels = ["Your Product"].concat(
    topCompetitors.map((comp, index) => `Competitor ${index + 1}`)
  );

  // Prepare datasets
  const prosData = [mainProductProsCount].concat(
    topCompetitors.map((comp) => comp.pros.length)
  );

  const consData = [mainProductConsCount].concat(
    topCompetitors.map((comp) => comp.cons.length)
  );

  // Calculate strength scores for all products (1-10 scale)
  const strengthScores = [mainProductStrengthRatio * 10].concat(
    topCompetitors.map((comp) => {
      const total = comp.pros.length + comp.cons.length;
      return total === 0 ? 0 : (comp.pros.length / total) * 10;
    })
  );

  // Chart data
  const data = {
    labels,
    datasets: [
      {
        label: "Strengths",
        data: prosData,
        backgroundColor: "rgba(76, 175, 80, 0.7)",
        borderColor: "rgba(76, 175, 80, 1)",
        borderWidth: 1,
      },
      {
        label: "Weaknesses",
        data: consData,
        backgroundColor: "rgba(244, 67, 54, 0.7)",
        borderColor: "rgba(244, 67, 54, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of points",
        },
      },
    },
    plugins: {
      legend: {
        position: "bottom",
      },
      title: {
        display: true,
        text: "Competitive Strength Analysis",
      },
    },
  };
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Competitive Strength Analysis
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-primary-600">
              {Math.round(strengthScores[0] * 10) / 10}/10
            </div>
            <div className="text-sm text-gray-600">
              Your Product Strength Score
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Product Strengths:</span>
              <span className="text-sm font-medium text-gray-800">
                {mainProductProsCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Product Weaknesses:</span>
              <span className="text-sm font-medium text-gray-800">
                {mainProductConsCount}
              </span>
            </div>
            {topCompetitors.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Competitor Comparison
                </h4>
                {topCompetitors.map((comp, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center mb-1"
                  >
                    <span className="text-xs text-gray-600">
                      Competitor {idx + 1} Score:
                    </span>
                    <span className="text-xs font-medium text-gray-800">
                      {Math.round(strengthScores[idx + 1] * 10) / 10}/10
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-64 flex items-center justify-center">
          <Bar data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

export default SentimentChart;
