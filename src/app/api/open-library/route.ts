import { NextRequest, NextResponse } from "next/server";

type BookProxyResponse = {
  cover: string;
  year: number;
  rating: number;
  description: string;
  openLibraryUrl: string | null;
};

interface OpenLibraryDoc {
  cover_i?: number;
  title?: string;
  first_publish_year?: number;
  author_name?: string[];
  key?: string;
  ratings_average?: number;
  first_sentence?: string[];
}

const DEFAULT_BOOK: BookProxyResponse = {
  cover:
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
  year: new Date().getFullYear(),
  rating: 0,
  description:
    "An engaging and thought-provoking read that offers valuable insights and entertainment.",
  openLibraryUrl: null,
};

const parseDescription = (raw?: string) => {
  if (!raw) return DEFAULT_BOOK.description;
  // Strip Markdown link syntax and HTML tags but keep the full text — let
  // the UI line-clamp it as needed instead of truncating at the source.
  const cleaned = raw
    .replace(/<[^>]*>/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
  return cleaned || DEFAULT_BOOK.description;
};

// Simple in-memory cache (per-serverless-instance)
const cache = new Map<string, { data: BookProxyResponse; expiry: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

const MAX_QUERY_LEN = 200;

export async function GET(req: NextRequest) {
  try {
    const title = req.nextUrl.searchParams.get("title")?.trim();
    const author = req.nextUrl.searchParams.get("author")?.trim();

    if (!title) {
      return NextResponse.json(DEFAULT_BOOK);
    }
    if (title.length > MAX_QUERY_LEN || (author && author.length > MAX_QUERY_LEN)) {
      return NextResponse.json(DEFAULT_BOOK);
    }

    const cacheKey = `${title}|${author || ""}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return NextResponse.json(cached.data);
    }

    // Build Open Library search query
    const queryParts = [title];
    if (author) queryParts.push(author);
    const query = queryParts.join(" ");

    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&fields=key,title,author_name,first_publish_year,cover_i,number_of_pages_median,edition_count,isbn,subject`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(DEFAULT_BOOK);
    }

    const data = await response.json();
    const docs = Array.isArray(data?.docs) ? data.docs : [];

    // Only include books with covers
    const withCovers = docs.filter(
      (doc: OpenLibraryDoc) => doc.cover_i && doc.cover_i > 0,
    );

    if (withCovers.length === 0) {
      return NextResponse.json(DEFAULT_BOOK);
    }

    // Find best match — prioritize exact title match
    const searchTitle = title.toLowerCase();
    let best = withCovers[0];
    for (const doc of withCovers) {
      const docTitle = (doc.title || "").toLowerCase();
      if (
        docTitle === searchTitle ||
        docTitle.includes(searchTitle) ||
        searchTitle.includes(docTitle)
      ) {
        best = doc;
        break;
      }
    }

    const coverId = best.cover_i;
    const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
    const workKey = best.key || "";
    const openLibraryUrl = workKey ? `https://openlibrary.org${workKey}` : null;

    // Try to fetch work description
    let description = DEFAULT_BOOK.description;
    if (workKey) {
      try {
        const workController = new AbortController();
        const workTimeout = setTimeout(() => workController.abort(), 4000);
        const workRes = await fetch(`https://openlibrary.org${workKey}.json`, {
          signal: workController.signal,
          cache: "no-store",
        });
        clearTimeout(workTimeout);

        if (workRes.ok) {
          const workData = await workRes.json();
          const rawDesc =
            typeof workData.description === "string"
              ? workData.description
              : workData.description?.value || "";
          if (rawDesc) {
            description = parseDescription(rawDesc);
          }
        }
      } catch {
        // Description fetch is non-critical
      }
    }

    const payload: BookProxyResponse = {
      cover: coverUrl,
      year: best.first_publish_year || DEFAULT_BOOK.year,
      rating: 0, // Open Library doesn't provide ratings
      description,
      openLibraryUrl,
    };

    cache.set(cacheKey, { data: payload, expiry: Date.now() + CACHE_TTL });

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(DEFAULT_BOOK);
  }
}
