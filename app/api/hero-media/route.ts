import { NextResponse } from "next/server";

type HeroMediaResponse = {
  books: string[];
  movies: string[];
  status: {
    books: "ok" | "fallback";
    movies: "ok" | "fallback";
  };
};

const BOOK_FALLBACKS = [
  "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=80",
];

const MOVIE_FALLBACKS = [
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1489599735734-79b4eece7e5f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=900&q=80",
];

const BOOK_QUERIES = [
  "subject:fiction",
  "subject:fantasy",
  "subject:mystery",
  "subject:science fiction",
  "subject:thriller",
  "subject:history",
];

const TMDB_ENDPOINTS = [
  "discover/movie?include_adult=false&include_video=false&language=en-US&sort_by=popularity.desc",
  "discover/tv?include_adult=false&include_null_first_air_dates=false&language=en-US&sort_by=popularity.desc",
];

const randomItem = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const shuffle = <T,>(items: T[]) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const normalizeBookCover = (url: string) =>
  url.replace("http://", "https://").replace("zoom=1", "zoom=2");

const pickPoster = (posterPath: string | null | undefined) =>
  posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null;

async function fetchBookCovers(apiKey: string): Promise<string[]> {
  const query = encodeURIComponent(randomItem(BOOK_QUERIES));
  const startIndex = Math.floor(Math.random() * 30);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&printType=books&orderBy=relevance&maxResults=20&startIndex=${startIndex}&key=${apiKey}`;

  const response = await fetch(url, { next: { revalidate: 0 } });
  if (!response.ok) {
    throw new Error(`Google Books error: ${response.status}`);
  }

  const data = (await response.json()) as { items?: any[] };
  const items = Array.isArray(data.items) ? data.items : [];

  const covers = items
    .map((item: any) => item?.volumeInfo?.imageLinks?.thumbnail || item?.volumeInfo?.imageLinks?.smallThumbnail)
    .filter((cover): cover is string => Boolean(cover))
    .map(normalizeBookCover);

  return shuffle(covers).slice(0, 4);
}

async function fetchMoviePosters(apiKey: string): Promise<string[]> {
  const endpoint = randomItem(TMDB_ENDPOINTS);
  const page = Math.floor(Math.random() * 4) + 1;
  const url = `https://api.themoviedb.org/3/${endpoint}&page=${page}&api_key=${apiKey}`;

  const response = await fetch(url, { next: { revalidate: 0 } });
  if (!response.ok) {
    throw new Error(`TMDB error: ${response.status}`);
  }

  const data = await response.json();
  const results = Array.isArray(data.results) ? data.results : [];

  const posters = results.map((item: any) => pickPoster(item?.poster_path)).filter(Boolean) as string[];

  return shuffle(posters).slice(0, 4);
}

export async function GET() {
  const tmdbKey = process.env.TMDB_API_KEY;
  const googleBooksKey = process.env.GOOGLE_BOOKS_API_KEY;

  const status: HeroMediaResponse["status"] = {
    books: "fallback",
    movies: "fallback",
  };

  const [booksResult, moviesResult] = await Promise.allSettled([
    googleBooksKey ? fetchBookCovers(googleBooksKey) : Promise.resolve([]),
    tmdbKey ? fetchMoviePosters(tmdbKey) : Promise.resolve([]),
  ]);

  const books =
    booksResult.status === "fulfilled" && booksResult.value.length > 0
      ? booksResult.value
      : BOOK_FALLBACKS;

  const movies =
    moviesResult.status === "fulfilled" && moviesResult.value.length > 0
      ? moviesResult.value
      : MOVIE_FALLBACKS;

  if (booksResult.status === "fulfilled" && booksResult.value.length > 0) {
    status.books = "ok";
  }

  if (moviesResult.status === "fulfilled" && moviesResult.value.length > 0) {
    status.movies = "ok";
  }

  const payload: HeroMediaResponse = {
    books: shuffle(books).slice(0, 4),
    movies: shuffle(movies).slice(0, 4),
    status,
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
