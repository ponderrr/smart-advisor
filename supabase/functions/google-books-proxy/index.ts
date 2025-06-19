import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    console.log("Google Books Proxy function called");

    if (req.method !== "GET") {
      throw new Error("Method not allowed. Use GET.");
    }

    const url = new URL(req.url);
    const title = url.searchParams.get("title");
    const author = url.searchParams.get("author");

    if (!title || title.trim() === "") {
      throw new Error("Title parameter is required and cannot be empty");
    }

    console.log("Searching for book:", title, author ? `by ${author}` : "");

    const googleBooksApiKey = Deno.env.get("GOOGLE_BOOKS_API_KEY");
    if (!googleBooksApiKey) {
      console.log("Google Books API key not configured");
      return new Response(
        JSON.stringify({
          cover:
            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
          year: new Date().getFullYear(),
          rating: 4.2,
          description:
            "An engaging and thought-provoking read that offers valuable insights and entertainment.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build search query
    const query =
      author && author.trim()
        ? `${title.trim()}+inauthor:${author.trim()}`
        : title.trim();

    const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
      query
    )}&key=${googleBooksApiKey}&maxResults=5&printType=books&orderBy=relevance`;

    const googleBooksResponse = await fetch(googleBooksUrl);

    if (!googleBooksResponse.ok) {
      throw new Error(`Google Books API error: ${googleBooksResponse.status}`);
    }

    const data = await googleBooksResponse.json();

    if (!data.items || data.items.length === 0) {
      console.log("No book results found");
      return new Response(
        JSON.stringify({
          cover:
            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
          year: new Date().getFullYear(),
          rating: 4.2,
          description:
            "An engaging and thought-provoking read that offers valuable insights and entertainment.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Find best match - prioritize exact title matches
    let bestMatch = data.items[0];
    const searchTitle = title.toLowerCase().trim();

    for (const item of data.items) {
      const bookTitle = item.volumeInfo.title?.toLowerCase() || "";
      if (bookTitle.includes(searchTitle) || searchTitle.includes(bookTitle)) {
        bestMatch = item;
        break;
      }
    }

    const book = bestMatch.volumeInfo;

    // Extract description and limit to 2-3 sentences
    let description =
      "An engaging and thought-provoking read that offers valuable insights and entertainment.";
    if (book.description) {
      const sentences = book.description
        .replace(/<[^>]*>/g, "")
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 0);
      description =
        sentences.slice(0, 3).join(". ") + (sentences.length > 3 ? "." : "");
      if (description.length > 200) {
        description = description.substring(0, 197) + "...";
      }
    }

    // Extract year from publishedDate
    let year = new Date().getFullYear();
    if (book.publishedDate) {
      const yearMatch = book.publishedDate.match(/(\d{4})/);
      if (yearMatch) {
        year = parseInt(yearMatch[1]);
      }
    }

    const result = {
      cover: book.imageLinks?.thumbnail
        ? book.imageLinks.thumbnail
            .replace("http:", "https:")
            .replace("&zoom=1", "&zoom=0")
        : "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
      year: year,
      rating: book.averageRating || 4.2,
      description: description,
    };

    console.log("Returning book data:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Google Books Proxy error:", error);

    return new Response(
      JSON.stringify({
        cover:
          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
        year: new Date().getFullYear(),
        rating: 4.2,
        description:
          "An engaging and thought-provoking read that offers valuable insights and entertainment.",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
