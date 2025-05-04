import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const RATE_LIMIT = {
  requestsPerMinute: 10,
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

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("subscription")
      .eq("id", user.id)
      .single();

    const now = Date.now();
    const userKey = user.id;

    let userRateLimit = RATE_LIMIT.requestsPerMinute;

    if (userData && !userError) {
      if (
        userData.subscription &&
        userData.subscription.tier === "premium-monthly"
      ) {
        userRateLimit = RATE_LIMIT.requestsPerMinute * 2; // Double the rate limit for premium users
      } else if (
        userData.subscription &&
        userData.subscription.tier === "premium-annual"
      ) {
        userRateLimit = RATE_LIMIT.requestsPerMinute * 3; // Triple the rate limit for annual subscribers
      }
    }

    if (!userRequests.has(userKey)) {
      userRequests.set(userKey, {
        count: 0,
        resetTime: now + RATE_LIMIT.windowMs,
      });
    }

    const userRateLimitObj = userRequests.get(userKey);

    if (now > userRateLimitObj.resetTime) {
      userRateLimitObj.count = 0;
      userRateLimitObj.resetTime = now + RATE_LIMIT.windowMs;
    }

    if (userRateLimitObj.count >= userRateLimit) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        retryAfter: Math.ceil((userRateLimitObj.resetTime - now) / 1000),
      });
    }

    userRateLimitObj.count += 1;

    const { model, messages, temperature, max_tokens } = req.body;

    if (!model || !messages) {
      return res.status(400).json({ error: "Model and messages are required" });
    }

    const openaiRequest = {
      model,
      messages,
      temperature: temperature !== undefined ? temperature : 0.7,
      max_tokens: max_tokens !== undefined ? max_tokens : 500,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(openaiRequest),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: "OpenAI API Error",
        status: response.status,
        details: errorData,
      });
    }

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error proxying to OpenAI API:", error);
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
