"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { StickyBanner } from "@/components/ui/sticky-banner";
import {
  AlertTriangle,
  Info,
  Sparkles,
  Megaphone,
  XCircle,
  CheckCircle,
  Siren,
  Timer,
  Tag,
  ArrowUpCircle,
  Lightbulb,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type BannerType =
  | "info"
  | "warning"
  | "error"
  | "success"
  | "maintenance"
  | "feature"
  | "announcement"
  | "urgent"
  | "countdown"
  | "promotion"
  | "update"
  | "tip";

export type BannerVisibility = "site-wide" | "homepage-only";

export interface BannerData {
  id: string;
  message: string;
  type: BannerType;
  visibility: BannerVisibility;
  is_active: boolean;
  link_url?: string | null;
  link_text?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  countdown_target?: string | null;
}

const BANNER_DISMISSED_KEY = "smart_advisor_dismissed_banners";

const bannerConfig: Record<
  BannerType,
  { icon: React.ReactNode; className: string }
> = {
  info: {
    icon: <Info size={13} className="shrink-0" />,
    className:
      "bg-blue-100/80 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200",
  },
  warning: {
    icon: <AlertTriangle size={13} className="shrink-0" />,
    className:
      "bg-amber-100/80 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  },
  error: {
    icon: <XCircle size={13} className="shrink-0" />,
    className:
      "bg-red-100/80 text-red-900 dark:bg-red-900/40 dark:text-red-200",
  },
  success: {
    icon: <CheckCircle size={13} className="shrink-0" />,
    className:
      "bg-emerald-100/80 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
  maintenance: {
    icon: <AlertTriangle size={13} className="shrink-0" />,
    className:
      "bg-amber-100/80 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  },
  feature: {
    icon: <Sparkles size={13} className="shrink-0" />,
    className:
      "bg-violet-100/80 text-violet-900 dark:bg-violet-900/40 dark:text-violet-200",
  },
  announcement: {
    icon: <Megaphone size={13} className="shrink-0" />,
    className:
      "bg-slate-100/80 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200",
  },
  urgent: {
    icon: <Siren size={13} className="shrink-0" />,
    className:
      "bg-red-200/90 text-red-950 dark:bg-red-900/60 dark:text-red-100",
  },
  countdown: {
    icon: <Timer size={13} className="shrink-0" />,
    className:
      "bg-indigo-100/80 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-200",
  },
  promotion: {
    icon: <Tag size={13} className="shrink-0" />,
    className:
      "bg-pink-100/80 text-pink-900 dark:bg-pink-900/40 dark:text-pink-200",
  },
  update: {
    icon: <ArrowUpCircle size={13} className="shrink-0" />,
    className:
      "bg-cyan-100/80 text-cyan-900 dark:bg-cyan-900/40 dark:text-cyan-200",
  },
  tip: {
    icon: <Lightbulb size={13} className="shrink-0" />,
    className:
      "bg-yellow-100/80 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-200",
  },
};

/** Non-dismissible banner types (critical info users must see) */
const NON_DISMISSIBLE_TYPES: BannerType[] = ["maintenance", "urgent", "error"];

function useCountdown(target: string | null | undefined) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!target) return;

    const update = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Now!");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      const parts: string[] = [];
      if (d > 0) parts.push(`${d}d`);
      if (h > 0) parts.push(`${h}h`);
      parts.push(`${m}m`);
      parts.push(`${s}s`);
      setRemaining(parts.join(" "));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return remaining;
}

const CountdownDisplay = ({ target }: { target: string }) => {
  const remaining = useCountdown(target);
  return (
    <span className="ml-1 tabular-nums font-semibold">{remaining}</span>
  );
};

export const SiteBanner = () => {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Update CSS variable with banner container height
  const updateBannerHeight = useCallback(() => {
    const height = containerRef.current?.offsetHeight ?? 0;
    document.documentElement.style.setProperty(
      "--site-banner-height",
      `${height}px`,
    );
  }, []);

  // Load dismissed banners from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BANNER_DISMISSED_KEY);
      if (stored) {
        setDismissed(new Set(JSON.parse(stored)));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Fetch active banners from Supabase
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from("banners")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setBanners(data as BannerData[]);
        }
      } catch (err) {
        console.error("Unexpected error fetching banners:", err);
      }
    };

    fetchBanners();

    const channel = supabase
      .channel("banners-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "banners" },
        () => fetchBanners(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update CSS variable when banners change
  useEffect(() => {
    updateBannerHeight();

    const observer = new ResizeObserver(updateBannerHeight);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [banners, dismissed, updateBannerHeight]);

  const isHomepage = pathname === "/";

  const visibleBanners = banners.filter((banner) => {
    if (banner.visibility === "homepage-only" && !isHomepage) return false;
    if (
      !NON_DISMISSIBLE_TYPES.includes(banner.type) &&
      dismissed.has(banner.id)
    )
      return false;
    return true;
  });

  // Reset CSS variable when no banners
  useEffect(() => {
    if (visibleBanners.length === 0) {
      document.documentElement.style.setProperty("--site-banner-height", "0px");
    }
  }, [visibleBanners.length]);

  const handleDismiss = (bannerId: string) => {
    const next = new Set(dismissed);
    next.add(bannerId);
    setDismissed(next);
    try {
      localStorage.setItem(
        BANNER_DISMISSED_KEY,
        JSON.stringify(Array.from(next)),
      );
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-x-0 top-0 z-[60] w-full"
    >
      <AnimatePresence>
        {visibleBanners.map((banner) => {
          const config = bannerConfig[banner.type];
          return (
            <StickyBanner
              key={banner.id}
              className={config.className}
              onClose={
                !NON_DISMISSIBLE_TYPES.includes(banner.type)
                  ? () => handleDismiss(banner.id)
                  : undefined
              }
            >
              {config.icon}
              <span>{banner.message}</span>
              {banner.type === "countdown" && banner.countdown_target && (
                <CountdownDisplay target={banner.countdown_target} />
              )}
              {banner.link_url && banner.link_text && (
                <a
                  href={banner.link_url}
                  className="ml-0.5 underline underline-offset-2 opacity-80 transition-opacity hover:opacity-100"
                  target="_blank"
                  rel="noreferrer"
                >
                  {banner.link_text}
                </a>
              )}
            </StickyBanner>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
