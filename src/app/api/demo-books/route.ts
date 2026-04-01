import { NextRequest, NextResponse } from "next/server";
import {
  searchOpenLibraryDocs,
  openLibraryCoverUrl,
} from "@/lib/api-helpers";
import { API_URLS } from "@/lib/constants";

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
    const docs = await searchOpenLibraryDocs(q, 6);

    const books: DemoBook[] = docs
      .map(
        (doc): DemoBook => ({
          id: doc.key || crypto.randomUUID(),
          title: doc.title!,
          authors: Array.isArray(doc.author_name)
            ? doc.author_name.join(", ")
            : "Unknown author",
          description: doc.first_publish_year
            ? `First published in ${doc.first_publish_year}${doc.number_of_pages_median ? ` · ${doc.number_of_pages_median} pages` : ""}`
            : "No description available yet.",
          cover: openLibraryCoverUrl(doc.cover_i!),
          infoLink: `${API_URLS.OPEN_LIBRARY_BASE}${doc.key}`,
        }),
      )
      .slice(0, 6);

    return NextResponse.json({ books }, { status: 200 });
  } catch (error) {
    console.error("Demo books API failed:", error);
    return NextResponse.json({ books: [] }, { status: 200 });
  }
}
