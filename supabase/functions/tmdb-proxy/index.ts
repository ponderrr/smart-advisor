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
    console.log("TMDB Proxy function called");

    if (req.method !== "GET") {
      throw new Error("Method not allowed. Use GET.");
    }

    const url = new URL(req.url);
    const title = url.searchParams.get("title");

    if (!title || title.trim() === "") {
      throw new Error("Title parameter is required and cannot be empty");
    }

    console.log("Searching for movie:", title);

    const tmdbApiKey = Deno.env.get("TMDB_API_KEY");
    if (!tmdbApiKey) {
      console.log("TMDB API key not configured");
      return new Response(
        JSON.stringify({
          poster:
            "https://images.unsplash.com/photo-1489599731893-01139d4e6b5b?w=500&h=750&fit=crop",
          year: new Date().getFullYear(),
          rating: 7.5,
          description:
            "A captivating story that will keep you entertained from start to finish.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Search for movie
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(
      title.trim()
    )}&language=en-US&page=1`;
    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      throw new Error(`TMDB search error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    if (!searchData.results || searchData.results.length === 0) {
      console.log("No movie results found");
      return new Response(
        JSON.stringify({
          poster:
            "https://images.unsplash.com/photo-1489599731893-01139d4e6b5b?w=500&h=750&fit=crop",
          year: new Date().getFullYear(),
          rating: 7.5,
          description:
            "A captivating story that will keep you entertained from start to finish.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const movie = searchData.results[0];

    // Get detailed movie info — description, genres, and the director
    // (credits.crew) in a single request via append_to_response.
    const detailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${tmdbApiKey}&language=en-US&append_to_response=credits`;
    const detailsResponse = await fetch(detailsUrl);

    let description =
      "A captivating story that will keep you entertained from start to finish.";
    let genres: string[] = [];
    let director = "";

    if (detailsResponse.ok) {
      const detailsData = await detailsResponse.json();
      if (detailsData.overview && detailsData.overview.length > 0) {
        // Truncate to 2-3 sentences
        const sentences = detailsData.overview
          .split(/[.!?]+/)
          .filter((s: string) => s.trim().length > 0);
        description =
          sentences.slice(0, 3).join(". ") + (sentences.length > 3 ? "." : "");
        if (description.length > 200) {
          description = description.substring(0, 197) + "...";
        }
      }
      if (Array.isArray(detailsData.genres)) {
        genres = detailsData.genres.map((g: { name: string }) => g.name);
      }
      const crew = detailsData.credits?.crew;
      if (Array.isArray(crew)) {
        const dir = crew.find(
          (c: { job: string; name: string }) => c.job === "Director",
        );
        if (dir?.name) director = dir.name;
      }
    }

    // Best-effort YouTube trailer.
    let trailer: string | null = null;
    try {
      const vidRes = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${tmdbApiKey}&language=en-US`,
      );
      if (vidRes.ok) {
        const vids = (await vidRes.json()).results ?? [];
        const pick = vids.find(
          (v: { site: string; type: string; key: string }) =>
            v.site === "YouTube" && v.type === "Trailer",
        ) ??
          vids.find(
            (v: { site: string; key: string }) => v.site === "YouTube",
          );
        if (pick?.key) {
          trailer = `https://www.youtube.com/watch?v=${pick.key}`;
        }
      }
    } catch (_) {
      // no trailer — fine
    }

    // Best-effort streaming / rent / buy availability. TMDB sources this
    // from JustWatch — "via JustWatch" attribution is required wherever
    // it's displayed.
    const region = (url.searchParams.get("region") || "US")
      .toUpperCase()
      .slice(0, 2);
    let watchProviders:
      | {
          link: string | null;
          flatrate: string[];
          rent: string[];
          buy: string[];
        }
      | null = null;
    try {
      const wpRes = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}/watch/providers?api_key=${tmdbApiKey}`,
      );
      if (wpRes.ok) {
        const byRegion = (await wpRes.json()).results ?? {};
        const r = byRegion[region] ?? byRegion["US"];
        if (r) {
          const names = (
            list: { provider_name: string }[] | undefined,
          ): string[] =>
            Array.isArray(list)
              ? [...new Set(list.map((p) => p.provider_name))]
              : [];
          const flatrate = names(r.flatrate);
          const rent = names(r.rent);
          const buy = names(r.buy);
          if (flatrate.length || rent.length || buy.length) {
            watchProviders = { link: r.link ?? null, flatrate, rent, buy };
          }
        }
      }
    } catch (_) {
      // no availability — fine
    }

    const result = {
      poster: movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "https://images.unsplash.com/photo-1489599731893-01139d4e6b5b?w=500&h=750&fit=crop",
      year: movie.release_date
        ? parseInt(movie.release_date.split("-")[0])
        : new Date().getFullYear(),
      rating: movie.vote_average
        ? Math.round(movie.vote_average * 10) / 10
        : 7.5,
      description: description,
      genres: genres,
      director: director,
      trailer: trailer,
      watchProviders: watchProviders,
    };

    console.log("Returning movie data:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("TMDB Proxy error:", error);

    return new Response(
      JSON.stringify({
        poster:
          "https://images.unsplash.com/photo-1489599731893-01139d4e6b5b?w=500&h=750&fit=crop",
        year: new Date().getFullYear(),
        rating: 7.5,
        description:
          "A captivating story that will keep you entertained from start to finish.",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
