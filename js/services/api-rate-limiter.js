/**
 * API Rate Limiter for OpenAI API calls
 */
const userRateLimits = {};
const RATE_LIMIT_CONFIG = {
  // Limits for free tier users
  free: {
    maxRequests: 10, // Maximum 10 requests
    timeWindow: 60 * 60 * 1000, // Per hour (in milliseconds)
    costPerRequest: 1, // Cost per request
  },
  // Limits for premium tier users
  premium: {
    maxRequests: 50, // Maximum 50 requests
    timeWindow: 60 * 60 * 1000, // Per hour (in milliseconds)
    costPerRequest: 1, // Cost per request
  },
  // Limits for annual tier users
  annual: {
    maxRequests: 100, // Maximum 100 requests
    timeWindow: 60 * 60 * 1000, // Per hour (in milliseconds)
    costPerRequest: 1, // Cost per request
  },
};

// Global daily cap for the entire application
const GLOBAL_DAILY_CAP = {
  maxRequests: 1000, // Maximum 1000 requests per day
  counter: 0,
  resetTime: null,
};

// Initialize or reset the global cap counter
function initGlobalCap() {
  // Get the current date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If we haven't set a reset time or it's a new day, reset the counter
  if (!GLOBAL_DAILY_CAP.resetTime || GLOBAL_DAILY_CAP.resetTime < today) {
    GLOBAL_DAILY_CAP.counter = 0;
    GLOBAL_DAILY_CAP.resetTime = today;
  }
}

/**
 * Check if a request should be rate limited
 * @param {string} userId - User ID or 'anonymous' for non-logged in users
 * @param {string} tier - User subscription tier ('free', 'premium', 'annual')
 * @returns {Object} - Result with isAllowed flag and remaining requests
 */
export function checkRateLimit(userId, tier = "free") {
  // Initialize global cap if needed
  initGlobalCap();

  // Check global cap first
  if (GLOBAL_DAILY_CAP.counter >= GLOBAL_DAILY_CAP.maxRequests) {
    return {
      isAllowed: false,
      message:
        "Daily API limit reached for the application. Please try again tomorrow.",
      remainingRequests: 0,
      resetTime: GLOBAL_DAILY_CAP.resetTime,
    };
  }

    // Make sure user is logged in
    if (!userId || userId === 'anonymous') {
      return {
        isAllowed: false,
        message: "You must be logged in to use this feature.",
        remainingRequests: 0,
        resetTime: null
      };
    }
    
    // Get the appropriate rate limit config
    const config = RATE_LIMIT_CONFIG[tier] || RATE_LIMIT_CONFIG.free;

  // Create a unique key for the user
  const userKey = `${userId}:${tier}`;

  // Initialize user rate limit entry if it doesn't exist
  if (!userRateLimits[userKey]) {
    userRateLimits[userKey] = {
      requests: 0,
      resetTime: Date.now() + config.timeWindow,
    };
  }

  // Check if the time window has passed and reset if needed
  if (Date.now() > userRateLimits[userKey].resetTime) {
    userRateLimits[userKey] = {
      requests: 0,
      resetTime: Date.now() + config.timeWindow,
    };
  }

  // Check if the user has exceeded their rate limit
  const remainingRequests =
    config.maxRequests - userRateLimits[userKey].requests;

  if (remainingRequests <= 0) {
    return {
      isAllowed: false,
      message: `Rate limit exceeded. Please try again later.`,
      remainingRequests: 0,
      resetTime: userRateLimits[userKey].resetTime,
    };
  }

  // Allow the request and increment the counters
  userRateLimits[userKey].requests += config.costPerRequest;
  GLOBAL_DAILY_CAP.counter += 1;

  return {
    isAllowed: true,
    message: "Request allowed",
    remainingRequests: remainingRequests - config.costPerRequest,
    resetTime: userRateLimits[userKey].resetTime,
  };
}

/**
 * Apply rate limiter to OpenAI API requests
 * @param {Function} apiCallFunction - The original API call function
 * @param {Object} options - Options including userId and tier
 * @returns {Function} - Wrapped function with rate limiting
 */
export function withRateLimit(apiCallFunction, options = {}) {
  return async function (...args) {
    const { userId = "anonymous", tier = "free" } = options;

    // Check rate limit
    const rateLimit = checkRateLimit(userId, tier);

    if (!rateLimit.isAllowed) {
      throw new Error(rateLimit.message);
    }

    // If rate limit check passes, make the API call
    return apiCallFunction(...args);
  };
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const userKey in userRateLimits) {
    if (now > userRateLimits[userKey].resetTime) {
      delete userRateLimits[userKey];
    }
  }
}, 60 * 60 * 1000); // Clean up every hour
