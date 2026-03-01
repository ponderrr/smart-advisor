import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MINOR_SYSTEM_PROMPT = `You are Smart Advisor, a warm and enthusiastic entertainment companion.
You give young people genuinely great movie and book recommendations based on who they are.
Your recommendation write-ups are exciting, encouraging, and make them feel understood.
You explain WHY something is perfect for them specifically — not generic summaries.
Keep all recommendations age-appropriate (PG to PG-13 level content maximum).`;

const ADULT_SYSTEM_PROMPT = `You are Smart Advisor, a sharp and opinionated entertainment critic.
You give adults genuinely great movie and book recommendations — not safe, obvious picks.
You take their full personality profile seriously and match them with things that fit who they actually are.
Your write-ups are direct, specific, and a little passionate. You explain exactly why this is right for them.
You are not afraid to recommend challenging, dark, sexual, or morally complex content when it fits.
A good recommendation feels like it was made by someone who really gets them.`;

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

    const { name, age, answers, contentType } = await req.json();

    if (!name || !age || !answers) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isAdult = age >= 18;
    const systemPrompt = isAdult ? ADULT_SYSTEM_PROMPT : MINOR_SYSTEM_PROMPT;

    const wantsMovies = contentType === "movie" || contentType === "both";
    const wantsBooks = contentType === "book" || contentType === "both";

    const recommendations = [];

    if (wantsMovies) {
      const movieRec = await getRecommendation({ type: "movie", name, age, answers, isAdult, systemPrompt });
      recommendations.push({ type: "movie", ...movieRec });
    }

    if (wantsBooks) {
      const bookRec = await getRecommendation({ type: "book", name, age, answers, isAdult, systemPrompt });
      recommendations.push({ type: "book", ...bookRec });
    }

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("anthropic-recommendations error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getRecommendation({ type, name, age, answers, isAdult, systemPrompt }: {
  type: "movie" | "book";
  name: string;
  age: number;
  answers: Record<string, string>;
  isAdult: boolean;
  systemPrompt: string;
}) {
  const answersText = Object.entries(answers)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join("\n\n");

  const prompt = `Based on this personality profile, recommend ONE ${type} for ${name} (age ${age}).

Their answers:
${answersText}

${isAdult
  ? `This is an adult. You may recommend content with mature themes if it genuinely fits their profile.`
  : `This is a minor. Recommend age-appropriate content only.`
}

Return ONLY a JSON object. No markdown, no explanation. Exact format:
{
  "title": "Exact title",
  "description": "2-3 sentence synopsis without spoilers",
  "explanation": "2-3 sentences explaining specifically why THIS person will love it, referencing their answers",
  "genre": "Primary genre",
  "year": 2019,
  "director": ${type === "movie" ? '"Director name"' : 'null'},
  "author": ${type === "book" ? '"Author name"' : 'null'},
  "rating": 8.4
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text ?? "{}";
  const clean = content.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}
