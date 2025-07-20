import { useContext } from "react";
import { AnalysisContext } from "../contexts/AnalysisContext";

/**
 * Custom hook for accessing the Analysis context
 * This provides all analysis-related functionality throughout the app
 */
export const useAnalysis = () => {
  const context = useContext(AnalysisContext);

  if (context === undefined) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }

  return context;
};
