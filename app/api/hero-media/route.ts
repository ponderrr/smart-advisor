import { NextResponse } from "next/server";

type HeroMediaResponse = {
  books: string[];
  movies: string[];
  status: {
    books: "ok" | "error";
    movies: "ok" | "error";
  };
};

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

const uniqueUrls = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

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

  return shuffle(uniqueUrls(covers)).slice(0, 6);
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

  return shuffle(uniqueUrls(posters)).slice(0, 6);
}

export async function GET() {
  const tmdbKey = process.env.TMDB_API_KEY;
  const googleBooksKey = process.env.GOOGLE_BOOKS_API_KEY;

  const status: HeroMediaResponse["status"] = {
    books: "error",
    movies: "error",
  };

  const [booksResult, moviesResult] = await Promise.allSettled([
    googleBooksKey ? fetchBookCovers(googleBooksKey) : Promise.resolve([]),
    tmdbKey ? fetchMoviePosters(tmdbKey) : Promise.resolve([]),
  ]);

  const books =
    booksResult.status === "fulfilled" && booksResult.value.length > 0
      ? uniqueUrls(booksResult.value)
      : [];

  const movies =
    moviesResult.status === "fulfilled" && moviesResult.value.length > 0
      ? uniqueUrls(moviesResult.value)
      : [];

  if (booksResult.status === "fulfilled" && booksResult.value.length > 0) {
    status.books = "ok";
  }

  if (moviesResult.status === "fulfilled" && moviesResult.value.length > 0) {
    status.movies = "ok";
  }

  const payload: HeroMediaResponse = {
    books: shuffle(books).slice(0, 8),
    movies: shuffle(movies).slice(0, 8),
    status,
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
