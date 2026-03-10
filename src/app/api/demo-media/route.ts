import { NextRequest, NextResponse } from "next/server";

type DemoItem = {
  id: string;
  type: "book" | "movie";
  title: string;
  subtitle: string;
  description: string;
  image: string;
  infoLink: string;
};

const sanitize = (text: string) => text.replace(/<[^>]*>/g, "").trim();

async function fetchBooks(query: string, limit: number): Promise<DemoItem[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
    query,
  )}&limit=${Math.max(limit * 2, 12)}&fields=key,title,author_name,first_publish_year,cover_i,number_of_pages_median`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`Open Library error ${response.status}`);
    const data = await response.json();
    const docs = Array.isArray(data.docs) ? data.docs : [];
    return docs
      .filter((doc: any) => doc.cover_i && doc.title)
      .map(
        (doc: any): DemoItem => ({
          id: doc.key || crypto.randomUUID(),
          type: "book",
          title: doc.title,
          subtitle: Array.isArray(doc.author_name)
            ? doc.author_name.join(", ")
            : "Unknown author",
          description: doc.first_publish_year
            ? `First published in ${doc.first_publish_year}${doc.number_of_pages_median ? ` · ${doc.number_of_pages_median} pages` : ""}`
            : "No description available.",
          image: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
          infoLink: `https://openlibrary.org${doc.key}`,
        }),
      )
      .slice(0, limit);
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

async function fetchMovies(
  query: string,
  apiKey: string,
  limit: number,
): Promise<DemoItem[]> {
  const searchUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
    query,
  )}&include_adult=false&language=en-US&page=1&api_key=${apiKey}`;
  const response = await fetch(searchUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`TMDB error ${response.status}`);
  const data = await response.json();
  let items = Array.isArray(data.results) ? data.results : [];

  if (items.length === 0) {
    const discoverUrl = `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&sort_by=popularity.desc&page=1&api_key=${apiKey}`;
    const discoverResponse = await fetch(discoverUrl, { cache: "no-store" });
    if (discoverResponse.ok) {
      const discoverData = await discoverResponse.json();
      items = Array.isArray(discoverData.results) ? discoverData.results : [];
    }
  }

  return items
    .map((item: any): DemoItem | null => {
      const poster = item?.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null;
      if (!item?.title || !poster) return null;
      return {
        id: String(item.id),
        type: "movie",
        title: item.title,
        subtitle: item.release_date
          ? String(item.release_date).slice(0, 4)
          : "Movie",
        description: sanitize(item.overview || "No description available."),
        image: poster,
        infoLink: `https://www.themoviedb.org/movie/${item.id}`,
      };
    })
    .filter((item: DemoItem | null): item is DemoItem => Boolean(item))
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
