"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
  active: boolean;
  link_url?: string | null;
  link_text?: string | null;
}

const BANNER_DISMISSED_KEY = "smart_advisor_dismissed_banners";

const bannerConfig: Record<
  BannerType,
  { icon: React.ReactNode; bgClass: string; textClass: string }
> = {
  maintenance: {
    icon: <AlertTriangle size={16} />,
    bgClass:
      "bg-amber-600 dark:bg-amber-700",
    textClass: "text-white",
  },
  feature: {
    icon: <Sparkles size={16} />,
    bgClass:
      "bg-indigo-600 dark:bg-indigo-700",
    textClass: "text-white",
  },
  announcement: {
    icon: <Megaphone size={16} />,
    bgClass:
      "bg-slate-800 dark:bg-slate-700",
    textClass: "text-white",
  },
  info: {
    icon: <Info size={16} />,
    bgClass:
      "bg-blue-600 dark:bg-blue-700",
    textClass: "text-white",
  },
};

export const SiteBanner = () => {
  const pathname = usePathname();
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

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
          .eq("active", true)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setBanners(data as BannerData[]);
        }
      } catch {
        // Table might not exist yet — fail silently
      }
    };

    fetchBanners();

    // Subscribe to realtime changes for live updates
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

  // Filter banners: site-wide always shown, homepage-only on homepage
  // Maintenance banners cannot be dismissed (critical alerts)
  const visibleBanners = banners.filter((banner) => {
    if (banner.visibility === "homepage-only" && !isHomepage) return false;
    if (banner.type !== "maintenance" && dismissed.has(banner.id)) return false;
    return true;
  });

  if (visibleBanners.length === 0) return null;

  // Show the first (most recent) visible banner
  const banner = visibleBanners[0];
  const config = bannerConfig[banner.type];

  return (
    <StickyBanner
      className={`${config.bgClass} ${config.textClass}`}
      hideOnScroll={banner.type !== "maintenance"}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {config.icon}
        <span>{banner.message}</span>
        {banner.link_url && banner.link_text && (
          <a
            href={banner.link_url}
            className="ml-1 underline underline-offset-2 opacity-90 transition-opacity hover:opacity-100"
            target="_blank"
            rel="noreferrer"
          >
            {banner.link_text}
          </a>
        )}
      </div>
    </StickyBanner>
  );
};
