import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { generateAndDownloadPDF } from "../../utils/pdfGenerator";

const ShareAnalysis = ({ analysisData, asin }) => {
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // Generate shareable URL for current analysis
  const getShareableUrl = () => {
    const baseUrl = window.location.origin;
    const path = `/results/${asin}/${encodeURIComponent(
      analysisData.keyword || ""
    )}`;
    return `${baseUrl}${path}`;
  };
  // Copy shareable link to clipboard
  const copyToClipboard = () => {
    const url = getShareableUrl();
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
    setIsShareMenuOpen(false);
  };

  // Export as PDF
  const exportAsPdf = async () => {
    setIsPdfLoading(true);
    try {
      const keyword = analysisData.keyword || "";
      const result = await generateAndDownloadPDF(analysisData, asin, keyword);
      if (result) {
        toast.success("PDF downloaded successfully!");
      } else {
        throw new Error("Failed to generate PDF");
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Could not generate PDF. Please try again.");
    } finally {
      setIsPdfLoading(false);
      setIsShareMenuOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
        className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        Share
      </button>{" "}
      {isShareMenuOpen && (
        <div className="absolute right-0 z-10 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
          <button
            onClick={copyToClipboard}
            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
            Copy Link
          </button>
          <button
            onClick={exportAsPdf}
            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            disabled={isPdfLoading}
          >
            {isPdfLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 mr-3 text-red-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-3 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                Export as PDF
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareAnalysis;
