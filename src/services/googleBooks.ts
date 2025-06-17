export interface BookSearchResult {
  cover: string;
  year: number;
  rating: number;
}

export interface BookDetails {
  id: string;
  title: string;
  authors: string[];
  genres: string[];
  year: number;
  rating: number;
  cover: string;
  description: string;
}

class GoogleBooksService {
  /**
   * Search for a book by title using Supabase Edge Function
   */
  async searchBook(title: string, author?: string): Promise<BookSearchResult> {
    try {
      const params = new URLSearchParams({ title });
      if (author) {
        params.append("author", author);
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/google-books-proxy?${params}`,
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
      console.error("Error searching book:", error);
      // Return fallback data on error
      return this.getDefaultBookData();
    }
  }

  /**
   * Fallback data when API is unavailable
   */
  private getDefaultBookData(): BookSearchResult {
    return {
      cover:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=450&fit=crop",
      year: new Date().getFullYear(),
      rating: 4.2,
    };
  }
}

export const googleBooksService = new GoogleBooksService();
