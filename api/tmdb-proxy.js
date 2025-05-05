import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TMDB_API_KEY = process.env.TMDB_API_KEY;

const RATE_LIMIT = {
  requestsPerMinute: 20,
  windowMs: 60 * 1000,
};

const userRequests = new Map();

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check if TMDB API key is configured
    if (!TMDB_API_KEY) {
      console.error("TMDB API key is not configured");
      return res.status(500).json({ error: "API key not configured" });
    }

    // Attempt to extract user info if available, but don't require it
    let userId = "anonymous";

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser(token);

        if (!authError && user) {
          userId = user.id;
        }
      } catch (authError) {
        console.warn(
          "Auth error in TMDB proxy, continuing as anonymous:",
          authError.message
        );
      }
    }

    // Apply rate limiting
    const now = Date.now();

    if (!userRequests.has(userId)) {
      userRequests.set(userId, {
        count: 0,
        resetTime: now + RATE_LIMIT.windowMs,
      });
    }

    const userRateLimit = userRequests.get(userId);

    if (now > userRateLimit.resetTime) {
      userRateLimit.count = 0;
      userRateLimit.resetTime = now + RATE_LIMIT.windowMs;
    }

    if (userRateLimit.count >= RATE_LIMIT.requestsPerMinute) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        retryAfter: Math.ceil((userRateLimit.resetTime - now) / 1000),
      });
    }

    userRateLimit.count += 1;

    // Process the actual request
    const { endpoint, params = {} } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: "Endpoint is required" });
    }

    const url = `https://api.themoviedb.org/3/${endpoint}`;

    const queryParams = new URLSearchParams({
      ...params,
      api_key: TMDB_API_KEY,
    });

    const response = await fetch(`${url}?${queryParams.toString()}`);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: "TMDB API Error",
        status: response.status,
        details: errorText,
      });
    }

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error proxying to TMDB API:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [userKey, rateLimit] of userRequests.entries()) {
    if (now > rateLimit.resetTime) {
      userRequests.delete(userKey);
    }
  }
}, 10 * 60 * 1000); // Clean up every 10 minutes
