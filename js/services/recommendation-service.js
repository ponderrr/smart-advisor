import { openaiApi, handleApiError } from "./api-config.js";
import { getMoviePoster } from "./movie-service.js";
import { getBookCover } from "./book-service.js";

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
    const ageRating =
      age <= 13 ? "G or PG" : age <= 17 ? "up to PG-13" : "any rating";

    const prompt = `Recommend ${limit} ${type}s that match these genres: ${preferredGenres.join(
      ", "
    )}.
    The recommendations should be age-appropriate (${ageRating}) for a ${age} year old.
    
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
