import { NextRequest, NextResponse } from "next/server";

import { API_URLS } from "@/lib/constants";
import {
  openLibraryCoverUrl,
  searchOpenLibraryDocs,
} from "@/lib/api-helpers";

/**
 * Looks up a trailer (movies) or cover/info link (books) for a recommendation.
 *
 * Movies → TMDB search → /movie/{id}/videos → first official YouTube trailer.
 * Books  → Open Library search → cover image + work info page link.
 *
 * The TMDB key stays server-side. Responses are cached for 1h since trailer
 * keys rarely change once a film is out.
 */

interface TmdbSearchHit {
  id: number;
  release_date?: string;
  title?: string;
  poster_path?: string | null;
  overview?: string | null;
}

interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official?: boolean;
  name?: string;
}

interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

interface TmdbProvidersResponse {
  results?: Record<
    string,
    {
      link?: string;
      flatrate?: TmdbProvider[];
    }
  >;
}

const cacheHeaders = {
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
} as const;

const TMDB_LOGO_BASE = "https://image.tmdb.org/t/p/w92";

// TMDB provider_id → deep-search URL on the actual streaming service.
// Builds a search URL for the title since TMDB doesn't expose direct
// title→service deep links (those are JustWatch-only and gated).
const PROVIDER_SEARCH_URL: Record<number, (q: string) => string> = {
  8: (q) => `https://www.netflix.com/search?q=${q}`, // Netflix
  9: (q) => `https://www.amazon.com/s?k=${q}&i=instant-video`, // Amazon Prime Video
  10: (q) => `https://www.amazon.com/s?k=${q}&i=instant-video`, // Amazon Video
  119: (q) => `https://www.amazon.com/s?k=${q}&i=instant-video`, // Amazon Prime Video (alt id)
  337: (q) => `https://www.disneyplus.com/search?q=${q}`, // Disney+
  15: (q) => `https://www.hulu.com/search?q=${q}`, // Hulu
  1899: (q) => `https://www.max.com/search?q=${q}`, // Max
  384: (q) => `https://www.max.com/search?q=${q}`, // HBO Max (legacy id)
  350: (q) => `https://tv.apple.com/search?term=${q}`, // Apple TV+
  2: (q) => `https://tv.apple.com/search?term=${q}`, // Apple TV
  531: (q) => `https://www.paramountplus.com/search/?query=${q}`, // Paramount+
  386: (q) => `https://www.peacocktv.com/search?q=${q}`, // Peacock Premium
  387: (q) => `https://www.peacocktv.com/search?q=${q}`, // Peacock Premium Plus
  283: (q) => `https://www.crunchyroll.com/search?q=${q}`, // Crunchyroll
  73: (q) => `https://tubitv.com/search/${q}`, // Tubi
  300: (q) => `https://pluto.tv/en/search/${q}`, // Pluto TV
  188: (q) => `https://www.youtube.com/results?search_query=${q}`, // YouTube Premium
  192: (q) => `https://www.youtube.com/results?search_query=${q}`, // YouTube
};

const buildProviderLink = (providerId: number, title: string) => {
  const builder = PROVIDER_SEARCH_URL[providerId];
  return builder ? builder(encodeURIComponent(title)) : null;
};

