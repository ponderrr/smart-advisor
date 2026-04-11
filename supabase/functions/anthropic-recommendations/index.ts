import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    const { name, age, answers, contentType, contentTone } = await req.json();

    if (!name || !age || !answers) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Adults can opt into family-friendly mode; minors are always locked.
    const isAdult = age >= 18;
    const familyFriendly = !isAdult || contentTone === "family";
    const systemPrompt = familyFriendly
      ? MINOR_SYSTEM_PROMPT
      : ADULT_SYSTEM_PROMPT;

    const wantsMovies = contentType === "movie" || contentType === "both";
    const wantsBooks = contentType === "book" || contentType === "both";

    const recommendations = [];

    // Treat the user as "adult mode" only when they're actually an adult
    // AND they haven't opted into family-friendly tone.
    const allowMature = !familyFriendly;

    if (wantsMovies) {
      const movieRec = await getRecommendation({
        type: "movie",
        name,
        age,
        answers,
        isAdult: allowMature,
        systemPrompt,
      });
      recommendations.push({ type: "movie", ...movieRec });
    }

    if (wantsBooks) {
      const bookRec = await getRecommendation({
        type: "book",
        name,
        age,
        answers,
        isAdult: allowMature,
        systemPrompt,
      });
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

async function getRecommendation({
  type,
  name,
  age,
  answers,
  isAdult,
  systemPrompt,
}: {
  type: "movie" | "book";
  name: string;
  age: number;
  answers: unknown;
  isAdult: boolean;
  systemPrompt: string;
}) {
  // Handle both Answer[] format (from frontend) and Record<string, string> (legacy)
  let answersText: string;
  let answerCount = 0;
  if (Array.isArray(answers)) {
    answersText = answers
      .map((a: { question_text?: string; question_id?: string; answer_text?: string; selected_options?: string[] }) => {
        const question = a.question_text || a.question_id || "Question";
        const answer = a.selected_options?.length
          ? a.selected_options.join(", ")
          : a.answer_text || "(skipped)";
        return `- ${question}\n  → ${answer}`;
      })
      .join("\n");
    answerCount = answers.length;
  } else if (answers && typeof answers === "object") {
    const entries = Object.entries(answers as Record<string, string>);
    answersText = entries.map(([q, a]) => `- ${q}\n  → ${a}`).join("\n");
    answerCount = entries.length;
  } else {
    answersText = "(none)";
  }

  if (answerCount === 0) {
    throw new Error("No answers were provided for recommendation generation");
  }

  const prompt = `${name} just finished a personalized quiz (${answerCount} questions). The quiz answers below ARE their personality profile — that's all the data you get and it's all the data you need. Do not ask for more, do not say it's incomplete, do not hedge.

QUIZ ANSWERS (this IS the profile):
${answersText}

AGE: ${age} ${isAdult ? "(adult — mature themes are fair game when they fit)" : "(minor — keep it age-appropriate)"}

Recommend ONE ${type} that fits these specific answers.

HARD RULES for the response:
- The "explanation" MUST quote or reference at least one specific answer from the list above. Do not write generic blurbs.
- The "explanation" MUST NOT contain phrases like "without clear profile data", "without more information", "based on limited info", "I'm going with a safe pick", or any similar disclaimer. The profile is complete.
- Pick something specific and confident, not safe and obvious.
- "description" is a synopsis of the work itself (no spoilers). It must be different from "explanation".
- "match_score" is YOUR honest 0-100 assessment of fit. Use this rubric strictly:
  • 95-100: rare. Only when the pick hits at least 3 of their specific answers and there's almost nothing in the work that fights what they said they want.
  • 85-94: strong. Hits multiple specific answers and feels clearly tailored to them.
  • 75-84: solid. Aligns with the broad strokes (genre/mood/pace) but compromises on at least one preference.
  • 65-74: soft. Plausible but reaches; you're betting on something they didn't directly ask for.
  • Below 65: only when it's the best of a weak set — never default here.
  Do NOT cluster scores around 90-92. If you'd score every pick the same, you're not being honest. Vary based on actual fit.

Return ONLY a JSON object — no markdown fences, no commentary, no preamble. Exact shape:
{
  "title": "Exact title",
  "description": "2-3 sentence synopsis without spoilers",
  "explanation": "2-3 sentences referencing their actual answers and why this fits them",
  "genres": ["Genre 1", "Genre 2", "Genre 3"],
  "year": 2019,
  "director": ${type === "movie" ? '"Director name"' : "null"},
  "author": ${type === "book" ? '"Author name"' : "null"},
  "rating": 8.4,
  "match_score": 87
}`;

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured on the server");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
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
