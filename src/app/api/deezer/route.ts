import { NextRequest, NextResponse } from "next/server";

type AlbumProxyResponse = {
  cover: string;
  year: number;
  description: string;
  deezerUrl: string | null;
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
  cover_xl?: string;
  cover_big?: string;
  release_date?: string;
  link?: string;
  tracks?: { data?: Array<{ preview?: string }> };
}

const DEFAULT_ALBUM: AlbumProxyResponse = {
  cover:
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
  year: new Date().getFullYear(),
  description: "",
  deezerUrl: null,
  previewUrl: null,
};

const cache = new Map<string, { data: AlbumProxyResponse; expiry: number }>();
const CACHE_TTL = 1000 * 60 * 30;
const MAX_QUERY_LEN = 200;

export async function GET(req: NextRequest) {
  try {
    const title = req.nextUrl.searchParams.get("title")?.trim();
    const artist = req.nextUrl.searchParams.get("artist")?.trim();

    if (!title) {
      return NextResponse.json(DEFAULT_ALBUM);
    }
    if (title.length > MAX_QUERY_LEN || (artist && artist.length > MAX_QUERY_LEN)) {
      return NextResponse.json(DEFAULT_ALBUM);
    }

    const cacheKey = `${title}|${artist || ""}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return NextResponse.json(cached.data);
    }

    const query = artist ? `${title} ${artist}` : title;
    const searchUrl = `https://api.deezer.com/search/album?q=${encodeURIComponent(query)}&limit=10`;

    const searchController = new AbortController();
    const searchTimeout = setTimeout(() => searchController.abort(), 8000);

    const searchRes = await fetch(searchUrl, {
      signal: searchController.signal,
      cache: "no-store",
    });
    clearTimeout(searchTimeout);

    if (!searchRes.ok) {
      return NextResponse.json(DEFAULT_ALBUM);
    }

    const searchData = await searchRes.json();
    const albums: DeezerSearchAlbum[] = Array.isArray(searchData?.data)
      ? searchData.data
      : [];

    if (albums.length === 0) {
      return NextResponse.json(DEFAULT_ALBUM);
    }

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

    const cover =
      best.cover_xl || best.cover_big || best.cover_medium || DEFAULT_ALBUM.cover;
    const deezerUrl = best.link || null;

    let year: number = DEFAULT_ALBUM.year;
    let previewUrl: string | null = null;

    if (best.id) {
      try {
        const detailController = new AbortController();
        const detailTimeout = setTimeout(() => detailController.abort(), 5000);
        const detailRes = await fetch(`https://api.deezer.com/album/${best.id}`, {
          signal: detailController.signal,
          cache: "no-store",
        });
        clearTimeout(detailTimeout);

        if (detailRes.ok) {
          const detail: DeezerAlbumDetail = await detailRes.json();
          if (detail.release_date) {
            const parsedYear = parseInt(detail.release_date.slice(0, 4), 10);
            if (!Number.isNaN(parsedYear)) year = parsedYear;
          }
          const firstPreview = detail.tracks?.data?.find((t) => t.preview)?.preview;
          if (firstPreview) previewUrl = firstPreview;
        }
      } catch {
        // Detail fetch is non-critical
      }
    }

    const payload: AlbumProxyResponse = {
      cover,
      year,
      description: "",
      deezerUrl,
      previewUrl,
    };

    cache.set(cacheKey, { data: payload, expiry: Date.now() + CACHE_TTL });

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(DEFAULT_ALBUM);
  }
}