async function lookupMovieTrailer(
  title: string,
  year: number | null,
  region: string,
  apiKey: string,
) {
  const params = new URLSearchParams({
    query: title,
    include_adult: "false",
    language: "en-US",
    page: "1",
    api_key: apiKey,
  });
  if (year) params.set("year", String(year));

  const searchRes = await fetch(
    `${API_URLS.TMDB_BASE}/search/movie?${params.toString()}`,
    { next: { revalidate: 3600 } },
  );
  if (!searchRes.ok) return null;
  const searchJson = (await searchRes.json()) as { results?: TmdbSearchHit[] };
  const hit = searchJson.results?.[0];
  if (!hit) return null;

  const posterUrl = hit.poster_path
    ? `https://image.tmdb.org/t/p/w500${hit.poster_path}`
    : null;

  const [videosRes, providersRes] = await Promise.all([
    fetch(
      `${API_URLS.TMDB_BASE}/movie/${hit.id}/videos?language=en-US&api_key=${apiKey}`,
      { next: { revalidate: 3600 } },
    ),
    fetch(
      `${API_URLS.TMDB_BASE}/movie/${hit.id}/watch/providers?api_key=${apiKey}`,
      { next: { revalidate: 21600 } },
    ),
  ]);

  const videos = videosRes.ok
    ? ((await videosRes.json()) as { results?: TmdbVideo[] }).results ?? []
    : [];

  const score = (v: TmdbVideo) => {
    if (v.site !== "YouTube") return -1;
    let s = 0;
    if (v.type === "Trailer") s += 4;
    else if (v.type === "Teaser") s += 2;
    if (v.official) s += 2;
    return s;
  };
  const best = [...videos]
    .map((v) => ({ v, s: score(v) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s)[0]?.v;

  let watchProviders: {
    region: string;
    link: string | null;
    flatrate: {
      id: number;
      name: string;
      logo: string | null;
      link: string | null;
    }[];
  } | null = null;
  if (providersRes.ok) {
    const json = (await providersRes.json()) as TmdbProvidersResponse;
    const regional = json.results?.[region];
    const flatrate = regional?.flatrate ?? [];
    if (flatrate.length > 0) {
      const tmdbLink = regional?.link ?? null;
      const titleForSearch = hit.title ?? title;
      watchProviders = {
        region,
        link: tmdbLink,
        flatrate: flatrate.map((p) => ({
          id: p.provider_id,
          name: p.provider_name,
          logo: p.logo_path ? `${TMDB_LOGO_BASE}${p.logo_path}` : null,
          link: buildProviderLink(p.provider_id, titleForSearch) ?? tmdbLink,
        })),
      };
    }
  }

  return {
    provider: "youtube" as const,
    youtubeKey: best?.key ?? null,
    name: best?.name ?? null,
    tmdbId: hit.id,
    posterUrl,
    overview: hit.overview ?? null,
    watchProviders,
  };
}

async function lookupBookCover(title: string, author: string | null) {
  const query = author ? `${title} ${author}` : title;
  const docs = await searchOpenLibraryDocs(query, 3);
  const hit = docs[0];
  if (!hit) return null;
  const posterUrl = hit.cover_i ? openLibraryCoverUrl(hit.cover_i, "L") : null;
  const infoLink = hit.key ? `${API_URLS.OPEN_LIBRARY_BASE}${hit.key}` : null;
  return {
    provider: "open-library" as const,
    workKey: hit.key ?? null,
    infoLink,
    posterUrl,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title")?.trim();
  const yearParam = searchParams.get("year");
  const type = searchParams.get("type");
  const author = searchParams.get("author")?.trim() || null;
  const region =
    searchParams.get("region")?.trim().toUpperCase().slice(0, 2) || "US";

  if (!title || (type !== "movie" && type !== "book")) {
    return NextResponse.json(
      { error: "Missing or invalid params" },
      { status: 400 },
    );
  }

  try {
    if (type === "movie") {
      const apiKey = process.env.TMDB_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ data: null }, { headers: cacheHeaders });
      }
      const year = yearParam ? Number(yearParam) : null;
      const data = await lookupMovieTrailer(
        title,
        Number.isFinite(year) ? year : null,
        region,
        apiKey,
      );
      return NextResponse.json({ data }, { headers: cacheHeaders });
    }

    const data = await lookupBookCover(title, author);
    return NextResponse.json({ data }, { headers: cacheHeaders });
  } catch (err) {
    console.error("trailer route error", err);
    return NextResponse.json({ data: null }, { headers: cacheHeaders });
  }
}
