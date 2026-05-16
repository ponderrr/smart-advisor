import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Smart Advisor — AI Movie & Book Recommendations",
    short_name: "Smart Advisor",
    description:
      "Answer a short personality quiz and get a movie, book, or music recommendation tailored specifically to you — powered by Claude AI.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    categories: ["entertainment", "lifestyle", "books"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // Lets other apps share a movie/book/song title *into* Smart Advisor
    // (Android/Chrome; iOS does not implement Web Share Target). GET so the
    // shared fields arrive as query params on the handler page.
    share_target: {
      action: "/share-target",
      method: "GET",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
    shortcuts: [
      {
        name: "Start a quiz",
        short_name: "Quiz",
        description: "Jump straight into a new recommendation quiz",
        url: "/quiz",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "History",
        short_name: "History",
        description: "View your past recommendations",
        url: "/history",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
