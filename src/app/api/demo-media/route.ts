import { NextRequest, NextResponse } from "next/server";
import {
  searchOpenLibraryDocs,
  openLibraryCoverUrl,
  searchTmdbMovies,
  discoverTmdbMovies,
  tmdbPosterUrl,
  tmdbWebUrl,
  sanitizeHtml,
  type TmdbMovieResult,
} from "@/lib/api-helpers";
import { API_URLS } from "@/lib/constants";

type DemoItem = {
  id: string;
  type: "book" | "movie";
  title: string;
  subtitle: string;
  description: string;
  image: string;
  infoLink: string;
};

async function fetchBooks(query: string, limit: number): Promise<DemoItem[]> {
  const docs = await searchOpenLibraryDocs(query, limit);
  return docs
    .map(
      (doc): DemoItem => ({
        id: doc.key || crypto.randomUUID(),
        type: "book",
        title: doc.title!,
        subtitle: Array.isArray(doc.author_name)
          ? doc.author_name.join(", ")
          : "Unknown author",
        description: doc.first_publish_year
          ? `First published in ${doc.first_publish_year}${doc.number_of_pages_median ? ` · ${doc.number_of_pages_median} pages` : ""}`
          : "No description available.",
        image: openLibraryCoverUrl(doc.cover_i!),
        infoLink: `${API_URLS.OPEN_LIBRARY_BASE}${doc.key}`,
      }),
    )
    .slice(0, limit);
}

async function fetchMovies(
  query: string,
  apiKey: string,
  limit: number,
): Promise<DemoItem[]> {
  let items: TmdbMovieResult[] = await searchTmdbMovies(query, apiKey);

  if (items.length === 0) {
    items = await discoverTmdbMovies(apiKey);
  }

  return items
    .map((item): DemoItem | null => {
      const poster = item?.poster_path
        ? tmdbPosterUrl(item.poster_path)
        : null;
      if (!item?.title || !poster) return null;
      return {
        id: String(item.id),
        type: "movie",
        title: item.title,
        subtitle: item.release_date
          ? String(item.release_date).slice(0, 4)
          : "Movie",
        description: sanitizeHtml(item.overview || "No description available."),
        image: poster,
        infoLink: tmdbWebUrl(item.id),
      };
    })
    .filter((item): item is DemoItem => Boolean(item))
    .slice(0, limit);
}

export async function GET(request: NextRequest) {
  const contentType = request.nextUrl.searchParams.get("type") || "both";
  const query = request.nextUrl.searchParams.get("q") || "best recommendations";

  const tmdbKey = process.env.TMDB_API_KEY;

  try {
    const targetPerType = contentType === "both" ? 3 : 6;
    const tasks: Promise<DemoItem[]>[] = [];
    if (contentType === "book" || contentType === "both") {
      tasks.push(fetchBooks(query, targetPerType));
    }
    if (contentType === "movie" || contentType === "both") {
      if (tmdbKey) tasks.push(fetchMovies(query, tmdbKey, targetPerType));
    }

    const results = await Promise.allSettled(tasks);
    const fulfilled = results
      .filter(
        (result): result is PromiseFulfilledResult<DemoItem[]> =>
          result.status === "fulfilled",
      )
      .map((result) => result.value);

    const merged = (() => {
      if (contentType !== "both") return fulfilled.flat().slice(0, 6);
      const books = fulfilled.find((set) => set[0]?.type === "book") || [];
      const movies = fulfilled.find((set) => set[0]?.type === "movie") || [];
      const interleaved: DemoItem[] = [];
      const max = Math.max(
        Math.min(books.length, 3),
        Math.min(movies.length, 3),
      );
      for (let i = 0; i < max; i += 1) {
        if (movies[i]) interleaved.push(movies[i]);
        if (books[i]) interleaved.push(books[i]);
      }
      return interleaved.slice(0, 6);
    })();

    return NextResponse.json({ items: merged }, { status: 200 });
  } catch (error) {
    console.error("Demo media fetch failed:", error);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
