import { tmdbApiRequest } from "./api-service.js";

/**
 * Get movie poster URL for a movie title
 * @param {string} movieTitle - The title of the movie
 * @returns {Promise<string|null>} The movie poster URL or null if not found
 */
export async function getMoviePoster(movieTitle) {
  try {
    const response = await tmdbApiRequest("search/movie", {
      query: movieTitle,
    });

    if (response.results && response.results.length > 0) {
      const posterPath = response.results[0].poster_path;
      if (posterPath) {
        return `https://image.tmdb.org/t/p/w500${posterPath}`;
      }
    }

    console.warn(`No poster found for movie: ${movieTitle}`);
    return "/api/placeholder/300/450";
  } catch (error) {
    console.error("Error fetching movie poster:", error);
    return "/api/placeholder/300/450";
  }
}

/**
 * Get detailed movie information
 * @param {string} movieTitle - The title of the movie
 * @returns {Promise<object>} Movie details including poster, title, and rating
 */
export async function getMovieDetails(movieTitle) {
  try {
    const response = await tmdbApiRequest("search/movie", {
      query: movieTitle,
    });

    if (response.results && response.results.length > 0) {
      const movie = response.results[0];
      const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null;

      try {
        const detailsResponse = await tmdbApiRequest(`movie/${movie.id}`, {
          append_to_response: "credits,release_dates",
        });

        let ageRating = "Not Rated";
        const usCertification = detailsResponse.release_dates?.results?.find(
          (country) => country.iso_3166_1 === "US"
        );

        if (usCertification && usCertification.release_dates.length > 0) {
          const certification = usCertification.release_dates.find(
            (release) => release.certification && release.certification.length > 0
          );
          if (certification) {
            ageRating = certification.certification;
          }
        }

        const genres = detailsResponse.genres?.map((genre) => genre.name) || [];

        const director = detailsResponse.credits?.crew?.find(
          (person) => person.job === "Director"
        );

        return {
          title: movie.title,
          posterUrl: posterUrl || "/api/placeholder/300/450",
          overview: movie.overview || detailsResponse.overview || "No overview available",
          releaseDate: movie.release_date,
          rating: movie.vote_average ? movie.vote_average / 2 : 0,
          ageRating: ageRating,
          runtime: detailsResponse.runtime,
          genres: genres,
          director: director ? director.name : "Unknown",
          id: movie.id,
        };
      } catch (detailsError) {
        console.error("Error fetching movie details:", detailsError);
        
        // Return basic info we already have from search
        return {
          title: movie.title,
          posterUrl: posterUrl || "/api/placeholder/300/450",
          overview: movie.overview || "No overview available",
          releaseDate: movie.release_date,
          rating: movie.vote_average ? movie.vote_average / 2 : 0,
          ageRating: "Not Rated",
          genres: [],
        };
      }
    }

    return {
      title: movieTitle,
      posterUrl: "/api/placeholder/300/450",
      overview: "No information available for this movie.",
      rating: 0,
      ageRating: "Not Rated",
      genres: [],
    };
  } catch (error) {
    console.error("Error fetching movie details:", error);
    return {
      title: movieTitle,
      posterUrl: "/api/placeholder/300/450",
      overview: "Error fetching movie details.",
      rating: 0,
      ageRating: "Not Rated",
      genres: [],
    };
  }
}

/**
 * Get trending movies
 * @param {number} limit - Number of movies to return
 * @returns {Promise<Array>} Array of trending movie details
 */
