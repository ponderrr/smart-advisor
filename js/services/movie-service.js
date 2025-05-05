/**
 * Get movie poster URL for a movie title
 * @param {string} movieTitle - The title of the movie
 * @returns {Promise<string|null>} The movie poster URL or null if not found
 */
export async function getMoviePoster(movieTitle) {
  try {
    const token = await getAuthToken();

    const response = await fetch("/api/tmdb-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: "search/movie",
        params: { query: movieTitle },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch movie poster");
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const posterPath = data.results[0].poster_path;
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
    const token = await getAuthToken();

    const response = await fetch("/api/tmdb-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: "search/movie",
        params: { query: movieTitle },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch movie details");
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const movie = data.results[0];
      const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null;

      const detailsResponse = await fetch("/api/tmdb-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: `movie/${movie.id}`,
          params: { append_to_response: "credits,release_dates" },
        }),
      });

      if (!detailsResponse.ok) {
        throw new Error("Failed to fetch movie details");
      }

      const detailsData = await detailsResponse.json();

      let ageRating = "Not Rated";
      const usCertification = detailsData.release_dates?.results?.find(
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

      const genres = detailsData.genres.map((genre) => genre.name);

      const director = detailsData.credits.crew.find(
        (person) => person.job === "Director"
      );

      return {
        title: movie.title,
        posterUrl: posterUrl,
        overview: movie.overview || detailsData.overview,
        releaseDate: movie.release_date,
        rating: movie.vote_average / 2,
        ageRating: ageRating,
        runtime: detailsData.runtime,
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
    const token = await getAuthToken();

    const response = await fetch("/api/tmdb-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: "trending/movie/week",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch trending movies");
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const movies = data.results.slice(0, limit);

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
 * Get the user's auth token from Supabase
 * @returns {Promise<string>} The user's auth token
 */
async function getAuthToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }
  return session.access_token;
}

// Import at the top of the file
import { supabase } from "../supabase-config.js";
