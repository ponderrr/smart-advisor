import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("OpenAI Recommendations function called");

    // Check if request method is POST
    if (req.method !== "POST") {
      throw new Error("Method not allowed. Use POST.");
    }

    // Get and validate authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("Missing authorization header");
      throw new Error("Missing authorization header");
    }

    console.log("Auth header present");

    // Create Supabase client and verify user
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.log("Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError) {
      console.log("Auth error:", authError);
      throw new Error("Authentication failed");
    }

    if (!user) {
      console.log("No user found");
      throw new Error("User not found");
    }

    console.log("User authenticated successfully:", user.id);

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.log("Invalid JSON in request body");
      throw new Error("Invalid JSON in request body");
    }

    const { answers, contentType, userAge } = requestBody;

    // Validate input parameters
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      console.log("Invalid answers:", answers);
      throw new Error("Answers are required and must be a non-empty array");
    }

    // Validate each answer has a non-empty answer_text string
    if (
      !answers.every(
        (answer) =>
          typeof answer.answer_text === "string" &&
          answer.answer_text.trim().length > 0
      )
    ) {
      console.log("Invalid answer format:", answers);
      throw new Error(
        "Each answer must contain a non-empty 'answer_text' string"
      );
    }

    if (!contentType || !["movie", "book", "both"].includes(contentType)) {
      console.log("Invalid content type:", contentType);
      throw new Error(
        "Invalid content type. Must be 'movie', 'book', or 'both'"
      );
    }

    const ageNum = Number(userAge);
    if (!userAge || isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      console.log("Invalid age:", userAge);
      throw new Error("Invalid age. Must be between 13 and 120");
    }

    console.log("Input validation passed:", {
      answerCount: answers.length,
      contentType,
      userAge: ageNum,
    });

    // Check OpenAI API key
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.log("Missing OpenAI API key");
      throw new Error("OpenAI API key not configured");
    }

    console.log("OpenAI API key found");

    // Format answers for the prompt
    const answersText = answers
      .map(
        (a: Record<string, unknown>, i: number) => `Q${i + 1}: ${a.answer_text}`
      )
      .join("\n");

    // Create prompt for recommendation generation
    const prompt = `Based on these user answers, generate ${contentType} recommendations for a ${ageNum}-year-old:

${answersText}

Requirements:
- Generate ${
      contentType === "both" ? "both 1 movie AND 1 book" : `1 ${contentType}`
    }
- Consider user's age (${ageNum}) for appropriate content
- Base recommendations on their stated preferences
- Provide detailed explanations for why each recommendation fits
- Return as JSON with this exact format:

${
  contentType === "movie" || contentType === "both"
    ? `{
  "movieRecommendation": {
    "title": "Movie Title",
    "director": "Director Name", 
    "year": 2023,
    "genres": ["Genre1", "Genre2"],
    "explanation": "Why this movie fits their preferences"
  }${contentType === "both" ? "," : ""}`
    : ""
}
${
  contentType === "book" || contentType === "both"
    ? `${contentType === "both" ? "  " : ""}"bookRecommendation": {
    "title": "Book Title",
    "author": "Author Name",
    "year": 2023, 
    "genres": ["Genre1", "Genre2"],
    "explanation": "Why this book fits their preferences"
  }`
    : ""
}
}

Generate personalized recommendations now:`;

    console.log("Calling OpenAI API for recommendations...");

    // Call OpenAI API with better error handling
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Use the more cost-effective model
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are a personalized recommendation engine. Always respond with valid JSON in the exact format requested.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 1500,
          temperature: 0.8,
        }),
      }
    );

    console.log("OpenAI API response status:", openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.log("OpenAI API error:", errorText);
      throw new Error(
        `OpenAI API error: ${openaiResponse.status} - ${errorText}`
      );
    }

    const openaiData = await openaiResponse.json();
    console.log("OpenAI API response received");

    const recommendationsText = openaiData.choices?.[0]?.message?.content;

    if (!recommendationsText) {
      console.log("No content in OpenAI response");
      throw new Error("No response content from OpenAI");
    }

    console.log(
      "Recommendations text received:",
      recommendationsText.substring(0, 100) + "..."
    );

    // Parse and validate the response
    let recommendations;
    try {
      recommendations = JSON.parse(recommendationsText);
    } catch (error) {
      console.log("Failed to parse OpenAI JSON response:", error);
      throw new Error("Invalid JSON response from OpenAI");
    }

    // Validate the response format based on content type
    if (contentType === "both") {
      if (
        !recommendations.movieRecommendation ||
        !recommendations.bookRecommendation
      ) {
        console.log(
          "Missing recommendations for 'both' type:",
          recommendations
        );
        throw new Error("Missing required movie and/or book recommendations");
      }
    } else if (contentType === "movie") {
      if (!recommendations.movieRecommendation) {
        console.log("Missing movie recommendation:", recommendations);
        throw new Error("Missing required movie recommendation");
      }
    } else if (contentType === "book") {
      if (!recommendations.bookRecommendation) {
        console.log("Missing book recommendation:", recommendations);
        throw new Error("Missing required book recommendation");
      }
    }

    console.log("Recommendations validated successfully");

    return new Response(JSON.stringify(recommendations), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Function error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return new Response(
      JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
