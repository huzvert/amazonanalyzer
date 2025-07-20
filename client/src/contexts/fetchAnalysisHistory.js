// Helper function for fetchAnalysisHistory
export const fetchAnalysisHistory = async (
  analysisService,
  setIsLoading,
  setAnalysisHistory,
  toast
) => {
  setIsLoading(true);

  try {
    const response = await analysisService.getUserAnalyses();

    if (response.success) {
      // Process the data to ensure error objects are properly formatted
      const processedData = response.data
        .filter((item) => {
          // Filter out any invalid items
          if (!item || !item.asin || !item.keyword) {
            return false;
          }
          return true;
        })
        .map((item) => {
          try {
            // Make sure error flags are preserved and properly structured
            if (
              item.result &&
              (item.result.error === true || item.result.isErrorResult === true)
            ) {
              return {
                ...item,
                result: {
                  error: true,
                  message: item.result.message || "Analysis failed",
                  // Preserve any other properties that might exist
                  ...(item.result || {}),
                },
              };
            }

            // Check if result has all required fields
            if (item.result) {
              const requiredFields = [
                "product_summary",
                "main_product",
                "competitors",
              ];
              const missingFields = requiredFields.filter(
                (field) => !item.result[field]
              );

              if (missingFields.length > 0) {
                return {
                  ...item,
                  result: {
                    error: true,
                    message: `Missing required data: ${missingFields.join(
                      ", "
                    )}`,
                    originalResult: item.result,
                  },
                };
              }
            }

            return item;
          } catch (err) {
            return {
              ...item,
              result: {
                error: true,
                message: "Error processing analysis data",
              },
            };
          }
        });

      setAnalysisHistory(processedData);
    } else {
      toast.error("Failed to load analysis history");
    }
  } catch (error) {
    console.error("Error fetching analysis history:", error);
    toast.error("Failed to load analysis history");
  } finally {
    setIsLoading(false);
  }
};
