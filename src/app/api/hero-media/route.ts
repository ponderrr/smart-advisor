import { NextResponse } from "next/server";

type HeroMediaResponse = {
  books: string[];
  movies: string[];
  status: {
    books: "ok" | "error";
    movies: "ok" | "error";
  };
};

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

const uniqueUrls = (items: string[]) =>
  Array.from(new Set(items.filter(Boolean)));

const pickPoster = (posterPath: string | null | undefined) =>
  posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null;

async function fetchBookCovers(): Promise<string[]> {
  const selectedSubjects = pickRandomUnique(BOOK_SUBJECTS, 2);
  const offset = Math.floor(Math.random() * 30);

  const responses = await Promise.all(
    selectedSubjects.map(async (subject) => {
      const url = `https://openlibrary.org/subjects/${subject}.json?limit=20&offset=${offset}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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
          .filter((w: any) => w.cover_id && w.cover_id > 0)
          .map(
            (w: any) =>
              `https://covers.openlibrary.org/b/id/${w.cover_id}-M.jpg`,
          );
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
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
