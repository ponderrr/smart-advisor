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
    console.log("TMDB Proxy function called");

    // Check if request method is GET
    if (req.method !== "GET") {
      throw new Error("Method not allowed. Use GET.");
    }

    const url = new URL(req.url);
    const title = url.searchParams.get("title");

    if (!title || title.trim() === "") {
      console.log("Missing or empty title parameter");
      throw new Error("Title parameter is required and cannot be empty");
    }

    console.log("Searching for movie:", title);

    const tmdbApiKey = Deno.env.get("TMDB_API_KEY");
    if (!tmdbApiKey) {
      console.log("TMDB API key not configured, returning fallback data");
      // Return fallback data if API key not set
      return new Response(
        JSON.stringify({
          poster:
            "https://images.unsplash.com/photo-1489599731893-01139d4e6b5b?w=300&h=450&fit=crop",
          year: new Date().getFullYear(),
          rating: 7.5,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("TMDB API key found, making API call");

    const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(
      title.trim()
    )}&language=en-US&page=1`;

    const tmdbResponse = await fetch(tmdbUrl);

    console.log("TMDB API response status:", tmdbResponse.status);

    if (!tmdbResponse.ok) {
      console.log("TMDB API error:", tmdbResponse.status);
      throw new Error(`TMDB API error: ${tmdbResponse.status}`);
    }

    const data = await tmdbResponse.json();
    console.log(
      "TMDB API response received, results count:",
      data.results?.length || 0
    );

    if (data.results && data.results.length > 0) {
      const movie = data.results[0];
      console.log("Found movie:", movie.title);

      const result = {
        poster: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : "https://images.unsplash.com/photo-1489599731893-01139d4e6b5b?w=300&h=450&fit=crop",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : new Date().getFullYear(),
        rating: movie.vote_average
          ? Math.round(movie.vote_average * 10) / 10
          : 7.5,
      };

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("No movie results found, returning fallback");
    // No results found, return fallback
    return new Response(
      JSON.stringify({
        poster:
          "https://images.unsplash.com/photo-1489599731893-01139d4e6b5b?w=300&h=450&fit=crop",
        year: new Date().getFullYear(),
        rating: 7.5,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("TMDB Proxy error:", error);

    // Return fallback data on any error to ensure the app doesn't break
    return new Response(
      JSON.stringify({
        poster:
          "https://images.unsplash.com/photo-1489599731893-01139d4e6b5b?w=300&h=450&fit=crop",
        year: new Date().getFullYear(),
        rating: 7.5,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 200, // Return 200 with fallback data instead of error status
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
