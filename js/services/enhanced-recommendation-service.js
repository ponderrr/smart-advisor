import { supabase } from "../supabase-config.js";
import { getMoviePoster } from "./movie-service.js";
import { getBookCover } from "./book-service.js";
import { getUserProfile } from "../supabase-utils.js";

/**
 * Get questions or recommendations based on user preferences
 */
export async function getQuestionsAndRecommendation({
  numberOfQuestions,
  age,
  type,
  answers,
}) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!answers) {
      if (!session && numberOfQuestions > 5) {
        throw new Error(
          "Free accounts are limited to 5 questions. Sign in or upgrade to Premium for unlimited questions!"
        );
      } else if (session) {
        const userProfile = await getUserProfile(session.user.id);
        const maxQuestions = getMaxQuestionsForUser(userProfile);
        if (numberOfQuestions > maxQuestions) {
          throw new Error(
            `Free accounts are limited to ${maxQuestions} questions. Upgrade to Premium for more questions!`
          );
        }
      }

      const token = await getAuthToken();
      const response = await fetch("/api/openai-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: `Generate exactly ${numberOfQuestions} engaging questions to understand a ${age} year old's preferences for ${
                type === "both" ? "movies and books" : type + "s"
              }. Make questions age-appropriate and fun. Format: numbered list.`,
            },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok)
        throw new Error(
          (await response.json()).error || "Failed to generate questions"
        );

      const data = await response.json();
      const questions = data.choices[0].message.content
        .split("\n")
        .filter((q) => q.trim())
        .map((q) => q.replace(/^\d+\.\s*/, "").trim());

      return { questions };
    }

    let accessibilityPreferences = null,
      contentFilters = null,
      recommendationHistory = [];

    if (session) {
      try {
        const userProfile = await getUserProfile(session.user.id);
        if (userProfile?.preferences) {
          accessibilityPreferences =
            userProfile.preferences.accessibility || null;
          contentFilters = userProfile.preferences.contentFilters || null;
          recommendationHistory =
            userProfile.preferences.recommendationHistory || [];
        }
      } catch (error) {
        console.warn("Error fetching user preferences:", error);
      }
    }

    const ageRating =
      age <= 13 ? "G or PG" : age <= 17 ? "up to PG-13" : "any rating";
    const buildRequirements = (prefs, keys, messages) => {
      return prefs
        ? keys
            .filter((k) => prefs[k])
            .map((k) => messages[k])
            .join(" and ")
        : "";
    };

    const accessibilityRequirements = buildRequirements(
      accessibilityPreferences,
      ["requireSubtitles", "requireAudioDescription", "requireClosedCaptions"],
      {
        requireSubtitles: "must have subtitles available",
        requireAudioDescription: "must have audio descriptions available",
        requireClosedCaptions: "must have closed captions available",
      }
    );

    const contentFilterRequirements = buildRequirements(
      contentFilters,
      ["excludeViolentContent", "excludeSexualContent"],
      {
        excludeViolentContent: "should not contain excessive violence",
        excludeSexualContent: "should not contain explicit sexual content",
      }
    );

    const historyExclusion =
      recommendationHistory.length > 0
        ? `IMPORTANT: Do NOT recommend any of the following titles that have been previously recommended: ${recommendationHistory.join(
            ", "
          )}.`
        : "";

    const recommendationPrompt =
      type === "both"
        ? `Based on these answers from a ${age} year old user: ${JSON.stringify(
            answers
          )}\nPlease recommend one movie AND one book that are:\n1. Age-appropriate (rated ${ageRating})\n2. Match their interests\n3. Have good entertainment value\n${
            accessibilityRequirements
              ? "Additionally, the recommendation " +
                accessibilityRequirements +
                "."
              : ""
          }\n${
            contentFilterRequirements
              ? "The recommendation " + contentFilterRequirements + "."
              : ""
          }\n${historyExclusion}\nFormat the response as JSON with this structure:{"movie":{"title":"","type":"movie","rating":0,"genres":[],"ageRating":"","description":"","posterPath":""},"book":{"title":"","type":"book","rating":0,"genres":[],"ageRating":"","description":"","posterPath":""}}`
        : `Based on these answers from a ${age} year old user: ${JSON.stringify(
            answers
          )}\nPlease recommend one ${type} that is:\n1. Age-appropriate (rated ${ageRating})\n2. Matches their interests\n3. Has good entertainment value\n${
            accessibilityRequirements
              ? "Additionally, the recommendation " +
                accessibilityRequirements +
                "."
              : ""
          }\n${
            contentFilterRequirements
              ? "The recommendation " + contentFilterRequirements + "."
              : ""
          }\n${historyExclusion}\nFormat the response as JSON with these fields:{"title":"","type":"${type}","rating":0,"genres":[],"ageRating":"","description":"","posterPath":""}`;

    const token = await getAuthToken();
    const response = await fetch("/api/openai-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: recommendationPrompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok)
      throw new Error(
        (await response.json()).error || "Failed to generate recommendation"
      );

    const data = await response.json();
    const recommendation = JSON.parse(data.choices[0].message.content);

    if (type === "both") {
      recommendation.movie.posterPath =
        (await getMoviePoster(recommendation.movie.title)) ||
        "/api/placeholder/300/450";
      recommendation.book.posterPath =
        (await getBookCover(recommendation.book.title)) ||
        "/api/placeholder/300/450";
    } else if (type === "movie") {
      recommendation.posterPath =
        (await getMoviePoster(recommendation.title)) ||
        "/api/placeholder/300/450";
    } else if (type === "book") {
      recommendation.posterPath =
        (await getBookCover(recommendation.title)) ||
        "/api/placeholder/300/450";
    }

    localStorage.setItem(
      "recommendationDetails",
      JSON.stringify(recommendation)
    );
    return { recommendation };
  } catch (error) {
    console.error("Error generating recommendation:", error);
    throw new Error(error.message || "Error generating recommendation");
  }
}

function getMaxQuestionsForUser(userProfile) {
  if (!userProfile) return 5;
  return userProfile.subscription?.isActive ? 15 : 5;
}

async function getAuthToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return session.access_token;
}

export async function getRecommendationExplanation(title, type, answers) {
  try {
    const token = await getAuthToken();
    const prompt = `Based on these user responses: ${JSON.stringify(
      answers
    )}\nThe user was recommended the ${type} \"${title}\".\nPlease write a 2-3 sentence personalized explanation of why this ${type} was recommended based on the user's answers. Make it sound conversational and friendly.`;

    const response = await fetch("/api/openai-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) throw new Error("Failed to generate explanation");
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating explanation:", error);
    return `We think you'll enjoy \"${title}\" based on your preferences!`;
  }
}

