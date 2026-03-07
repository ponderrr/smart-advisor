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

const pickRandomUnique = <T,>(items: T[], count: number) => {
  const copy = [...items];
  const picked: T[] = [];
  while (copy.length > 0 && picked.length < count) {
    const index = Math.floor(Math.random() * copy.length);
    const [value] = copy.splice(index, 1);
    picked.push(value);
  }
  return picked;
};

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

async function fetchBookCovers(apiKey?: string): Promise<string[]> {
  const selectedQueries = pickRandomUnique(BOOK_QUERIES, 2);
  const responses = await Promise.all(
    selectedQueries.map(async (query) => {
      const encodedQuery = encodeURIComponent(query);
      const startIndex = Math.floor(Math.random() * 35);
      const keyParam = apiKey ? `&key=${encodeURIComponent(apiKey)}` : "";
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&printType=books&orderBy=relevance&maxResults=20&startIndex=${startIndex}${keyParam}`;

      let response = await fetch(url, { next: { revalidate: 0 } });
      if (!response.ok && apiKey) {
        // Retry without key in case key restrictions block local calls.
        const fallbackUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&printType=books&orderBy=relevance&maxResults=20&startIndex=${startIndex}`;
        response = await fetch(fallbackUrl, { next: { revalidate: 0 } });
      }
      if (!response.ok) {
        throw new Error(`Google Books error: ${response.status}`);
      }
      const data = (await response.json()) as { items?: any[] };
      return Array.isArray(data.items) ? data.items : [];
    }),
  );

  const covers = responses
    .flat()
    .map((item: any) => item?.volumeInfo?.imageLinks?.thumbnail || item?.volumeInfo?.imageLinks?.smallThumbnail)
    .filter((cover): cover is string => Boolean(cover))
    .map(normalizeBookCover);

  return shuffle(uniqueUrls(covers)).slice(0, 10);
}

async function fetchMoviePosters(apiKey: string): Promise<string[]> {
  const selectedEndpoints = pickRandomUnique(TMDB_ENDPOINTS, 2);
  const responses = await Promise.all(
    selectedEndpoints.map(async (endpoint) => {
      const page = Math.floor(Math.random() * 18) + 1;
      const url = `https://api.themoviedb.org/3/${endpoint}&page=${page}&api_key=${apiKey}`;
      const response = await fetch(url, { next: { revalidate: 0 } });
      if (!response.ok) {
        throw new Error(`TMDB error: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data.results) ? data.results : [];
    }),
  );

  const posters = responses
    .flat()
    .map((item: any) => pickPoster(item?.poster_path))
    .filter(Boolean) as string[];

  return shuffle(uniqueUrls(posters)).slice(0, 10);
}

export async function GET() {
  const tmdbKey = process.env.TMDB_API_KEY;
  const googleBooksKey = process.env.GOOGLE_BOOKS_API_KEY;

  const status: HeroMediaResponse["status"] = {
    books: "error",
    movies: "error",
  };

  const [booksResult, moviesResult] = await Promise.allSettled([
    fetchBookCovers(googleBooksKey),
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
    books: shuffle(books).slice(0, 12),
    movies: shuffle(movies).slice(0, 12),
    status,
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
