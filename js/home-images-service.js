import {
  getEnhancedBookCover,
  getBookDetails,
} from "./enhanced-google-books-service.js";
import axios from "axios";

// TMDB API endpoint for trending movies
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

/**

 @returns {Promise<{posterUrl: string, title: string}>}
 */
export async function getTrendingMoviePoster() {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/trending/movie/week`, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      // Get a random movie from the top 10 results
      const randomIndex = Math.floor(
        Math.random() * Math.min(10, response.data.results.length)
      );
      const movie = response.data.results[randomIndex];

      if (movie.poster_path) {
        return {
          posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          title: movie.title,
        };
      }
    }

    // Fallback to default image
    return {
      posterUrl: "images/movie-background.jpg",
      title: "Movie Recommendation",
    };
  } catch (error) {
    console.error("Error fetching trending movie:", error);
    return {
      posterUrl: "images/movie-background.jpg",
      title: "Movie Recommendation",
    };
  }
}

/**

 @returns {Promise<{coverUrl: string, title: string}>}
 */
export async function getPopularBookCover() {
  // List of popular books with high-quality cover art
  const popularBooks = [
    "Dune by Frank Herbert",
    "The Midnight Library by Matt Haig",
    "Project Hail Mary by Andy Weir",
    "The Hunger Games by Suzanne Collins",
    "A Court of Thorns and Roses by Sarah J. Maas",
    "The Silent Patient by Alex Michaelides",
    "Where the Crawdads Sing by Delia Owens",
    "It Ends with Us by Colleen Hoover",
    "Circe by Madeline Miller",
    "The Song of Achilles by Madeline Miller",
    "The Seven Husbands of Evelyn Hugo by Taylor Jenkins Reid",
    "Klara and the Sun by Kazuo Ishiguro",
    "The Thursday Murder Club by Richard Osman",
    "House of Earth and Blood by Sarah J. Maas",
    "The Invisible Life of Addie LaRue by V.E. Schwab",
    "Atomic Habits by James Clear",
    "The House in the Cerulean Sea by TJ Klune",
    "Normal People by Sally Rooney",
    "Fourth Wing by Rebecca Yarros",
    "A Little Life by Hanya Yanagihara",
  ];

  // Try to get a random book from the list
  const randomIndex = Math.floor(Math.random() * popularBooks.length);
  const randomBook = popularBooks[randomIndex];

  try {
    const bookDetails = await getBookDetails(randomBook);

    if (bookDetails.coverUrl) {
      return {
        coverUrl: bookDetails.coverUrl,
        title: bookDetails.title,
        author: bookDetails.author,
      };
    }

    // Fallback to default image
    return {
      coverUrl: "images/book-background.jpg",
      title: "Book Recommendation",
      author: "Various Authors",
    };
  } catch (error) {
    console.error("Error fetching popular book cover:", error);
    return {
      coverUrl: "images/book-background.jpg",
      title: "Book Recommendation",
    };
  }
}

/**

 @returns {Promise<{backgroundStyle: string, movieTitle: string, bookTitle: string}>}
 */
export async function getCombinedRecommendationImage() {
  try {
    const [movieData, bookData] = await Promise.all([
      getTrendingMoviePoster(),
      getPopularBookCover(),
    ]);

    // Return CSS for a split background
    return {
      backgroundStyle: `linear-gradient(to right, rgba(0,0,0,0.5), rgba(0,0,0,0.5)), 
                              linear-gradient(to right, 
                                rgba(0,0,0,0) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 100%), 
                              linear-gradient(to right, 
                                url(${movieData.posterUrl}) 0 0/cover no-repeat, 
                                url(${bookData.coverUrl}) 0 0/cover no-repeat)`,
      movieTitle: movieData.title,
      bookTitle: bookData.title,
    };
  } catch (error) {
    console.error("Error creating combined image:", error);
    return {
      backgroundStyle: `url('images/both-background.jpg')`,
      movieTitle: "Movie",
      bookTitle: "Book",
    };
  }
}
