import { cn } from "@/lib/utils";

/**
 * Deterministic, backend-free avatar for feed authors. Seed authors have no
 * uploaded image, so we render initials on a hue picked by hashing the name
 * (stable per person). Pass `url` to use a real picture when one exists.
 */
const PALETTE = [
  "bg-violet-500/15 text-violet-700 dark:bg-violet-400/20 dark:text-violet-200",
  "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-400/20 dark:text-indigo-200",
  "bg-rose-500/15 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200",
  "bg-amber-500/15 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200",
  "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200",
  "bg-pink-500/15 text-pink-700 dark:bg-pink-400/20 dark:text-pink-200",
];

function hueIndex(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h % PALETTE.length;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function FeedAvatar({
  name,
  url,
  size = 32,
  className,
}: {
  name: string;
  url?: string;
  size?: number;
  className?: string;
}) {
  const dim = { width: size, height: size };

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        style={dim}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      style={dim}
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-full font-black",
        PALETTE[hueIndex(name)],
        size <= 24 ? "text-[10px]" : size <= 36 ? "text-xs" : "text-sm",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
