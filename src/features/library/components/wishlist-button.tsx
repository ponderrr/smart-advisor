"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Loader } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { libraryService } from "../services/library-service";
import type { LibraryMedium, LibraryStatus } from "../types/library";

interface WishlistButtonProps {
  medium: LibraryMedium;
  title: string;
  creator?: string | null;
  year?: number | null;
  poster_url?: string | null;
  source_recommendation_id?: string | null;
  /** Current library status of this item, or null if not in library yet.
   *  When already in library with a non-wishlist status, the button hides
   *  itself — the LogToLibraryButton is the right surface to edit that. */
  initialStatus?: LibraryStatus | null;
  variant?: "default" | "compact";
}

/**
 * One-tap wishlist add for the results page. Distinct from LogToLibraryButton
 * (which opens the full status + rating dialog) — used when the user hasn't
 * seen the recommendation yet and just wants to save it for later.
 */
export const WishlistButton = ({
  medium,
  title,
  creator,
  year,
  poster_url,
  source_recommendation_id,
  initialStatus = null,
  variant = "default",
}: WishlistButtonProps) => {
  const t = useTranslations("Library.wishlistButton");
  const [onWishlist, setOnWishlist] = useState(initialStatus === "wishlist");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOnWishlist(initialStatus === "wishlist");
  }, [initialStatus]);

  // Item is in library under a different status — let LogToLibraryButton
  // handle it rather than tempting the user to downgrade to wishlist.
  if (initialStatus !== null && initialStatus !== "wishlist") {
    return null;
  }

  const handleAdd = async () => {
    if (onWishlist || saving) return;
    setSaving(true);
    const { error } = await libraryService.log({
      medium,
      title,
      creator: creator ?? null,
      year: year ?? null,
      poster_url: poster_url ?? null,
      status: "wishlist",
      source_recommendation_id: source_recommendation_id ?? null,
    });
    setSaving(false);

    if (error) {
      toast.error(error);
      return;
    }

    setOnWishlist(true);
    toast.success(t("added"));
  };

  const Icon = saving ? Loader : onWishlist ? BookmarkCheck : Bookmark;

  return (
    <button
      type="button"
      onClick={() => void handleAdd()}
      disabled={onWishlist || saving}
      aria-label={
        onWishlist
          ? t("ariaOnWishlist", { title })
          : t("ariaAdd", { title })
      }
      className={cn(
        "shrink-0 rounded-full transition-all disabled:cursor-default",
        variant === "compact" ? "p-2" : "px-3 py-2",
        onWishlist
          ? "bg-violet-500 text-white shadow-md"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
      )}
    >
      <span className="flex items-center gap-1.5">
        <Icon size={16} className={cn(saving && "animate-spin")} />
        {variant === "default" && (
          <span className="text-xs font-semibold">
            {onWishlist ? t("onWishlist") : t("add")}
          </span>
        )}
      </span>
    </button>
  );
};
