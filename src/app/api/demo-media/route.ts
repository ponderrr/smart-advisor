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

async function fetchBooks(query: string, apiKey: string, limit: number): Promise<DemoItem[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
    query,
  )}&printType=books&orderBy=relevance&maxResults=${Math.max(limit, 6)}&key=${apiKey}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Books error ${response.status}`);
  const data = await response.json();
  const items = Array.isArray(data.items) ? data.items : [];
  return items
    .map((item: any): DemoItem | null => {
      const info = item?.volumeInfo;
      const thumb = info?.imageLinks?.thumbnail || info?.imageLinks?.smallThumbnail;
      if (!info?.title || !thumb) return null;
      return {
        id: item.id || crypto.randomUUID(),
        type: "book",
        title: info.title,
        subtitle: Array.isArray(info.authors) ? info.authors.join(", ") : "Unknown author",
        description: sanitize(info.description || "No description available."),
        image: thumb.replace("http://", "https://").replace("zoom=1", "zoom=2"),
        infoLink: info.infoLink || "https://books.google.com",
      };
    })
    .filter((item: DemoItem | null): item is DemoItem => Boolean(item))
    .slice(0, limit);
}

async function fetchMovies(query: string, apiKey: string, limit: number): Promise<DemoItem[]> {
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
        subtitle: item.release_date ? String(item.release_date).slice(0, 4) : "Movie",
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

  const booksKey = process.env.GOOGLE_BOOKS_API_KEY;
  const tmdbKey = process.env.TMDB_API_KEY;

  try {
    const targetPerType = contentType === "both" ? 3 : 6;
    const tasks: Promise<DemoItem[]>[] = [];
    if (contentType === "book" || contentType === "both") {
      if (booksKey) tasks.push(fetchBooks(query, booksKey, targetPerType));
    }
    if (contentType === "movie" || contentType === "both") {
      if (tmdbKey) tasks.push(fetchMovies(query, tmdbKey, targetPerType));
    }

    const results = await Promise.allSettled(tasks);
    const fulfilled = results
      .filter((result): result is PromiseFulfilledResult<DemoItem[]> => result.status === "fulfilled")
      .map((result) => result.value);

    const merged = (() => {
      if (contentType !== "both") return fulfilled.flat().slice(0, 6);
      const books = fulfilled.find((set) => set[0]?.type === "book") || [];
      const movies = fulfilled.find((set) => set[0]?.type === "movie") || [];
      const interleaved: DemoItem[] = [];
      const max = Math.max(Math.min(books.length, 3), Math.min(movies.length, 3));
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
