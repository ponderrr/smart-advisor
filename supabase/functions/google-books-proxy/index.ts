import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Google Books Proxy function called");

    // Check if request method is GET
    if (req.method !== "GET") {
      throw new Error("Method not allowed. Use GET.");
    }

    const url = new URL(req.url);
    const title = url.searchParams.get("title");
    const author = url.searchParams.get("author");

    if (!title || title.trim() === "") {
      console.log("Missing or empty title parameter");
      throw new Error("Title parameter is required and cannot be empty");
    }

    console.log("Searching for book:", title, author ? `by ${author}` : "");

    const googleBooksApiKey = Deno.env.get("GOOGLE_BOOKS_API_KEY");
    if (!googleBooksApiKey) {
      console.log(
        "Google Books API key not configured, returning fallback data"
      );
      // Return fallback data if API key not set
      return new Response(
        JSON.stringify({
          cover:
            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=450&fit=crop",
          year: new Date().getFullYear(),
          rating: 4.2,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Google Books API key found, making API call");

    // Build search query
    const query =
      author && author.trim()
        ? `${title.trim()}+inauthor:${author.trim()}`
        : title.trim();

    const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
      query
    )}&key=${googleBooksApiKey}&maxResults=1&printType=books&orderBy=relevance`;

    const googleBooksResponse = await fetch(googleBooksUrl);

    console.log(
      "Google Books API response status:",
      googleBooksResponse.status
    );

    if (!googleBooksResponse.ok) {
      console.log("Google Books API error:", googleBooksResponse.status);
      throw new Error(`Google Books API error: ${googleBooksResponse.status}`);
    }

    const data = await googleBooksResponse.json();
    console.log(
      "Google Books API response received, results count:",
      data.totalItems || 0
    );

    if (data.items && data.items.length > 0) {
      const book = data.items[0].volumeInfo;
      console.log("Found book:", book.title);

      const result = {
        cover: book.imageLinks?.thumbnail
          ? book.imageLinks.thumbnail
              .replace("http:", "https:")
              .replace("&zoom=1", "&zoom=2") // Get higher resolution image
          : "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=450&fit=crop",
        year: book.publishedDate
          ? new Date(book.publishedDate).getFullYear()
          : new Date().getFullYear(),
        rating: book.averageRating || 4.2,
      };

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("No book results found, returning fallback");
    // No results found, return fallback
    return new Response(
      JSON.stringify({
        cover:
          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=450&fit=crop",
        year: new Date().getFullYear(),
        rating: 4.2,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Google Books Proxy error:", error);

    // Return fallback data on any error to ensure the app doesn't break
    return new Response(
      JSON.stringify({
        cover:
          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=450&fit=crop",
        year: new Date().getFullYear(),
        rating: 4.2,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 200, // Return 200 with fallback data instead of error status
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
