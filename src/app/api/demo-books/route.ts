import { NextRequest, NextResponse } from "next/server";

type DemoBook = {
  id: string;
  title: string;
  authors: string;
  description: string;
  cover: string;
  infoLink: string;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "best fiction books";

  try {
    const query = encodeURIComponent(q);
    const url = `https://openlibrary.org/search.json?q=${query}&limit=16&fields=key,title,author_name,first_publish_year,cover_i,number_of_pages_median`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Open Library request failed: ${response.status}`);
    }

    const data = await response.json();
    const docs = Array.isArray(data.docs) ? data.docs : [];

    const books: DemoBook[] = docs
      .filter((doc: any) => doc.cover_i && doc.title)
      .map(
        (doc: any): DemoBook => ({
          id: doc.key || crypto.randomUUID(),
          title: doc.title,
          authors: Array.isArray(doc.author_name)
            ? doc.author_name.join(", ")
            : "Unknown author",
          description: doc.first_publish_year
            ? `First published in ${doc.first_publish_year}${doc.number_of_pages_median ? ` · ${doc.number_of_pages_median} pages` : ""}`
            : "No description available yet.",
          cover: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
          infoLink: `https://openlibrary.org${doc.key}`,
        }),
      )
      .slice(0, 6);

    return NextResponse.json({ books }, { status: 200 });
  } catch (error) {
    console.error("Demo books API failed:", error);
    return NextResponse.json({ books: [] }, { status: 200 });
  }
}
