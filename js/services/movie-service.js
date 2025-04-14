import { tmdbApi, handleApiError } from "./api-config.js";

/**
 * Get movie poster URL for a movie title
 * @param {string} movieTitle - The title of the movie
 * @returns {Promise<string|null>} The movie poster URL or null if not found
 */
export async function getMoviePoster(movieTitle) {
  try {
    const response = await tmdbApi.get("/search/movie", {
      params: {
        query: movieTitle,
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const posterPath = response.data.results[0].poster_path;
      if (posterPath) {
        return `https://image.tmdb.org/t/p/w500${posterPath}`;
      }
    }

    console.warn(`No poster found for movie: ${movieTitle}`);
    return null;
  } catch (error) {
    handleApiError(error, "TMDB", "Error fetching movie poster");
    return null;
  }
}

/**
 * Get detailed movie information
 * @param {string} movieTitle - The title of the movie
 * @returns {Promise<object>} Movie details including poster, title, and rating
 */
export async function getMovieDetails(movieTitle) {
  try {
    const response = await tmdbApi.get("/search/movie", {
      params: {
        query: movieTitle,
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const movie = response.data.results[0];
      const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null;

      // Get additional movie details
      const detailsResponse = await tmdbApi.get(`/movie/${movie.id}`, {
        params: {
          append_to_response: "credits,release_dates",
        },
      });

      // Extract US age rating if available
      let ageRating = "Not Rated";
      const usCertification = detailsResponse.data.release_dates?.results?.find(
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

      // Extract genre names
      const genres = detailsResponse.data.genres.map((genre) => genre.name);

      // Extract director name
      const director = detailsResponse.data.credits.crew.find(
        (person) => person.job === "Director"
      );

      return {
        title: movie.title,
        posterUrl: posterUrl,
        overview: movie.overview || detailsResponse.data.overview,
        releaseDate: movie.release_date,
        rating: movie.vote_average / 2, // Convert to 5-star scale
        ageRating: ageRating,
        runtime: detailsResponse.data.runtime,
        genres: genres,
        director: director ? director.name : "Unknown",
        id: movie.id,
      };
    }

    return {
      title: movieTitle,
      posterUrl: null,
      overview: "No information available for this movie.",
      rating: 0,
      ageRating: "Not Rated",
      genres: [],
    };
  } catch (error) {
    handleApiError(error, "TMDB", "Error fetching movie details");
    return {
      title: movieTitle,
      posterUrl: null,
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
    const response = await tmdbApi.get("/trending/movie/week");

    if (response.data.results && response.data.results.length > 0) {
      // Get top trending movies up to the limit
      const movies = response.data.results.slice(0, limit);

      // Get detailed information for each movie
      const moviePromises = movies.map((movie) => {
        return getMovieDetails(movie.title);
      });

      return Promise.all(moviePromises);
    }

    return [];
  } catch (error) {
    handleApiError(error, "TMDB", "Error fetching trending movies");
    return [];
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

    const response = await tmdbApi.get(`/movie/${movieId}/recommendations`);

    if (response.data.results && response.data.results.length > 0) {
      // Get recommendations up to the limit
      const movies = response.data.results.slice(0, limit);

      // Get detailed information for each movie
      const moviePromises = movies.map((movie) => {
        return getMovieDetails(movie.title);
      });

      return Promise.all(moviePromises);
    }

    return [];
  } catch (error) {
    handleApiError(error, "TMDB", "Error fetching movie recommendations");
    return [];
  }
}
