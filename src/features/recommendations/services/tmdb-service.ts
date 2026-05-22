/**
 * Streaming / rent / buy availability for a title (TMDB → JustWatch).
 * Region-specific and volatile, so this is fetched fresh for display and
 * never persisted on the recommendation row. "via JustWatch" attribution
 * is required wherever this is shown, per TMDB terms.
 */
export interface WatchProviders {
  link: string | null; // JustWatch deep link for the title
  flatrate: string[]; // included with a subscription
  rent: string[];
  buy: string[];
}

export interface MovieSearchResult {
  poster: string;
  year: number;
  rating: number;
  description: string;
  genres?: string[];
  /** Director name, from the tmdb-proxy credits lookup. */
  director?: string;
  trailer?: string | null;
  watchProviders?: WatchProviders | null;
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
  /** Best-effort 2-letter region for watch-provider lookup (default US). */
  private region(): string {
    try {
      const loc =
        typeof navigator !== "undefined" ? navigator.language : "en-US";
      const region = new Intl.Locale(loc).region;
      return region ? region.toUpperCase().slice(0, 2) : "US";
    } catch {
      return "US";
    }
  }

  async searchMovie(title: string): Promise<MovieSearchResult> {
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_SUPABASE_URL
        }/functions/v1/tmdb-proxy?title=${encodeURIComponent(
          title,
        )}&region=${this.region()}`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
          },
        },
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
