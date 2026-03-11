"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { StickyBanner } from "@/components/ui/sticky-banner";
import { AlertTriangle, Info, Sparkles, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type BannerType = "maintenance" | "feature" | "announcement" | "info";
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
}

const BANNER_DISMISSED_KEY = "smart_advisor_dismissed_banners";

const bannerConfig: Record<
  BannerType,
  { icon: React.ReactNode; className: string }
> = {
  maintenance: {
    icon: <AlertTriangle size={14} />,
    className:
      "bg-amber-50 text-amber-900 border-b border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800/40",
  },
  feature: {
    icon: <Sparkles size={14} />,
    className:
      "bg-violet-50 text-violet-900 border-b border-violet-200/60 dark:bg-violet-950/50 dark:text-violet-200 dark:border-violet-800/40",
  },
  announcement: {
    icon: <Megaphone size={14} />,
    className:
      "bg-slate-100 text-slate-800 border-b border-slate-200/60 dark:bg-slate-800/50 dark:text-slate-200 dark:border-slate-700/40",
  },
  info: {
    icon: <Info size={14} />,
    className:
      "bg-blue-50 text-blue-900 border-b border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800/40",
  },
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

  const isHomepage = pathname === "/";

  const visibleBanners = banners.filter((banner) => {
    if (banner.visibility === "homepage-only" && !isHomepage) return false;
    if (banner.type !== "maintenance" && dismissed.has(banner.id)) return false;
    return true;
  });

  // Reset CSS variable when no banners
  useEffect(() => {
    if (visibleBanners.length === 0) {
      document.documentElement.style.setProperty("--site-banner-height", "0px");
    }
  }, [visibleBanners.length]);

  return (
    <div ref={containerRef} className="relative z-[60] w-full">
      <AnimatePresence>
        {visibleBanners.map((banner) => {
          const config = bannerConfig[banner.type];
          return (
            <StickyBanner
              key={banner.id}
              className={config.className}
              onClose={
                banner.type !== "maintenance"
                  ? () => handleDismiss(banner.id)
                  : undefined
              }
            >
              <div className="flex items-center gap-2 text-xs font-medium">
                {config.icon}
                <span>{banner.message}</span>
                {banner.link_url && banner.link_text && (
                  <a
                    href={banner.link_url}
                    className="ml-1 underline underline-offset-2 opacity-80 transition-opacity hover:opacity-100"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {banner.link_text}
                  </a>
                )}
              </div>
            </StickyBanner>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
