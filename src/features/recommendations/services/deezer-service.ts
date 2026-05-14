export interface AlbumSearchResult {
  cover: string;
  year: number;
  description: string;
  deezerUrl: string | null;
  previewUrl: string | null;
}

class DeezerService {
  async searchAlbum(title: string, artist?: string): Promise<AlbumSearchResult> {
    try {
      const params = new URLSearchParams({ title });
      if (artist) {
        params.append("artist", artist);
      }

      const response = await fetch(`/api/deezer?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch {
      return this.getDefaultAlbumData();
    }
  }

  private getDefaultAlbumData(): AlbumSearchResult {
    return {
      cover:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      year: new Date().getFullYear(),
      description: "",
      deezerUrl: null,
      previewUrl: null,
    };
  }
}

export const deezerService = new DeezerService();
