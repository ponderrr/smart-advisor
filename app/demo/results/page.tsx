"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { IconArrowLeft, IconExternalLink } from "@tabler/icons-react";

type DemoBook = {
  id: string;
  title: string;
  authors: string;
  description: string;
  cover: string;
  infoLink: string;
};

const ShimmerLoader = () => {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/60"
        >
          <div className="flex gap-4">
            <div className="h-24 w-16 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-5/6 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
          <motion.div
            className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-slate-200/20"
            animate={{ x: ["0%", "340%"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
        </div>
      ))}
    </div>
  );
};

export default function DemoResultsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<DemoBook[]>([]);
  const [query, setQuery] = useState("best fiction books");

  useEffect(() => {
    const raw = sessionStorage.getItem("smart_advisor_demo_answers");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      setQuery(
        `${parsed.contentType || "books"} ${parsed.mood || ""} ${parsed.pace || ""} recommended books`,
      );
    } catch {
      setQuery("best fiction books");
    }
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const start = Date.now();
      if (active) setLoading(true);
      try {
        const response = await fetch(`/api/demo-books?q=${encodeURIComponent(query)}`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (active) {
          setBooks(Array.isArray(data.books) ? data.books : []);
        }
      } catch (error) {
        console.error("Failed to load demo results:", error);
      } finally {
        const elapsed = Date.now() - start;
        const minDelay = 1400;
        const wait = Math.max(0, minDelay - elapsed);
        window.setTimeout(() => {
          if (active) setLoading(false);
        }, wait);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [query]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.push("/demo")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-4 py-2 text-sm font-semibold transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:hover:bg-slate-900"
          >
            <IconArrowLeft className="h-4 w-4" />
            Back
          </button>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Demo Results
          </p>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Your Book Picks Are Ready</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Personalized from your answers, generated in real time with Google Books data.
          </p>
        </div>

        {loading ? (
          <ShimmerLoader />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {books.map((book, idx) => (
              <motion.article
                key={book.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: idx * 0.06 }}
                className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/65"
              >
                <div className="flex gap-4">
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="h-28 w-20 rounded-lg object-cover ring-1 ring-black/10 dark:ring-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 text-lg font-black tracking-tight">{book.title}</h2>
                    <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                      {book.authors}
                    </p>
                    <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {book.description}
                    </p>
                    <a
                      href={book.infoLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                    >
                      View details
                      <IconExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
