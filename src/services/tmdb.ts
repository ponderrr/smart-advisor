export interface MovieSearchResult {
  poster: string;
  year: number;
  rating: number;
  description: string; // Add description field
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
  description: string; // Add description field
}

class TMDBService {
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

  private getDefaultMovieData(): MovieSearchResult {
    return {
      poster:
        "https://images.unsplash.com/photo-1489599731893-01139d4e6b5b?w=500&h=750&fit=crop",
      year: new Date().getFullYear(),
      rating: 7.5,
      description:
        "A captivating story that will keep you entertained from start to finish.",
    };
  }
}

export const tmdbService = new TMDBService();
