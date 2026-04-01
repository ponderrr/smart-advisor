import { NextResponse } from "next/server";
import { openLibraryCoverUrl, tmdbPosterUrl } from "@/lib/api-helpers";
import { API_URLS, FETCH_TIMEOUT_MS } from "@/lib/constants";

type HeroMediaResponse = {
  books: string[];
  movies: string[];
  status: {
    books: "ok" | "error";
    movies: "ok" | "error";
  };
};

interface OpenLibraryWork {
  cover_id?: number;
  title?: string;
  key?: string;
}

interface TMDBResult {
  poster_path?: string;
  id?: number;
}

const BOOK_SUBJECTS = [
  "fiction",
  "fantasy",
  "mystery",
  "science_fiction",
  "thriller",
  "history",
  "romance",
  "adventure",
];

const TMDB_ENDPOINTS = [
  "discover/movie?include_adult=false&include_video=false&language=en-US&sort_by=popularity.desc",
  "discover/tv?include_adult=false&include_null_first_air_dates=false&language=en-US&sort_by=popularity.desc",
];

const pickRandomUnique = <T>(items: T[], count: number) => {
  const copy = [...items];
  const picked: T[] = [];
  while (copy.length > 0 && picked.length < count) {
    const index = Math.floor(Math.random() * copy.length);
    const [value] = copy.splice(index, 1);
    picked.push(value);
  }
  return picked;
};

const shuffle = <T>(items: T[]) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const uniqueUrls = (items: string[]) =>
  Array.from(new Set(items.filter(Boolean)));

async function fetchBookCovers(): Promise<string[]> {
  const selectedSubjects = pickRandomUnique(BOOK_SUBJECTS, 2);
  const offset = Math.floor(Math.random() * 30);

  const responses = await Promise.all(
    selectedSubjects.map(async (subject) => {
      const url = `${API_URLS.OPEN_LIBRARY_SUBJECTS}/${subject}.json?limit=20&offset=${offset}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          next: { revalidate: 0 },
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          return [];
        }

        const data = await response.json();
        const works = Array.isArray(data?.works) ? data.works : [];

        return works
          .filter((w: OpenLibraryWork) => w.cover_id && w.cover_id > 0)
          .map((w: OpenLibraryWork) => openLibraryCoverUrl(w.cover_id!, "M"));
      } catch {
        clearTimeout(timeoutId);
        return [];
      }
    }),
  );

  return shuffle(uniqueUrls(responses.flat())).slice(0, 10);
}

async function fetchMoviePosters(apiKey: string): Promise<string[]> {
  const selectedEndpoints = pickRandomUnique(TMDB_ENDPOINTS, 2);
  const responses = await Promise.all(
    selectedEndpoints.map(async (endpoint) => {
      const page = Math.floor(Math.random() * 18) + 1;
      const url = `${API_URLS.TMDB_BASE}/${endpoint}&page=${page}&api_key=${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          next: { revalidate: 0 },
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
          return [];
        }
        const data = await response.json();
        return Array.isArray(data.results) ? data.results : [];
      } catch {
        clearTimeout(timeoutId);
        return [];
      }
    }),
  );

  const posters = responses
    .flat()
    .map((item: TMDBResult) =>
      item?.poster_path ? tmdbPosterUrl(item.poster_path) : null,
    )
    .filter(Boolean) as string[];

  return shuffle(uniqueUrls(posters)).slice(0, 10);
}

export async function GET() {
  const tmdbKey = process.env.TMDB_API_KEY;

  const status: HeroMediaResponse["status"] = {
    books: "error",
    movies: "error",
  };

  const [booksResult, moviesResult] = await Promise.allSettled([
    fetchBookCovers(),
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
      "Cache-Control":
        "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
