import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MINOR_SYSTEM_PROMPT = `You are Smart Advisor, a warm and enthusiastic entertainment companion.
You help young people discover movies, books, and music they'll genuinely love.
Your tone is friendly, encouraging, and upbeat — like a cool older sibling with great taste.
You ask thoughtful questions to understand their personality and preferences.
Keep questions age-appropriate. Focus on adventure, humor, emotions, friendships, identity, and imagination.
Never mention adult themes, violence beyond PG-13, or mature content.`;

const ADULT_SYSTEM_PROMPT = `You are Smart Advisor, a sharp and opinionated entertainment critic with eclectic taste.
You help adults discover movies, books, and music that actually match who they are — not safe, generic picks.
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

    const { name, age, questionCount, contentType, contentTone } =
      await req.json();

    if (!name || !age || !questionCount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Adults can opt into family-friendly tone; minors are always locked.
    const isAdult = age >= 18;
    const familyFriendly = !isAdult || contentTone === "family";
    const systemPrompt = familyFriendly
      ? MINOR_SYSTEM_PROMPT
      : ADULT_SYSTEM_PROMPT;

    const contentContext =
      contentType === "movie"
        ? "movies only"
        : contentType === "book"
          ? "books only"
          : contentType === "music"
            ? "music albums only"
            : contentType === "mix"
              ? "a mix of movies, books, and music albums"
              : "both movies and books";

    const contentFocus =
      contentType === "movie"
        ? `EVERY question must be MOVIE-SPECIFIC. Ground them in cinema:
- Favorite eras / directors / cinematography styles, runtime tolerance, theater vs streaming habits
- Tonal preferences (slow-burn vs propulsive, intimate vs spectacle, indie vs blockbuster)
- Genre comfort zones AND a stretch they're curious about
- Reactions to specific film tropes (anti-heroes, ambiguous endings, non-linear time, found-footage, etc.)
- A scene type that pulls them in (single-take dialogue, a tracking shot through a crowd, a needle drop, a silent stare)
Do NOT ask anything that could equally apply to books or music. The word "movie", "film", "scene", "director", "screen", or "watch" should appear in the literal question text where natural.`
        : contentType === "book"
          ? `EVERY question must be BOOK-SPECIFIC. Ground them in reading:
- Reading habits (chapter length tolerance, audiobook vs print, where/when they read)
- Voice & POV preferences (first vs third person, present vs past, unreliable narrators)
- Page-count comfort, series vs standalone, translated lit vs anglophone
- Prose style (lyrical vs sparse, ornate vs propulsive, literary vs commercial)
- Plot density vs character interiority, dialogue-heavy vs descriptive
- A specific opening line vibe that hooks them
Do NOT ask anything that could equally apply to movies or music. The word "book", "novel", "read", "chapter", "prose", "author", or "page" should appear in the literal question text where natural.`
          : contentType === "music"
            ? `EVERY question must be MUSIC-SPECIFIC and ALBUM-FOCUSED. Ground them in listening:
- Decade / era preferences (60s soul, 90s indie, 2010s synthwave, etc.)
- Listening contexts (driving alone at night, working out, dinner party, headphones-only deep listens)
- Mood/vibe (melancholic, euphoric, propulsive, ambient, raw, polished)
- Vocal vs instrumental, lyric-focused vs production-focused
- Album experience preferences (cohesive 40-min statement vs sprawling 70-min epic, concept albums, double albums)
- A specific sonic texture (lo-fi tape hiss, lush strings, gritty distortion, programmed drums, acoustic warmth)
- Genre comfort zones AND a genre they want to explore
- Artist discovery habits (deep cuts vs hits, B-sides, live recordings, debut vs late-career)
- An instrument or sound that pulls them in
Do NOT ask anything that could equally apply to movies or books. The word "album", "song", "track", "listen", "sound", "artist", "band", or "music" should appear in the literal question text where natural. Avoid generic "story" or "scene" framing — this is about LISTENING, not narrative.`
            : `Questions should span movies, books, AND music albums — the user wants one of each. Mix the framing across questions: some about movies/films/screen time, some about books/reading/prose, some about albums/listening/sound. At least one question must explicitly invoke each of the three media.`;

    const userPrompt = `Generate exactly ${questionCount} personalized quiz questions for ${name}, age ${age}.
The goal is to understand their personality and taste deeply enough to recommend ${contentContext} they'll love.

CONTENT FOCUS (CRITICAL — read carefully):
${contentFocus}

${
  !familyFriendly
    ? `Since they are an adult who hasn't opted into family-friendly mode, you may include
1-2 questions about preferences for mature themes (dark content, sexuality in storytelling,
moral complexity, horror intensity, etc). Frame these naturally and matter-of-factly.`
    : ""
}

Requirements:
- Each question must be unique and reveal something meaningful about their taste
- Mix question types: hypothetical scenarios, preference comparisons, emotional responses
- Questions should feel like a fun conversation, not a form
- Vary the format so they don't feel repetitive
- Use a mix of these question types:
  - "single_select" — the user picks one answer (most questions should be this type)
  - "select_all" — the user picks multiple answers (use for genre/preference lists, 1-2 per quiz)
  - "fill_in_blank" — the user types a free-text answer (use for open-ended questions, 1 per quiz)

CRITICAL RULES FOR OPTIONS:
- Every "single_select" question MUST include an "options" array with EXACTLY 4 distinct, short answer choices that directly answer the question text.
- Every "select_all" question MUST include an "options" array with 6 to 8 distinct, short answer choices that the user could plausibly multi-select.
- "fill_in_blank" questions MUST NOT include an "options" array. Include a "placeholder" string with a short example answer instead.
- Options must be specific to the question — generic "Yes / No / Maybe" answers are forbidden unless the question literally calls for them.
- Each option must be 1-5 words. No long sentences.

Return ONLY a JSON array. No markdown, no explanation, no preamble. The format below is JUST illustrating shape — DO NOT reuse this generic story framing if the content focus above demands movie / book / music specificity:
[
  {
    "id": "q1",
    "text": "<question text matching the content focus above>",
    "type": "fill_in_blank",
    "placeholder": "<short example answer>"
  },
  {
    "id": "q2",
    "text": "<question text>",
    "type": "single_select",
    "options": ["Option A", "Option B", "Option C", "Option D"]
  },
  {
    "id": "q3",
    "text": "<question text>",
    "type": "select_all",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5", "Option 6"]
  }
]`;

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

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("AI returned no questions");
    }

    for (const q of questions) {
      if (!q || typeof q.text !== "string" || typeof q.type !== "string") {
        throw new Error("AI returned a malformed question");
      }
      if (q.type === "single_select" || q.type === "select_all") {
        if (
          !Array.isArray(q.options) ||
          q.options.length < 4 ||
          q.options.some((o: unknown) => typeof o !== "string" || !o.trim())
        ) {
          throw new Error(
            `AI question "${q.text}" is missing valid options`,
          );
        }
      }
    }

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
