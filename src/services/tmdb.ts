export interface MovieSearchResult {
  poster: string;
  year: number;
  rating: number;
}

export interface MovieDetails {
  id: number;
  title: string;
  director: string;
  genres: string[];
  year: number;
  rating: number;
  poster: string;
  overview: string;
}

class TMDBService {
  /**
   * Search for a movie by title using Supabase Edge Function
   */
  async searchMovie(title: string): Promise<MovieSearchResult> {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/tmdb-proxy?title=${encodeURIComponent(title)}`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error searching movie:", error);
      return this.getDefaultMovieData();
    }
  }

  /**
   * Fallback data when API is unavailable
   */
  private getDefaultMovieData(): MovieSearchResult {
    return {
      poster:
        "https://images.unsplash.com/photo-1489599731893-01139d4e6b5b?w=300&h=450&fit=crop",
      year: new Date().getFullYear(),
      rating: 7.5,
    };
  }
}

export const tmdbService = new TMDBService();
