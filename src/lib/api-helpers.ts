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

// ─── Deezer (music) Helpers ───────────────────────────────────

export type DeezerAlbumResult = {
  /** Largest available cover art URL. */
  cover: string;
  /** Release year, when the album detail call resolves it. */
  year?: number;
  /** Public Deezer album page. */
  deezerUrl: string | null;
  /** 30s track preview, when available. */
  previewUrl: string | null;
};

interface DeezerSearchAlbum {
  id?: number;
  title?: string;
  cover_xl?: string;
  cover_big?: string;
  cover_medium?: string;
  artist?: { name?: string };
  link?: string;
}

interface DeezerAlbumDetail {
  release_date?: string;
  tracks?: { data?: Array<{ preview?: string }> };
}

/**
 * Search Deezer for the album that best matches a title (+ optional artist),
 * then fetch its detail for release year and a track preview. Returns null
 * when nothing usable is found so callers can apply their own fallback.
 * Shared by /api/deezer and the demo recommendations route so music
 * enrichment stays identical across both.
 */
export async function searchDeezerAlbum(
  title: string,
  artist?: string,
): Promise<DeezerAlbumResult | null> {
  const query = artist ? `${title} ${artist}` : title;
  const searchUrl = `${API_URLS.DEEZER_API}/search/album?q=${encodeURIComponent(query)}&limit=10`;

  const searchController = new AbortController();
  const searchTimeout = setTimeout(
    () => searchController.abort(),
    FETCH_TIMEOUT_MS,
  );

  let albums: DeezerSearchAlbum[];
  try {
    const searchRes = await fetch(searchUrl, {
      signal: searchController.signal,
      cache: "no-store",
    });
    clearTimeout(searchTimeout);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    albums = Array.isArray(searchData?.data) ? searchData.data : [];
  } catch {
    clearTimeout(searchTimeout);
    return null;
  }

  if (albums.length === 0) return null;

  const searchTitle = title.toLowerCase();
  const searchArtist = artist?.toLowerCase();
  let best = albums[0];
  for (const album of albums) {
    const albumTitle = (album.title || "").toLowerCase();
    const albumArtist = (album.artist?.name || "").toLowerCase();
    const titleMatch =
      albumTitle === searchTitle ||
      albumTitle.includes(searchTitle) ||
      searchTitle.includes(albumTitle);
    const artistMatch = searchArtist
      ? albumArtist === searchArtist ||
        albumArtist.includes(searchArtist) ||
        searchArtist.includes(albumArtist)
      : true;
    if (titleMatch && artistMatch) {
      best = album;
      break;
    }
  }

  const cover = best.cover_xl || best.cover_big || best.cover_medium;
  if (!cover) return null;

  let year: number | undefined;
  let previewUrl: string | null = null;

  if (best.id) {
    try {
      const detailController = new AbortController();
      const detailTimeout = setTimeout(
        () => detailController.abort(),
        5000,
      );
      const detailRes = await fetch(
        `${API_URLS.DEEZER_API}/album/${best.id}`,
        { signal: detailController.signal, cache: "no-store" },
      );
      clearTimeout(detailTimeout);
      if (detailRes.ok) {
        const detail: DeezerAlbumDetail = await detailRes.json();
        if (detail.release_date) {
          const parsedYear = parseInt(detail.release_date.slice(0, 4), 10);
          if (!Number.isNaN(parsedYear)) year = parsedYear;
        }
        const firstPreview = detail.tracks?.data?.find(
          (track) => track.preview,
        )?.preview;
        if (firstPreview) previewUrl = firstPreview;
      }
    } catch {
      // Detail fetch is non-critical — cover alone is enough.
    }
  }

  return { cover, year, deezerUrl: best.link || null, previewUrl };
}

export const sanitizeHtml = (text: string) =>
  text.replace(/<[^>]*>/g, "").trim();