export async function getTrendingMovies(limit = 5) {
  try {
    const response = await tmdbApiRequest("trending/movie/week");

    if (response.results && response.results.length > 0) {
      const movies = response.results.slice(0, limit);

      const moviePromises = movies.map(async (movie) => {
        try {
          return await getMovieDetails(movie.title);
        } catch (error) {
          console.error(`Error getting details for ${movie.title}:`, error);
          
          // Return basic info we already have from trending
          const posterUrl = movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : "/api/placeholder/300/450";
            
          return {
            title: movie.title,
            posterUrl: posterUrl,
            overview: movie.overview || "No overview available",
            releaseDate: movie.release_date,
            rating: movie.vote_average ? movie.vote_average / 2 : 0,
            ageRating: "Not Rated",
            genres: [],
          };
        }
      });

      try {
        return await Promise.all(moviePromises);
      } catch (allError) {
        console.error("Error getting all movie details:", allError);
        
        // Fallback to returning basic info without details
        return movies.map(movie => ({
          title: movie.title,
          posterUrl: movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : "/api/placeholder/300/450",
          overview: movie.overview || "No overview available",
          rating: movie.vote_average ? movie.vote_average / 2 : 0,
        }));
      }
    }

    return getDefaultMovies(limit);
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return getDefaultMovies(limit);
  }
}

/**
 * Get movie recommendations based on a movie ID
 * @param {number} movieId - TMDB movie ID
 * @param {number} limit - Number of recommendations to return
 * @returns {Promise<Array>} Array of recommended movie details
 */
export async function getMovieRecommendations(movieId, limit = 5) {
  try {
    if (!movieId) {
      throw new Error("Movie ID is required");
    }

    const response = await tmdbApiRequest(`movie/${movieId}/recommendations`);

    if (response.results && response.results.length > 0) {
      const movies = response.results.slice(0, limit);

      const moviePromises = movies.map(async (movie) => {
        try {
          return await getMovieDetails(movie.title);
        } catch (error) {
          console.error(`Error getting details for ${movie.title}:`, error);
          
          // Return basic info
          const posterUrl = movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : "/api/placeholder/300/450";
            
          return {
            title: movie.title,
            posterUrl: posterUrl,
            overview: movie.overview || "No overview available",
            releaseDate: movie.release_date,
            rating: movie.vote_average ? movie.vote_average / 2 : 0,
            ageRating: "Not Rated",
            genres: [],
          };
        }
      });

      try {
        return await Promise.all(moviePromises);
      } catch (allError) {
        console.error("Error getting all movie recommendations:", allError);
        
        // Fallback to returning basic info without details
        return movies.map(movie => ({
          title: movie.title,
          posterUrl: movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : "/api/placeholder/300/450",
          overview: movie.overview || "No overview available",
          rating: movie.vote_average ? movie.vote_average / 2 : 0,
        }));
      }
    }

    return [];
  } catch (error) {
    console.error("Error fetching movie recommendations:", error);
    return [];
  }
}

/**
 * Get default movies when API requests fail
 * @param {number} limit - Number of movies to return
 * @returns {Array} Array of default movie details
 */
function getDefaultMovies(limit = 5) {
  const defaultMovies = [
    {
      title: "The Shawshank Redemption",
      overview: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
      rating: 4.7,
      genres: ["Drama"],
      posterUrl: "/api/placeholder/300/450"
    },
    {
      title: "The Godfather",
      overview: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
      rating: 4.7,
      genres: ["Crime", "Drama"],
      posterUrl: "/api/placeholder/300/450"
    },
    {
      title: "The Dark Knight",
      overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
      rating: 4.6,
      genres: ["Action", "Crime", "Drama"],
      posterUrl: "/api/placeholder/300/450"
    },
    {
      title: "The Lord of the Rings: The Return of the King",
      overview: "Gandalf and Aragorn lead the World of Men against Sauron's army to draw his gaze from Frodo and Sam as they approach Mount Doom with the One Ring.",
      rating: 4.5,
      genres: ["Action", "Adventure", "Fantasy"],
      posterUrl: "/api/placeholder/300/450"
    },
    {
      title: "Pulp Fiction",
      overview: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
      rating: 4.5,
      genres: ["Crime", "Drama"],
      posterUrl: "/api/placeholder/300/450"
    }
  ];
  
  return defaultMovies.slice(0, limit);
}