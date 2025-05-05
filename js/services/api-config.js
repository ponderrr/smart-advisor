import axios from "axios";

// Simple in-memory request cache
const requestCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Helper function to create a consistent cache key
function createCacheKey(input) {
  if (typeof input === "string") {
    const [endpoint, params] = Array.isArray(input) ? input : [input, {}];
    return `${endpoint}|${JSON.stringify(params || {})}`;
  } else if (input && typeof input === "object") {
    const { url, params, data } = input;
    return `${url}|${JSON.stringify(params || {})}|${JSON.stringify(
      data || {}
    )}`;
  }
  return String(input);
}

// API Configuration with retries and rate limiting
const createApiWithRetry = (baseConfig, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => error.response && error.response.status === 429,
    cacheEnabled = false,
  } = options;

  const instance = axios.create(baseConfig);

  // Request interceptor for caching
  instance.interceptors.request.use(async (config) => {
    if (cacheEnabled && (config.method === "get" || config.method === "GET")) {
      const cacheKey = createCacheKey(config);
      const cachedResponse = requestCache.get(cacheKey);

      if (cachedResponse && Date.now() < cachedResponse.expiry) {
        console.log("Using cached response for:", cacheKey);

        return {
          ...config,
          adapter: (config) => {
            return Promise.resolve({
              data: cachedResponse.data,
              status: 200,
              statusText: "OK",
              headers: cachedResponse.headers,
              config: config,
              request: {},
            });
          },
          __fromCache: true,
        };
      }
    }
    return config;
  });

  // Response interceptor for caching and retries
  instance.interceptors.response.use(
    (response) => {
      if (
        cacheEnabled &&
        (response.config.method === "get" || response.config.method === "GET")
      ) {
        const cacheKey = createCacheKey(response.config);

        if (!response.config.__fromCache) {
          requestCache.set(cacheKey, {
            data: response.data,
            headers: response.headers,
            expiry: Date.now() + CACHE_DURATION,
          });
        }
      }
      return response;
    },
    async (error) => {
      const { config } = error;

      if (!config || config.__retryCount >= maxRetries || !shouldRetry(error)) {
        return Promise.reject(error);
      }

      config.__retryCount = config.__retryCount || 0;
      config.__retryCount++;

      const delay = Math.min(
        initialDelay * Math.pow(2, config.__retryCount - 1),
        maxDelay
      );

      if (error.response && error.response.headers["retry-after"]) {
        const retryAfter = parseInt(error.response.headers["retry-after"], 10);
        if (!isNaN(retryAfter)) {
          const retryAfterMs = retryAfter * 1000;
          console.log(`Using retry-after header: ${retryAfter} seconds`);
          await sleep(retryAfterMs);
        } else {
          await sleep(delay);
        }
      } else {
        console.log(
          `Retrying request (${config.__retryCount}/${maxRetries}) after ${delay}ms delay`
        );
        await sleep(delay);
      }

      return instance(config);
    }
  );

  return instance;
};

// Helper function to sleep for a specific duration
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to handle API errors
export function handleApiError(
  error,
  serviceName,
  defaultMessage = "An error occurred"
) {
  console.error(`${serviceName} API Error:`, error);

  let errorMessage = defaultMessage;

  if (error.response) {
    if (error.response.status === 429) {
      errorMessage = `${serviceName} API rate limit exceeded. Please try again later.`;
      const retryAfter =
        error.response.headers && error.response.headers["retry-after"];
      if (retryAfter) {
        console.log(`Retry after: ${retryAfter} seconds`);
      }
    } else if (error.response.data && error.response.data.error) {
      errorMessage =
        error.response.data.error.message || error.response.data.error;
    }
  } else if (error.request) {
    errorMessage =
      "No response received from server. Please check your connection.";
  }

  return {
    error: true,
    message: errorMessage,
    originalError: error,
  };
}

// Export a function to clear the cache
export function clearApiCache() {
  requestCache.clear();
  console.log("API cache cleared");
}

// Export a function to get the size of the cache
export function getApiCacheSize() {
  return requestCache.size;
}
