import { NextRequest, NextResponse } from "next/server";

type BookProxyResponse = {
  cover: string;
  year: number;
  rating: number;
  description: string;
};

const DEFAULT_BOOK: BookProxyResponse = {
  cover:
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
  year: new Date().getFullYear(),
  rating: 4.2,
  description:
    "An engaging and thought-provoking read that offers valuable insights and entertainment.",
};

const parseDescription = (raw?: string) => {
  if (!raw) return DEFAULT_BOOK.description;
  const cleaned = raw.replace(/<[^>]*>/g, "");
  const sentences = cleaned
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return DEFAULT_BOOK.description;
  const candidate =
    sentences.slice(0, 3).join(". ") + (sentences.length > 3 ? "." : "");
  return candidate.length > 220 ? `${candidate.slice(0, 217)}...` : candidate;
};

const parseYear = (publishedDate?: string) => {
  if (!publishedDate) return DEFAULT_BOOK.year;
  const match = publishedDate.match(/(\d{4})/);
  if (!match) return DEFAULT_BOOK.year;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : DEFAULT_BOOK.year;
};

const runGoogleBooksRequest = async (query: string, key?: string) => {
  const keyParam = key ? `&key=${encodeURIComponent(key)}` : "";
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
    query,
  )}&printType=books&orderBy=relevance&maxResults=5${keyParam}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.status}`);
  }
  return response.json();
};

export async function GET(req: NextRequest) {
  try {
    const title = req.nextUrl.searchParams.get("title")?.trim();
    const author = req.nextUrl.searchParams.get("author")?.trim();

    if (!title) {
      return NextResponse.json(DEFAULT_BOOK);
    }

    const query = author ? `${title} inauthor:${author}` : title;
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

    let data: any;
    try {
      data = await runGoogleBooksRequest(query, apiKey);
    } catch {
      // Retry without key in case key restrictions are blocking local/dev usage.
      data = await runGoogleBooksRequest(query);
    }

    const items = Array.isArray(data?.items) ? data.items : [];
    if (items.length === 0) {
      return NextResponse.json(DEFAULT_BOOK);
    }

    const best = items[0]?.volumeInfo ?? {};
    const cover =
      (best.imageLinks?.thumbnail || best.imageLinks?.smallThumbnail || "")
        .replace("http://", "https://")
        .replace("zoom=1", "zoom=2") || DEFAULT_BOOK.cover;

    const payload: BookProxyResponse = {
      cover,
      year: parseYear(best.publishedDate),
      rating: best.averageRating || DEFAULT_BOOK.rating,
      description: parseDescription(best.description),
    };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(DEFAULT_BOOK);
  }
}
