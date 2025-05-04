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
    return null;
  } catch (error) {
    console.error("Error fetching movie poster:", error);
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
    const response = await tmdbApiRequest("search/movie", {
      query: movieTitle,
    });

    if (response.results && response.results.length > 0) {
      const movie = response.results[0];
      const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null;

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

      const genres = detailsResponse.genres.map((genre) => genre.name);

      const director = detailsResponse.credits.crew.find(
        (person) => person.job === "Director"
      );

      return {
        title: movie.title,
        posterUrl: posterUrl,
        overview: movie.overview || detailsResponse.overview,
        releaseDate: movie.release_date,
        rating: movie.vote_average / 2,
        ageRating: ageRating,
        runtime: detailsResponse.runtime,
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
    console.error("Error fetching movie details:", error);
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
    const response = await tmdbApiRequest("trending/movie/week");

    if (response.results && response.results.length > 0) {
      const movies = response.results.slice(0, limit);

      const moviePromises = movies.map((movie) => {
        return getMovieDetails(movie.title);
      });

      return Promise.all(moviePromises);
    }

    return [];
  } catch (error) {
    console.error("Error fetching trending movies:", error);
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

    const response = await tmdbApiRequest(`movie/${movieId}/recommendations`);

    if (response.results && response.results.length > 0) {
      const movies = response.results.slice(0, limit);

      const moviePromises = movies.map((movie) => {
        return getMovieDetails(movie.title);
      });

      return Promise.all(moviePromises);
    }

    return [];
  } catch (error) {
    console.error("Error fetching movie recommendations:", error);
    return [];
  }
}
