import { openaiApiRequest } from "./api-service.js";
import { getMoviePoster } from "./movie-service.js";
import { getBookCover } from "./book-service.js";
import { getUserProfile } from "../supabase-utils.js";
import { supabase } from "../supabase-config.js";

/**
 * Get questions or recommendations based on user preferences
 * @param {Object} options - Options for questions or recommendations
 * @param {number} [options.numberOfQuestions] - Number of questions to generate
 * @param {number} options.age - User age
 * @param {string} options.type - Recommendation type: "movie", "book", or "both"
 * @param {Array} [options.answers] - User answers to generated questions
 * @returns {Promise<Object>} Questions or recommendations based on inputs
 */
export async function getQuestionsAndRecommendation({
  numberOfQuestions,
  age,
  type,
  answers,
}) {
  try {
    if (!answers) {
      const questionsPrompt = `Generate exactly ${numberOfQuestions} engaging questions to understand a ${age} year old's preferences for ${
        type === "both" ? "movies and books" : type + "s"
      }. Make questions age-appropriate and fun. Format: numbered list.`;

      const response = await openaiApiRequest(
        "gpt-3.5-turbo",
        [
          {
            role: "user",
            content: questionsPrompt,
          },
        ],
        { temperature: 0.7 }
      );

      const rawQuestions = response.choices[0].message.content;
      const questions = rawQuestions
        .split("\n")
        .filter((q) => q.trim())
        .map((q) => q.replace(/^\d+\.\s*/, "").trim());

      return { questions };
    }

    let accessibilityPreferences = null;
    let contentFilters = null;
    let recommendationHistory = [];

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      try {
        const userProfile = await getUserProfile(user.id);
        if (userProfile && userProfile.preferences) {
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

    let accessibilityRequirements = "";
    if (accessibilityPreferences) {
      const requirements = [];

      if (accessibilityPreferences.requireSubtitles) {
        requirements.push("must have subtitles available");
      }

      if (accessibilityPreferences.requireAudioDescription) {
        requirements.push("must have audio descriptions available");
      }

      if (accessibilityPreferences.requireClosedCaptions) {
        requirements.push("must have closed captions available");
      }

      if (requirements.length > 0) {
        accessibilityRequirements = `Additionally, the recommendation ${requirements.join(
          " and "
        )}.`;
      }
    }

    let contentFilterRequirements = "";
    if (contentFilters) {
      const filters = [];

      if (contentFilters.excludeViolentContent) {
        filters.push("should not contain excessive violence");
      }

      if (contentFilters.excludeSexualContent) {
        filters.push("should not contain explicit sexual content");
      }

      if (filters.length > 0) {
        contentFilterRequirements = `The recommendation ${filters.join(
          " and "
        )}.`;
      }
    }

    let historyExclusion = "";
    if (recommendationHistory && recommendationHistory.length > 0) {
      historyExclusion = `IMPORTANT: Do NOT recommend any of the following titles that have been previously recommended: ${recommendationHistory.join(
        ", "
      )}.`;
    }

    let recommendationPrompt;
    if (type === "both") {
      recommendationPrompt = `Based on these answers from a ${age} year old user: ${JSON.stringify(
        answers
      )}
      Please recommend one movie AND one book that are:
      1. Age-appropriate (rated ${
        age <= 13 ? "G or PG" : age <= 17 ? "up to PG-13" : "any rating"
      })
      2. Match their interests
      3. Have good entertainment value
      ${accessibilityRequirements}
      ${contentFilterRequirements}
      ${historyExclusion}
    
      Format the response as JSON with this structure:
      {
        "movie": {
          "title": "",
          "type": "movie",
          "rating": 0,
          "genres": [],
          "ageRating": "",
          "description": "",
          "posterPath": ""
        },
        "book": {
          "title": "",
          "type": "book",
          "rating": 0,
          "genres": [],
          "ageRating": "",
          "description": "",
          "posterPath": ""
        }
      }`;
    } else {
      recommendationPrompt = `Based on these answers from a ${age} year old user: ${JSON.stringify(
        answers
      )}
      Please recommend one ${type} that is:
      1. Age-appropriate (rated ${
        age <= 13 ? "G or PG" : age <= 17 ? "up to PG-13" : "any rating"
      })
      2. Matches their interests
      3. Has good entertainment value
      ${accessibilityRequirements}
      ${contentFilterRequirements}
      ${historyExclusion}
    
      Format the response as JSON with these fields:
      {
        "title": "",
        "type": "${type}",
        "rating": 0,
        "genres": [],
        "ageRating": "",
        "description": "",
        "posterPath": ""
      }`;
    }

    const response = await openaiApiRequest(
      "gpt-3.5-turbo",
      [
        {
          role: "user",
          content: recommendationPrompt,
        },
      ],
      { temperature: 0.7 }
    );

    const recommendation = JSON.parse(response.choices[0].message.content);

    if (type === "both") {
      const moviePosterUrl = await getMoviePoster(recommendation.movie.title);
      recommendation.movie.posterPath =
        moviePosterUrl || "/api/placeholder/300/450";

      const bookCoverUrl = await getBookCover(recommendation.book.title);
      recommendation.book.posterPath =
        bookCoverUrl || "/api/placeholder/300/450";
    } else {
      if (type === "movie") {
        const posterUrl = await getMoviePoster(recommendation.title);
        recommendation.posterPath = posterUrl || "/api/placeholder/300/450";
      } else if (type === "book") {
        const coverUrl = await getBookCover(recommendation.title);
        recommendation.posterPath = coverUrl || "/api/placeholder/300/450";
      }
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

/**
 * Generate personalized recommendation explanation
 * @param {string} title - Title of the recommended item
 * @param {string} type - Type of recommendation: "movie" or "book"
 * @param {Array} answers - User's answers to the questionnaire
 * @returns {Promise<string>} Personalized explanation for the recommendation
 */
export async function getRecommendationExplanation(title, type, answers) {
  try {
    const prompt = `Based on these user responses: ${JSON.stringify(answers)}
    
    The user was recommended the ${type} "${title}".
    
    Please write a 2-3 sentence personalized explanation of why this ${type} was recommended
    based on the user's answers. Make it sound conversational and friendly, as if talking directly
    to the user about why they might enjoy this ${type}.`;

    const response = await openaiApiRequest(
      "gpt-3.5-turbo",
      [
        {
          role: "user",
          content: prompt,
        },
      ],
      {
        temperature: 0.7,
        max_tokens: 150,
      }
    );

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating explanation:", error);
    return `We think you'll enjoy "${title}" based on your preferences!`;
  }
}

/**
 * Generate recommendations based on genre preferences
 * @param {Array} preferredGenres - List of preferred genres
 * @param {string} type - Type of recommendation: "movie" or "book"
 * @param {number} age - User age
 * @param {number} limit - Number of recommendations to generate
 * @returns {Promise<Array>} List of recommendations
 */
export async function getRecommendationsByGenre(
  preferredGenres,
  type,
  age,
  limit = 3
) {
  try {
    let accessibilityPreferences = null;
    let contentFilters = null;
    let recommendationHistory = [];

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      try {
        const userProfile = await getUserProfile(user.id);
        if (userProfile && userProfile.preferences) {
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

    let accessibilityRequirements = "";
    if (accessibilityPreferences) {
      const requirements = [];

      if (accessibilityPreferences.requireSubtitles) {
        requirements.push("must have subtitles available");
      }

      if (accessibilityPreferences.requireAudioDescription) {
        requirements.push("must have audio descriptions available");
      }

      if (accessibilityPreferences.requireClosedCaptions) {
        requirements.push("must have closed captions available");
      }

      if (requirements.length > 0) {
        accessibilityRequirements = `Additionally, the recommendations ${requirements.join(
          " and "
        )}.`;
      }
    }

    let contentFilterRequirements = "";
    if (contentFilters) {
      const filters = [];

      if (contentFilters.excludeViolentContent) {
        filters.push("should not contain excessive violence");
      }

      if (contentFilters.excludeSexualContent) {
        filters.push("should not contain explicit sexual content");
      }

      if (filters.length > 0) {
        contentFilterRequirements = `The recommendations ${filters.join(
          " and "
        )}.`;
      }
    }

    let historyExclusion = "";
    if (recommendationHistory && recommendationHistory.length > 0) {
      historyExclusion = `IMPORTANT: Do NOT recommend any of the following titles that have been previously recommended: ${recommendationHistory.join(
        ", "
      )}.`;
    }

    const ageRating =
      age <= 13 ? "G or PG" : age <= 17 ? "up to PG-13" : "any rating";

    const prompt = `Recommend ${limit} ${type}s that match these genres: ${preferredGenres.join(
      ", "
    )}.
    The recommendations should be age-appropriate (${ageRating}) for a ${age} year old.
    ${accessibilityRequirements}
    ${contentFilterRequirements}
    ${historyExclusion}
    
    Format the response as a JSON array with this structure:
    [
      {
        "title": "",
        "type": "${type}",
        "genres": [],
        "rating": 0,
        "ageRating": "",
        "description": "",
        "reason": "" // Brief explanation of why it's recommended
      }
    ]`;

    const response = await openaiApiRequest(
      "gpt-3.5-turbo",
      [
        {
          role: "user",
          content: prompt,
        },
      ],
      { temperature: 0.7 }
    );

    const recommendations = JSON.parse(response.choices[0].message.content);

    for (const rec of recommendations) {
      if (type === "movie") {
        rec.posterPath =
          (await getMoviePoster(rec.title)) || "/api/placeholder/300/450";
      } else {
        rec.posterPath =
          (await getBookCover(rec.title)) || "/api/placeholder/300/450";
      }
    }

    return recommendations;
  } catch (error) {
    console.error("Error generating recommendations by genre:", error);
    return [];
  }
}

/**
 * Check if a recommendation is a duplicate of previously recommended items
 * @param {string} title - Title to check
 * @returns {Promise<boolean>} True if it's a duplicate, false otherwise
 */
export async function isDuplicateRecommendation(title) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  try {
    const userProfile = await getUserProfile(user.id);
    if (
      !userProfile ||
      !userProfile.preferences ||
      !userProfile.preferences.recommendationHistory
    ) {
      return false;
    }

    const history = userProfile.preferences.recommendationHistory;
    return history.some((item) => item.toLowerCase() === title.toLowerCase());
  } catch (error) {
    console.error("Error checking for duplicate recommendation:", error);
    return false;
  }
}

/**
 * Get premium recommendations with more detailed criteria
 * This is a placeholder for the premium tier feature
 * @param {Object} criteria - Detailed recommendation criteria
 * @returns {Promise<Array>} List of premium recommendations
 */
export async function getPremiumRecommendations(criteria) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("You must be logged in to access premium features");
  }

  const userProfile = await getUserProfile(user.id);
  const isPremium =
    userProfile?.subscription?.isActive &&
    (userProfile.subscription.tier === "premium-monthly" ||
      userProfile.subscription.tier === "premium-annual");

  if (!isPremium) {
    throw new Error("Premium subscription required for this feature");
  }
  throw new Error("Premium recommendations are not yet available");
}