export async function getRecommendationsByGenre(
  preferredGenres,
  type,
  age,
  limit = 3
) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) limit = 1;
    else {
      const userProfile = await getUserProfile(session.user.id);
      if (!isUserPremium(userProfile) && limit > 1) limit = 1;
    }

    const ageRating =
      age <= 13 ? "G or PG" : age <= 17 ? "up to PG-13" : "any rating";

    const prompt = `Recommend ${limit} ${type}s that match these genres: ${preferredGenres.join(
      ", "
    )}. The recommendations should be age-appropriate (${ageRating}) for a ${age} year old. Format as JSON.`;

    const token = await getAuthToken();
    const response = await fetch("/api/openai-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok)
      throw new Error("Failed to generate recommendations by genre");
    const data = await response.json();
    const recommendations = JSON.parse(data.choices[0].message.content);

    for (const rec of recommendations) {
      rec.posterPath =
        type === "movie"
          ? (await getMoviePoster(rec.title)) || "/api/placeholder/300/450"
          : (await getBookCover(rec.title)) || "/api/placeholder/300/450";
    }

    return recommendations;
  } catch (error) {
    console.error("Error generating recommendations by genre:", error);
    return [];
  }
}

function isUserPremium(userProfile) {
  return (
    userProfile?.subscription?.isActive &&
    ["premium-monthly", "premium-annual"].includes(
      userProfile.subscription.tier
    )
  );
}

export async function isDuplicateRecommendation(title) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return false;

  try {
    const userProfile = await getUserProfile(session.user.id);
    const history = userProfile?.preferences?.recommendationHistory || [];
    return history.some((item) => item.toLowerCase() === title.toLowerCase());
  } catch (error) {
    console.error("Error checking for duplicate recommendation:", error);
    return false;
  }
}
