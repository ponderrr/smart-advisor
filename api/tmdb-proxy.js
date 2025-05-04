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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const now = Date.now();
    const userKey = user.id;

    if (!userRequests.has(userKey)) {
      userRequests.set(userKey, {
        count: 0,
        resetTime: now + RATE_LIMIT.windowMs,
      });
    }

    const userRateLimit = userRequests.get(userKey);

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

setInterval(() => {
  const now = Date.now();
  for (const [userKey, rateLimit] of userRequests.entries()) {
    if (now > rateLimit.resetTime) {
      userRequests.delete(userKey);
    }
  }
}, 10 * 60 * 1000);
