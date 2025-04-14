import axios from "axios";

// OpenAI API configuration
export const openaiApi = axios.create({
  baseURL: import.meta.env.VITE_OPENAI_URL || "https://api.openai.com/v1",
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  },
});

// TMDB API configuration
export const tmdbApi = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  params: {
    api_key: import.meta.env.VITE_TMDB_API_KEY,
  },
});

// Google Books API configuration
export const googleBooksApi = axios.create({
  baseURL: "https://www.googleapis.com/books/v1",
});

/**
 * Handle API errors consistently
 * @param {Error} error - The error object
 * @param {string} serviceName - Name of the service for logging purposes
 * @param {string} defaultMessage - Default error message to return
 * @returns {object} Error info object
 */
export function handleApiError(
  error,
  serviceName,
  defaultMessage = "An error occurred"
) {
  console.error(`${serviceName} API Error:`, error);

  let errorMessage = defaultMessage;

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error("Response data:", error.response.data);
    console.error("Response status:", error.response.status);

    if (error.response.data && error.response.data.error) {
      errorMessage =
        error.response.data.error.message || error.response.data.error;
    }
  } else if (error.request) {
    // The request was made but no response was received
    errorMessage =
      "No response received from server. Please check your connection.";
  }

  return {
    error: true,
    message: errorMessage,
    originalError: error,
  };
}
