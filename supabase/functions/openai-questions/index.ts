import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    console.log("OpenAI Questions function called");

    // Check if request method is POST
    if (req.method !== "POST") {
      throw new Error("Method not allowed. Use POST.");
    }

    // Get and validate authorization header
    const authHeader =
      req.headers.get("Authorization") ?? req.headers.get("authorization");
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

    const { contentType, userAge, questionCount } = requestBody;

    // Validate input parameters
    if (!contentType || !userAge) {
      console.log("Missing required parameters:", { contentType, userAge });
      throw new Error("Missing required parameters: contentType and userAge");
    }

    if (!["movie", "book", "both"].includes(contentType)) {
      console.log("Invalid content type:", contentType);
      throw new Error(
        "Invalid content type. Must be 'movie', 'book', or 'both'"
      );
    }

    const ageNum = Number(userAge);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      console.log("Invalid age:", userAge);
      throw new Error("Invalid age. Must be between 13 and 120");
    }

    // Validate question count (default to 5 if not provided)
    const qCount = questionCount || 5;
    const questionCountNum = Number(qCount);
    if (
      isNaN(questionCountNum) ||
      questionCountNum < 3 ||
      questionCountNum > 15
    ) {
      console.log("Invalid question count:", qCount);
      throw new Error("Invalid question count. Must be between 3 and 15");
    }

    console.log("Input validation passed:", {
      contentType,
      userAge: ageNum,
      questionCount: questionCountNum,
    });

    // Check OpenAI API key
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.log("Missing OpenAI API key");
      throw new Error("OpenAI API key not configured");
    }

    console.log("OpenAI API key found");

    // Create prompt for question generation
    const prompt = `Generate exactly ${questionCountNum} personalized recommendation questions for a ${ageNum}-year-old user who wants ${contentType} recommendations. 
    
    Requirements:
    - Questions should be conversational and engaging
    - Age-appropriate for ${ageNum} years old
    - Focused on ${
      contentType === "both" ? "movies and books" : contentType
    } preferences
    - Help understand their taste, mood, and interests
    - Each question should be unique and explore different aspects (genres, themes, mood, recent favorites, specific preferences, etc.)
    - Questions should encourage detailed responses to improve recommendation quality
    - Return as JSON object with format: {"questions": [{"id": "1", "text": "question text"}, {"id": "2", "text": "question text"}, ...]}
    
    Generate ${questionCountNum} unique, varied questions now as valid JSON object:`;

    console.log("Calling OpenAI API...");

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
                "You are a helpful assistant that generates personalized recommendation questions. Always respond with valid JSON. Create diverse, engaging questions that will help understand user preferences deeply.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: Math.min(1500, questionCountNum * 150), // Scale tokens with question count
          temperature: 0.8, // Slightly higher for more varied questions
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

    const questionsText = openaiData.choices?.[0]?.message?.content;

    if (!questionsText) {
      console.log("No content in OpenAI response");
      throw new Error("No response content from OpenAI");
    }

    console.log(
      "Questions text received:",
      questionsText.substring(0, 100) + "..."
    );

    // Parse and validate the response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(questionsText);
    } catch (e) {
      console.log("Failed to parse OpenAI JSON response:", e);
      throw new Error("Invalid JSON response from OpenAI");
    }

    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      console.log("Invalid response format from OpenAI:", parsedResponse);
      throw new Error("Invalid response format from OpenAI");
    }

    if (parsedResponse.questions.length !== questionCountNum) {
      console.log(
        "Unexpected number of questions:",
        parsedResponse.questions.length,
        "expected:",
        questionCountNum
      );
      throw new Error(
        `Expected exactly ${questionCountNum} questions from OpenAI`
      );
    }

    // Format questions for the frontend
    const formattedQuestions = parsedResponse.questions.map(
      (q: Record<string, unknown>, index: number) => {
        if (typeof q.text !== "string" || !q.text.trim()) {
          throw new Error(
            `Malformed question object from OpenAI: missing or invalid text property in question ${
              index + 1
            }`
          );
        }
        return {
          id: q.id || `q${index + 1}`,
          text: q.text,
          content_type: contentType,
          user_age_range: `${Math.floor(ageNum / 10) * 10}-${
            Math.floor(ageNum / 10) * 10 + 9
          }`,
        };
      }
    );

    console.log("Questions formatted successfully:", formattedQuestions.length);

    return new Response(JSON.stringify({ questions: formattedQuestions }), {
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
