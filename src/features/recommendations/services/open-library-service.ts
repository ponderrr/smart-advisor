export interface BookSearchResult {
  cover: string;
  year: number;
  rating: number;
  description: string;
  openLibraryUrl: string | null;
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
  openLibraryUrl: string | null;
}

class OpenLibraryService {
  async searchBook(title: string, author?: string): Promise<BookSearchResult> {
    try {
      const params = new URLSearchParams({ title });
      if (author) {
        params.append("author", author);
      }

      const response = await fetch(`/api/open-library?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch {
      return this.getDefaultBookData();
    }
  }

  private getDefaultBookData(): BookSearchResult {
    return {
      cover:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
      year: new Date().getFullYear(),
      rating: 0,
      description:
        "An engaging and thought-provoking read that offers valuable insights and entertainment.",
      openLibraryUrl: null,
    };
  }
}

export const openLibraryService = new OpenLibraryService();
