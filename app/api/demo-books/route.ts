import { NextRequest, NextResponse } from "next/server";

type DemoBook = {
  id: string;
  title: string;
  authors: string;
  description: string;
  cover: string;
  infoLink: string;
};

const FALLBACK_BOOKS: DemoBook[] = [
  {
    id: "fallback-1",
    title: "Project Hail Mary",
    authors: "Andy Weir",
    description:
      "A science-driven survival story with humor, pace, and high-stakes problem solving.",
    cover: "https://books.google.com/books/content?id=ZkAqEAAAQBAJ&printsec=frontcover&img=1&zoom=2&source=gbs_api",
    infoLink: "https://books.google.com",
  },
  {
    id: "fallback-2",
    title: "The Night Circus",
    authors: "Erin Morgenstern",
    description:
      "A dreamy, atmospheric fantasy centered on rivalry, magic, and wonder.",
    cover: "https://books.google.com/books/content?id=7Qf6mAEACAAJ&printsec=frontcover&img=1&zoom=2&source=gbs_api",
    infoLink: "https://books.google.com",
  },
  {
    id: "fallback-3",
    title: "The Silent Patient",
    authors: "Alex Michaelides",
    description:
      "A psychological thriller with a tight structure and escalating tension.",
    cover: "https://books.google.com/books/content?id=2ONrDwAAQBAJ&printsec=frontcover&img=1&zoom=2&source=gbs_api",
    infoLink: "https://books.google.com",
  },
];

const normalizeDescription = (description: string) => {
  return description.replace(/<[^>]*>/g, "").trim();
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "best fiction books";
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ books: FALLBACK_BOOKS }, { status: 200 });
  }

  try {
    const query = encodeURIComponent(q);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&printType=books&orderBy=relevance&maxResults=8&key=${apiKey}`;
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Google Books request failed: ${response.status}`);
    }

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];

    const books: DemoBook[] = items
      .map((item: any): DemoBook | null => {
        const info = item?.volumeInfo;
        const image =
          info?.imageLinks?.thumbnail ||
          info?.imageLinks?.smallThumbnail ||
          "";
        if (!info?.title || !image) return null;

        return {
          id: item.id || crypto.randomUUID(),
          title: info.title,
          authors: Array.isArray(info.authors) ? info.authors.join(", ") : "Unknown author",
          description: normalizeDescription(info.description || "No description available yet."),
          cover: image.replace("http://", "https://").replace("zoom=1", "zoom=2"),
          infoLink: info.infoLink || "https://books.google.com",
        };
      })
      .filter((book: DemoBook | null): book is DemoBook => Boolean(book))
      .slice(0, 6);

    return NextResponse.json(
      { books: books.length > 0 ? books : FALLBACK_BOOKS },
      { status: 200 },
    );
  } catch (error) {
    console.error("Demo books API failed:", error);
    return NextResponse.json({ books: FALLBACK_BOOKS }, { status: 200 });
  }
}
