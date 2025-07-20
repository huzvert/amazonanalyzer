import api from "./api";

// Get all analyses for the current user
const getAnalyses = async () => {
  try {
    const response = await api.get("/analysis");
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to fetch analyses";
  }
};

// Check if an analysis already exists
const checkAnalysis = async (asin, keyword) => {
  try {
    const response = await api.get(`/analysis/check/${asin}/${keyword}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to check analysis";
  }
};

// Get analysis by ID
const getAnalysisById = async (id) => {
  try {
    const response = await api.get(`/analysis/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to fetch analysis";
  }
};

// Request a new analysis
const requestAnalysis = async (asin, keyword) => {
  try {
    const response = await api.post("/analysis", { asin, keyword });
    return response.data;
  } catch (error) {
    // Enhanced error extraction
    if (error.response && error.response.data) {
      if (error.response.data.message) {
        throw new Error(error.response.data.message);
      } else if (typeof error.response.data === "object") {
        throw new Error(JSON.stringify(error.response.data));
      }
    }
    throw new Error("Failed to create analysis");
  }
};

// Get or create analysis (checks if exists, or creates new one)
const getOrCreateAnalysis = async (asin, keyword) => {
  try {
    // First check if analysis exists
    const checkResponse = await checkAnalysis(asin, keyword);

    if (checkResponse.exists) {
      return {
        success: true,
        data: checkResponse.data,
        isNew: false,
      };
    }

    // If not exists, create a new analysis
    const data = await requestAnalysis(asin, keyword);
    return {
      success: true,
      data,
      isNew: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
    };
  }
};

// Get user analyses (history)
const getUserAnalyses = async () => {
  try {
    const data = await getAnalyses();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
    };
  }
};

const analysisService = {
  getAnalyses,
  checkAnalysis,
  getAnalysisById,
  requestAnalysis,
  getOrCreateAnalysis,
  getUserAnalyses,
};

export default analysisService;
