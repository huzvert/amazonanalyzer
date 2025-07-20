import React, { useState, useEffect } from "react";
import { useAnalysis } from "../contexts/AnalysisContext";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";
import PageTransition from "../components/common/PageTransition";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Analytics = () => {
  const { analysisHistory, isLoading, fetchAnalysisHistory } = useAnalysis();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("all");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    fetchAnalysisHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter analysis history based on selected time range
  const getFilteredHistory = () => {
    if (timeRange === "all" || !analysisHistory) return analysisHistory;

    const now = new Date();
    let cutoffDate = new Date();

    switch (timeRange) {
      case "week":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      default:
        return analysisHistory;
    }

    return analysisHistory.filter((item) => {
      return new Date(item.timestamp) >= cutoffDate;
    });
  };

  const filteredHistory = getFilteredHistory() || [];

  // Data for category distribution
  const categoryData = React.useMemo(() => {
    const categories = {};

    filteredHistory.forEach((item) => {
      if (item.keyword) {
        const mainCategory = item.keyword.split(" ")[0];
        categories[mainCategory] = (categories[mainCategory] || 0) + 1;
      }
    });

    return {
      labels: Object.keys(categories),
      datasets: [
        {
          label: "Categories Analyzed",
          data: Object.values(categories),
          backgroundColor: [
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 99, 132, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
          ],
          borderColor: [
            "rgba(54, 162, 235, 1)",
            "rgba(255, 99, 132, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [filteredHistory]);

  // Data for success vs. failure
  const successRateData = React.useMemo(() => {
    let success = 0;
    let failed = 0;

    filteredHistory.forEach((item) => {
      if (item.result && item.result.error === true) {
        failed++;
      } else {
        success++;
      }
    });

    return {
      labels: ["Successful", "Failed"],
      datasets: [
        {
          data: [success, failed],
          backgroundColor: [
            "rgba(75, 192, 192, 0.6)",
            "rgba(255, 99, 132, 0.6)",
          ],
          borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
          borderWidth: 1,
        },
      ],
    };
  }, [filteredHistory]);

  // Data for analysis trend over time
  const trendData = React.useMemo(() => {
    // Create a map with dates and count analyses per day
    const dateMap = {};

    filteredHistory.forEach((item) => {
      if (item.timestamp) {
        const date = new Date(item.timestamp).toLocaleDateString();
        dateMap[date] = (dateMap[date] || 0) + 1;
      }
    });

    // Sort dates chronologically
    const sortedDates = Object.keys(dateMap).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    return {
      labels: sortedDates,
      datasets: [
        {
          label: "Analyses Performed",
          data: sortedDates.map((date) => dateMap[date]),
          borderColor: "rgba(54, 162, 235, 1)",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [filteredHistory]);

  const handleTimeRangeChange = (range) => {
    setIsAnimating(true);
    setTimeRange(range);
    setTimeout(() => setIsAnimating(false), 500);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        bodyFont: {
          size: 14,
        },
        titleFont: {
          size: 16,
          weight: "bold",
        },
      },
    },
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-900 rounded-lg shadow-lg p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-primary-100 mt-2">
            Gain insights from your product analysis history
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <h2 className="text-lg font-medium text-gray-700 mb-3">
            Filter by Time Range
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button
              label="All Time"
              variant={timeRange === "all" ? "primary" : "outline"}
              onClick={() => handleTimeRangeChange("all")}
              size="sm"
            />
            <Button
              label="Past Week"
              variant={timeRange === "week" ? "primary" : "outline"}
              onClick={() => handleTimeRangeChange("week")}
              size="sm"
            />
            <Button
              label="Past Month"
              variant={timeRange === "month" ? "primary" : "outline"}
              onClick={() => handleTimeRangeChange("month")}
              size="sm"
            />
            <Button
              label="Past Quarter"
              variant={timeRange === "quarter" ? "primary" : "outline"}
              onClick={() => handleTimeRangeChange("quarter")}
              size="sm"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <ul className="flex flex-wrap border-b border-gray-200">
            <li className="mr-2">
              <button
                className={`inline-block p-4 rounded-t-lg ${
                  activeTab === "overview"
                    ? "text-primary-600 bg-gray-100 border-b-2 border-primary-600"
                    : "text-gray-500 hover:text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-block p-4 rounded-t-lg ${
                  activeTab === "categories"
                    ? "text-primary-600 bg-gray-100 border-b-2 border-primary-600"
                    : "text-gray-500 hover:text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("categories")}
              >
                Categories
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-block p-4 rounded-t-lg ${
                  activeTab === "trend"
                    ? "text-primary-600 bg-gray-100 border-b-2 border-primary-600"
                    : "text-gray-500 hover:text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("trend")}
              >
                Trend Analysis
              </button>
            </li>
          </ul>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Success Rate */}
          <div
            className={`bg-white rounded-lg shadow-md p-6 transition-opacity duration-500 ${
              isAnimating ? "opacity-50" : "opacity-100"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Success Rate
            </h2>
            <div className="h-64">
              <Pie data={successRateData} options={chartOptions} />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                {successRateData.datasets[0].data[0]} successful analyses out of{" "}
                {filteredHistory.length} total
              </p>
            </div>
          </div>

          {/* Category Distribution */}
          {(activeTab === "overview" || activeTab === "categories") && (
            <div
              className={`bg-white rounded-lg shadow-md p-6 transition-opacity duration-500 ${
                isAnimating ? "opacity-50" : "opacity-100"
              }`}
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Category Distribution
              </h2>
              <div className="h-64">
                <Bar data={categoryData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Time Trend */}
          {(activeTab === "overview" || activeTab === "trend") && (
            <div
              className={`bg-white rounded-lg shadow-md p-6 md:col-span-2 transition-opacity duration-500 ${
                isAnimating ? "opacity-50" : "opacity-100"
              }`}
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Analysis Trend
              </h2>
              <div className="h-64">
                <Line
                  data={trendData}
                  options={{
                    ...chartOptions,
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Analytics Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
              <h3 className="text-lg font-medium text-primary-700 mb-2">
                Total Analyses
              </h3>
              <p className="text-3xl font-bold text-primary-800">
                {filteredHistory.length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-lg font-medium text-green-700 mb-2">
                Success Rate
              </h3>
              <p className="text-3xl font-bold text-green-800">
                {filteredHistory.length
                  ? `${Math.round(
                      (successRateData.datasets[0].data[0] /
                        filteredHistory.length) *
                        100
                    )}%`
                  : "0%"}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h3 className="text-lg font-medium text-purple-700 mb-2">
                Most Analyzed
              </h3>
              <p className="text-3xl font-bold text-purple-800">
                {categoryData.labels.length
                  ? categoryData.labels[
                      categoryData.datasets[0].data.indexOf(
                        Math.max(...categoryData.datasets[0].data)
                      )
                    ]
                  : "None"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Analytics;
