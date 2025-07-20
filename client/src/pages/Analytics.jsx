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
  const filteredHistory = React.useMemo(() => {
    return getFilteredHistory() || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, analysisHistory]);
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
      {" "}
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-900 dark:from-dark-card dark:to-gray-900 rounded-lg shadow-lg p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-primary-100 mt-2">
            Gain actionable insights from your product analysis history
          </p>
          <div className="mt-4 text-sm bg-white/10 p-3 rounded-lg">
            <p>
              This dashboard provides visual reports on your product analysis
              activities, helping you understand patterns and improve your
              product research strategy.
            </p>
          </div>
        </div>
        {/* Time Range Filter */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-4 mb-8 dark:border dark:border-dark-border">
          <h2 className="text-lg font-medium text-gray-700 dark:text-dark-text mb-3">
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
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            <p>
              Select a time range to focus your analysis on specific periods and
              identify temporal trends in your product research.
            </p>
          </div>
        </div>{" "}
        {/* Tab Navigation */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-4 mb-8 dark:border dark:border-dark-border">
          <ul className="flex flex-wrap border-b border-gray-200 dark:border-dark-border">
            <li className="mr-2">
              <button
                className={`inline-block p-4 rounded-t-lg ${
                  activeTab === "overview"
                    ? "text-primary-600 dark:text-dark-accent bg-gray-100 dark:bg-dark-hover border-b-2 border-primary-600 dark:border-dark-accent"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                    ? "text-primary-600 dark:text-dark-accent bg-gray-100 dark:bg-dark-hover border-b-2 border-primary-600 dark:border-dark-accent"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                    ? "text-primary-600 dark:text-dark-accent bg-gray-100 dark:bg-dark-hover border-b-2 border-primary-600 dark:border-dark-accent"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
                onClick={() => setActiveTab("trend")}
              >
                Trend Analysis
              </button>
            </li>
          </ul>
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/30 rounded text-sm text-gray-600 dark:text-gray-400">
            <strong>Navigation Guide:</strong>
            <ul className="mt-1 list-disc list-inside">
              <li>
                <span className="font-medium text-primary-600 dark:text-dark-accent">
                  Overview
                </span>
                : Complete snapshot of your analysis activities
              </li>
              <li>
                <span className="font-medium text-primary-600 dark:text-dark-accent">
                  Categories
                </span>
                : Detailed breakdown of product categories you've analyzed
              </li>
              <li>
                <span className="font-medium text-primary-600 dark:text-dark-accent">
                  Trend Analysis
                </span>
                : Temporal patterns in your analysis behavior
              </li>
            </ul>
          </div>
        </div>{" "}
        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Success Rate */}
          <div
            className={`bg-white dark:bg-dark-card rounded-lg shadow-md p-6 transition-opacity duration-500 dark:border dark:border-dark-border ${
              isAnimating ? "opacity-50" : "opacity-100"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-dark-text">
              Success Rate Analysis
            </h2>
            <div className="h-64">
              <Pie data={successRateData} options={chartOptions} />
            </div>
            <div className="mt-6 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What This Shows:</h3>
              <p className="mb-2">
                This chart displays the proportion of successful vs. failed
                analyses, helping you identify if there are recurring problems
                with your product research methodology.
              </p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-teal-400 rounded-full mr-2"></span>
                  <span>
                    Successful: {successRateData.datasets[0].data[0]} (
                    {filteredHistory.length
                      ? `${Math.round(
                          (successRateData.datasets[0].data[0] /
                            filteredHistory.length) *
                            100
                        )}%`
                      : "0%"}
                    )
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-red-400 rounded-full mr-2"></span>
                  <span>
                    Failed: {successRateData.datasets[0].data[1]} (
                    {filteredHistory.length
                      ? `${Math.round(
                          (successRateData.datasets[0].data[1] /
                            filteredHistory.length) *
                            100
                        )}%`
                      : "0%"}
                    )
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Category Distribution */}
          {(activeTab === "overview" || activeTab === "categories") && (
            <div
              className={`bg-white dark:bg-dark-card rounded-lg shadow-md p-6 transition-opacity duration-500 dark:border dark:border-dark-border ${
                isAnimating ? "opacity-50" : "opacity-100"
              }`}
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-dark-text">
                Category Distribution
              </h2>
              <div className="h-64">
                <Bar data={categoryData} options={chartOptions} />
              </div>
              <div className="mt-6 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">
                  Insights from Categories:
                </h3>
                <p className="mb-2">
                  This distribution reveals which product categories you focus
                  on most frequently.
                  {categoryData.labels.length > 0
                    ? ` Your most researched category is "${
                        categoryData.labels[
                          categoryData.datasets[0].data.indexOf(
                            Math.max(...categoryData.datasets[0].data)
                          )
                        ]
                      }" with ${Math.max(
                        ...categoryData.datasets[0].data
                      )} analyses.`
                    : " You have not analyzed any products yet."}
                </p>
                <p>
                  Use this data to identify opportunities for diversifying your
                  research or deepening expertise in specific niches.
                </p>
              </div>
            </div>
          )}{" "}
          {/* Time Trend */}
          {(activeTab === "overview" || activeTab === "trend") && (
            <div
              className={`bg-white dark:bg-dark-card rounded-lg shadow-md p-6 md:col-span-2 transition-opacity duration-500 dark:border dark:border-dark-border ${
                isAnimating ? "opacity-50" : "opacity-100"
              }`}
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-dark-text">
                Analysis Activity Timeline
              </h2>
              <div className="h-64">
                <Line
                  data={trendData}
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Number of Analyses",
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: "Date",
                        },
                      },
                    },
                  }}
                />
              </div>
              <div className="mt-6 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">
                  Understanding Your Research Patterns:
                </h3>
                <p className="mb-3">
                  This timeline visualizes your analysis frequency over time,
                  revealing patterns in your research activity.
                </p>

                {trendData.labels.length > 2 && (
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Busiest Day:</span>{" "}
                      {
                        trendData.labels[
                          trendData.datasets[0].data.indexOf(
                            Math.max(...trendData.datasets[0].data)
                          )
                        ]
                      }{" "}
                      with {Math.max(...trendData.datasets[0].data)} analyses
                    </div>

                    <div>
                      <span className="font-medium">
                        Average Daily Activity:
                      </span>{" "}
                      {(
                        trendData.datasets[0].data.reduce((a, b) => a + b, 0) /
                        trendData.labels.length
                      ).toFixed(1)}{" "}
                      analyses per day
                    </div>

                    <div>
                      <span className="font-medium">Activity Insights:</span>{" "}
                      {trendData.datasets[0].data.reduce((a, b) => a + b, 0) >
                      trendData.labels.length * 2
                        ? "You have consistent research activity, which is excellent for strategic product planning."
                        : "Consider establishing a more regular analysis schedule to improve product research consistency."}
                    </div>
                  </div>
                )}

                {trendData.labels.length <= 2 && (
                  <p>
                    More data points are needed to generate meaningful trend
                    insights. Continue performing analyses to populate this
                    chart.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>{" "}
        {/* Summary */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6 mt-8 dark:border dark:border-dark-border">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-dark-text">
            Analytics Summary Dashboard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary-50 dark:bg-primary-900/20 p-5 rounded-lg border border-primary-100 dark:border-primary-800">
              <h3 className="text-lg font-medium text-primary-700 dark:text-primary-300 mb-2">
                Total Analyses
              </h3>
              <p className="text-3xl font-bold text-primary-800 dark:text-primary-200 mb-2">
                {filteredHistory.length}
              </p>
              <p className="text-sm text-primary-600 dark:text-primary-400">
                {timeRange === "all"
                  ? "All-time analysis count"
                  : `Analyses in the past ${
                      timeRange === "week"
                        ? "7 days"
                        : timeRange === "month"
                        ? "30 days"
                        : "90 days"
                    }`}
              </p>
              <div className="mt-3 pt-3 border-t border-primary-100 dark:border-primary-800">
                <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                  {filteredHistory.length > 10
                    ? "You have a solid database of product analyses"
                    : "Consider increasing your analysis frequency"}
                </span>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-lg border border-green-100 dark:border-green-800">
              <h3 className="text-lg font-medium text-green-700 dark:text-green-300 mb-2">
                Success Rate
              </h3>
              <p className="text-3xl font-bold text-green-800 dark:text-green-200 mb-2">
                {filteredHistory.length
                  ? `${Math.round(
                      (successRateData.datasets[0].data[0] /
                        filteredHistory.length) *
                        100
                    )}%`
                  : "0%"}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {successRateData.datasets[0].data[0]} successful out of{" "}
                {filteredHistory.length} total
              </p>
              <div className="mt-3 pt-3 border-t border-green-100 dark:border-green-800">
                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                  {filteredHistory.length > 0 &&
                  successRateData.datasets[0].data[0] /
                    filteredHistory.length >=
                    0.9
                    ? "Excellent success rate - your methodology is working well"
                    : filteredHistory.length > 0 &&
                      successRateData.datasets[0].data[0] /
                        filteredHistory.length >=
                        0.7
                    ? "Good success rate - minor improvements possible"
                    : "Consider reviewing your analysis approach to improve success rate"}
                </span>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-lg border border-purple-100 dark:border-purple-800">
              <h3 className="text-lg font-medium text-purple-700 dark:text-purple-300 mb-2">
                Most Analyzed Category
              </h3>
              <p className="text-3xl font-bold text-purple-800 dark:text-purple-200 mb-2">
                {categoryData.labels.length
                  ? categoryData.labels[
                      categoryData.datasets[0].data.indexOf(
                        Math.max(...categoryData.datasets[0].data)
                      )
                    ]
                  : "None"}
              </p>
              {categoryData.labels.length > 0 && (
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  {Math.max(...categoryData.datasets[0].data)} analyses (
                  {Math.round(
                    (Math.max(...categoryData.datasets[0].data) /
                      filteredHistory.length) *
                      100
                  )}
                  % of total)
                </p>
              )}
              <div className="mt-3 pt-3 border-t border-purple-100 dark:border-purple-800">
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  {categoryData.labels.length &&
                  Math.max(...categoryData.datasets[0].data) > 5
                    ? "You're building expertise in this category"
                    : categoryData.labels.length
                    ? "Consider deeper research in this category"
                    : "Start analyzing products to see insights"}
                </span>
              </div>
            </div>
          </div>

          {/* Additional insights */}
          <div className="mt-6 bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
              Strategic Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start space-x-2">
                <div className="text-blue-500 dark:text-blue-400 mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {filteredHistory.length === 0
                      ? "Start analyzing products to build your research database."
                      : categoryData.labels.length <= 2
                      ? "Diversify your analyses across more product categories to gain broader market insights."
                      : "Your research covers multiple categories, which provides good cross-market perspective."}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <div className="text-blue-500 dark:text-blue-400 mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {trendData.labels.length <= 1
                      ? "Establish a regular analysis schedule to track trends over time."
                      : trendData.datasets[0].data.filter((count) => count >= 2)
                          .length >
                        trendData.labels.length / 2
                      ? "Your consistent analysis frequency is ideal for strategic product research."
                      : "Consider scheduling regular analysis sessions to improve data consistency."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Analytics;
