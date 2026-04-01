import { API_URLS, FETCH_TIMEOUT_MS } from "./constants";

// ─── Shared Types ─────────────────────────────────────────────

export type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  number_of_pages_median?: number;
};

export type TmdbMovieResult = {
  id: number;
  title?: string;
  poster_path?: string | null;
  release_date?: string;
  overview?: string;
};

// ─── Open Library Helpers ─────────────────────────────────────

export async function searchOpenLibraryDocs(
  query: string,
  limit: number,
): Promise<OpenLibraryDoc[]> {
  const url = `${API_URLS.OPEN_LIBRARY_SEARCH}?q=${encodeURIComponent(query)}&limit=${Math.max(limit * 2, 12)}&fields=key,title,author_name,first_publish_year,cover_i,number_of_pages_median`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`Open Library error ${response.status}`);
    const data = await response.json();
    const docs: OpenLibraryDoc[] = Array.isArray(data.docs) ? data.docs : [];
    return docs.filter((doc) => doc.cover_i && doc.title);
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

export function openLibraryCoverUrl(
  coverId: number,
  size: "S" | "M" | "L" = "L",
): string {
  return `${API_URLS.OPEN_LIBRARY_COVERS}/${coverId}-${size}.jpg`;
}

// ─── TMDB Helpers ─────────────────────────────────────────────

export function tmdbPosterUrl(posterPath: string): string {
  return `${API_URLS.TMDB_IMAGE}${posterPath}`;
}

export function tmdbWebUrl(movieId: number): string {
  return `${API_URLS.TMDB_WEB}/movie/${movieId}`;
}

export async function searchTmdbMovies(
  query: string,
  apiKey: string,
): Promise<TmdbMovieResult[]> {
  const searchUrl = `${API_URLS.TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1&api_key=${apiKey}`;
  const response = await fetch(searchUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`TMDB error ${response.status}`);
  const data = await response.json();
  return Array.isArray(data.results) ? data.results : [];
}

export async function discoverTmdbMovies(
  apiKey: string,
): Promise<TmdbMovieResult[]> {
  const url = `${API_URLS.TMDB_BASE}/discover/movie?include_adult=false&include_video=false&language=en-US&sort_by=popularity.desc&page=1&api_key=${apiKey}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data.results) ? data.results : [];
}

export const sanitizeHtml = (text: string) =>
  text.replace(/<[^>]*>/g, "").trim();
