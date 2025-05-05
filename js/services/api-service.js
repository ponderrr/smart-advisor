import { supabase } from "./supabase-config.js";

const requestCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000;

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

/**
 * Get the user's auth token from Supabase
 * @returns {Promise<string|null>} The user's auth token or null if not authenticated
 */
async function getAuthToken() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      console.warn("No active session found");
      return null;
    }
    return session.access_token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

/**
 * Make a request to the TMDB API proxy
 * @param {string} endpoint - The TMDB API endpoint
 * @param {Object} params - Query parameters
 * @param {boolean} useCache - Whether to use/store cache for this request
 * @returns {Promise<Object>} The API response
 */
export async function tmdbApiRequest(endpoint, params = {}, useCache = true) {
  try {
    if (useCache) {
      const cacheKey = createCacheKey({ endpoint, params });
      const cachedResponse = requestCache.get(cacheKey);

      if (cachedResponse && Date.now() < cachedResponse.expiry) {
        console.log("Using cached TMDB response for:", cacheKey);
        return cachedResponse.data;
      }
    }

    // Get auth token if possible, but don't require it
    let headers = { "Content-Type": "application/json" };
    const token = await getAuthToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch("/api/tmdb-proxy", {
      method: "POST",
      headers,
      body: JSON.stringify({
        endpoint,
        params,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "TMDB API request failed");
    }

    const data = await response.json();

    if (useCache) {
      const cacheKey = createCacheKey({ endpoint, params });
      requestCache.set(cacheKey, {
        data,
        expiry: Date.now() + CACHE_DURATION,
      });
    }

    return data;
  } catch (error) {
    console.error("TMDB API request error:", error);
    throw error;
  }
}

/**
 * Make a request to the OpenAI API proxy
 * @param {string} model - The OpenAI model to use
 * @param {Array} messages - The messages to send
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} The API response
 */
export async function openaiApiRequest(model, messages, options = {}) {
  try {
    // Get auth token if possible, but don't require it
    let headers = { "Content-Type": "application/json" };
    const token = await getAuthToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch("/api/openai-proxy", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        ...options,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "OpenAI API request failed");
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("OpenAI API request error:", error);
    throw error;
  }
}

export function clearApiCache() {
  requestCache.clear();
  console.log("API cache cleared");
}

/**
 * Function to get the size of the API cache
 * @returns {number} The number of items in the cache
 */
export function getApiCacheSize() {
  return requestCache.size;
}
