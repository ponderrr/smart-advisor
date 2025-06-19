export interface BookSearchResult {
  cover: string;
  year: number;
  rating: number;
  description: string; // Add description field
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
      return this.getDefaultBookData();
    }
  }

  private getDefaultBookData(): BookSearchResult {
    return {
      cover:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
      year: new Date().getFullYear(),
      rating: 4.2,
      description:
        "An engaging and thought-provoking read that offers valuable insights and entertainment.",
    };
  }
}

export const googleBooksService = new GoogleBooksService();
