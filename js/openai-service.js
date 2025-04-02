import axios from "axios";
import { getMoviePoster } from "./tmdb-service";
import { getBookCover } from "./google-books-service";

const OPENAI_API_URL = import.meta.env.VITE_OPENAI_URL;
const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

const axiosInstance = axios.create({
  baseURL: OPENAI_API_URL,
  headers: {
    Authorization: `Bearer ${openaiApiKey}`,
    "Content-Type": "application/json",
  },
});

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

      const response = await axiosInstance.post("", {
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

    const response = await axiosInstance.post("", {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: recommendationPrompt,
        },
      ],
      temperature: 0.7,
    });

    const recommendation = JSON.parse(response.data.choices[0].message.content);

    if (type === "both") {
      // Get movie poster
      const moviePosterUrl = await getMoviePoster(recommendation.movie.title);
      console.log("Movie poster URL:", moviePosterUrl);
      recommendation.movie.posterPath =
        moviePosterUrl || "/api/placeholder/300/450";

      // Get book cover
      const bookCoverUrl = await getBookCover(recommendation.book.title);
      console.log("Book cover URL:", bookCoverUrl);
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

    console.log("recommendation", recommendation);
    localStorage.setItem(
      "recommendationDetails",
      JSON.stringify(recommendation)
    );
    return { recommendation };
  } catch (error) {
    console.error("Error with OpenAI API:", error);
    throw new Error("Failed to process request: " + error.message);
  }
}

export async function handleAPIRequest(req, res) {
  try {
    const result = await getQuestionsAndRecommendation(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
