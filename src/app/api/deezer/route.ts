import { NextRequest, NextResponse } from "next/server";

import { searchDeezerAlbum } from "@/lib/api-helpers";

type AlbumProxyResponse = {
  cover: string;
  year: number;
  description: string;
  deezerUrl: string | null;
  previewUrl: string | null;
};

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

    const album = await searchDeezerAlbum(title, artist || undefined);
    if (!album) {
      return NextResponse.json(DEFAULT_ALBUM);
    }

    const payload: AlbumProxyResponse = {
      cover: album.cover,
      year: album.year ?? DEFAULT_ALBUM.year,
      description: "",
      deezerUrl: album.deezerUrl,
      previewUrl: album.previewUrl,
    };

    cache.set(cacheKey, { data: payload, expiry: Date.now() + CACHE_TTL });

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(DEFAULT_ALBUM);
  }
}
