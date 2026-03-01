import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MINOR_SYSTEM_PROMPT = `You are Smart Advisor, a warm and enthusiastic entertainment companion.
You help young people discover movies and books they'll genuinely love.
Your tone is friendly, encouraging, and upbeat — like a cool older sibling with great taste.
You ask thoughtful questions to understand their personality and preferences.
Keep questions age-appropriate. Focus on adventure, humor, emotions, friendships, identity, and imagination.
Never mention adult themes, violence beyond PG-13, or mature content.`;

const ADULT_SYSTEM_PROMPT = `You are Smart Advisor, a sharp and opinionated entertainment critic with eclectic taste.
You help adults discover movies and books that actually match who they are — not safe, generic picks.
Your tone is direct, a little irreverent, and genuinely curious. You treat users like adults with real taste.
You ask probing questions to understand their personality, including preferences around mature themes.
It is appropriate to ask about preferences for: morally complex narratives, dark or gritty content,
sexuality and romance in storytelling, extreme horror, violence in film/literature, controversial topics.
These questions help you make dramatically better recommendations. Be direct and unapologetic about it.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, age, questionCount, contentType } = await req.json();

    if (!name || !age || !questionCount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isAdult = age >= 18;
    const systemPrompt = isAdult ? ADULT_SYSTEM_PROMPT : MINOR_SYSTEM_PROMPT;

    const contentContext = contentType === "movie"
      ? "movies only"
      : contentType === "book"
      ? "books only"
      : "both movies and books";

    const userPrompt = `Generate exactly ${questionCount} personalized quiz questions for ${name}, age ${age}.
The goal is to understand their personality and taste deeply enough to recommend ${contentContext} they'll love.

${isAdult ? `Since they are an adult, you may include 1-2 questions about preferences for mature themes
(dark content, sexuality in storytelling, moral complexity, horror intensity, etc).
Frame these naturally and matter-of-factly.` : ""}

Requirements:
- Each question must be unique and reveal something meaningful about their taste
- Mix question types: hypothetical scenarios, preference comparisons, emotional responses
- Questions should feel like a fun conversation, not a form
- Vary the format so they don't feel repetitive

Return ONLY a JSON array. No markdown, no explanation, no preamble. Example format:
[
  {
    "id": "q1",
    "question": "If you could live inside any fictional world for a week, where would you go and why?",
    "type": "open"
  }
]`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text ?? "[]";
    const clean = content.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(clean);

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("anthropic-questions error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
