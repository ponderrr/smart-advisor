import { openaiApi, handleApiError } from "./api-config.js";
import { getMoviePoster } from "./movie-service.js";
import { getBookCover } from "./book-service.js";
import { getUserProfile } from "../firebase-utils.js";
import { auth } from "../firebase-config.js";

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
    // If answers are not provided, generate questions
    if (!answers) {
      const questionsPrompt = `Generate exactly ${numberOfQuestions} engaging questions to understand a ${age} year old's preferences for ${
        type === "both" ? "movies and books" : type + "s"
      }. Make questions age-appropriate and fun. Format: numbered list.`;

      const response = await openaiApi.post("", {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: questionsPrompt,
          },
        ],
        temperature: 0.7,
      });

      const rawQuestions = response.data.choices[0].message.content;
      const questions = rawQuestions
        .split("\n")
        .filter((q) => q.trim())
        .map((q) => q.replace(/^\d+\.\s*/, "").trim());

      return { questions };
    }

    // Get user accessibility preferences
    let accessibilityPreferences = null;
    let contentFilters = null;
    let recommendationHistory = [];

    // Try to get user preferences if logged in
    if (auth.currentUser) {
      try {
        const userProfile = await getUserProfile(auth.currentUser.uid);
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

    // Construct accessibility requirements string based on preferences
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

    // Construct content filter requirements
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

    // Construct history exclusion string
    let historyExclusion = "";
    if (recommendationHistory && recommendationHistory.length > 0) {
      historyExclusion = `IMPORTANT: Do NOT recommend any of the following titles that have been previously recommended: ${recommendationHistory.join(
        ", "
      )}.`;
    }

    // If answers are provided, generate recommendations
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

    const response = await openaiApi.post("", {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: recommendationPrompt,
        },
      ],
      temperature: 0.7,
    });

    // Parse the recommendation from the response
    const recommendation = JSON.parse(response.data.choices[0].message.content);

    // Add poster URLs to recommendations
    if (type === "both") {
      // Get movie poster
      const moviePosterUrl = await getMoviePoster(recommendation.movie.title);
      recommendation.movie.posterPath =
        moviePosterUrl || "/api/placeholder/300/450";

      // Get book cover
      const bookCoverUrl = await getBookCover(recommendation.book.title);
      recommendation.book.posterPath =
        bookCoverUrl || "/api/placeholder/300/450";
    } else {
      // Handle single type
      if (type === "movie") {
        const posterUrl = await getMoviePoster(recommendation.title);
        recommendation.posterPath = posterUrl || "/api/placeholder/300/450";
      } else if (type === "book") {
        const coverUrl = await getBookCover(recommendation.title);
        recommendation.posterPath = coverUrl || "/api/placeholder/300/450";
      }
    }

    // Save recommendation to localStorage for results page
    localStorage.setItem(
      "recommendationDetails",
      JSON.stringify(recommendation)
    );

    return { recommendation };
  } catch (error) {
    const errorInfo = handleApiError(
      error,
      "OpenAI",
      "Error generating recommendation"
    );
    throw new Error(errorInfo.message);
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

    const response = await openaiApi.post("", {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    handleApiError(error, "OpenAI", "Error generating explanation");
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
    // Get user accessibility preferences and recommendation history
    let accessibilityPreferences = null;
    let contentFilters = null;
    let recommendationHistory = [];

    if (auth.currentUser) {
      try {
        const userProfile = await getUserProfile(auth.currentUser.uid);
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

    // Construct accessibility requirements string based on preferences
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

    // Construct content filter requirements
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

    // Construct history exclusion string
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

    const response = await openaiApi.post("", {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const recommendations = JSON.parse(
      response.data.choices[0].message.content
    );

    // Add poster/cover URLs to each recommendation
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
    handleApiError(
      error,
      "OpenAI",
      "Error generating recommendations by genre"
    );
    return [];
  }
}

/**
 * Check if a recommendation is a duplicate of previously recommended items
 * @param {string} title - Title to check
 * @returns {Promise<boolean>} True if it's a duplicate, false otherwise
 */
export async function isDuplicateRecommendation(title) {
  if (!auth.currentUser) return false;

  try {
    const userProfile = await getUserProfile(auth.currentUser.uid);
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
  // This function would be implemented for the premium tier
  // It would allow for more specific filters and criteria
  throw new Error("Premium recommendations are not yet available");
}
