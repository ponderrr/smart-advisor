"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Search as SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { NotificationsBell } from "@/features/feed/components/notifications-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";

const LOGGED_OUT_KEYS = [
  { key: "howItWorks", link: "/#how-it-works" },
  { key: "whySmartAdvisor", link: "/#why-smart-advisor" },
  { key: "poweredBy", link: "/#powered-by" },
  { key: "ourTeam", link: "/#meet-the-team" },
  { key: "faq", link: "/#faq" },
] as const;

const DEMO_KEYS = [
  { key: "howItWorks", link: "/#how-it-works" },
  { key: "faq", link: "/#faq" },
] as const;

const LOGGED_IN_KEYS = [
  // Feed is the logged-in home. The old /dashboard route is retired —
  // milestones moved to /milestones; analytics live in /wrapped; recent
  // picks are in /history. Group quiz isn't a top-level destination — it's
  // a mode of "start a quiz", reachable from the Feed header's quiz
  // dropdown (Solo / Group / Surprise).
  { key: "feed", link: "/feed" },
  { key: "library", link: "/library" },
  { key: "history", link: "/history" },
  { key: "milestones", link: "/milestones" },
  { key: "settings", link: "/settings" },
] as const;

/**
 * AppNavbar — the single source of truth for the global navigation bar.
 *
 * Renders identically on every page that imports it. Items + the right-side
 * action adapt to auth state, not to which page you are on, so the layout
 * stays consistent everywhere.
 */
export function AppNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const t = useTranslations("Navbar");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // The demo flow is for prospective users — even if a logged-in user lands
  // here, we show a trimmed marketing-style navbar so the demo stays focused.
  const isDemoContext = pathname?.startsWith("/demo") ?? false;
  const useMarketingVariant = !user || isDemoContext;
  const navKeys = isDemoContext
    ? DEMO_KEYS
    : useMarketingVariant
      ? LOGGED_OUT_KEYS
      : LOGGED_IN_KEYS;
  const navItems = navKeys.map((entry) => ({
    name: t(`items.${entry.key}`),
    link: entry.link,
  }));

  const handlePrimary = () => {
    if (useMarketingVariant) {
      router.push(user ? "/feed" : "/auth");
    } else {
      router.push("/feed");
    }
  };

  const primaryLabel = useMarketingVariant
    ? user
      ? t("items.feed")
      : t("getStarted")
    : t("items.feed");

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <Navbar>
      <NavBody>
        <div className="flex min-w-0 flex-1 items-center">
          <NavbarLogo />
        </div>

        <div className="flex shrink-0 justify-center px-6">
          <NavItems items={navItems} className="justify-center px-2" />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
          {/* Logged-in users get the theme switcher inside the avatar
              dropdown, so the navbar only shows it for marketing visitors. */}
          {useMarketingVariant && <ThemeToggle />}

          {/* Marketing variant gets the gradient CTA. Logged-in app pages
              show an avatar dropdown — Dashboard already lives in the
              centered nav items, so a second CTA is redundant. */}
          {useMarketingVariant ? (
            <HoverBorderGradient
              onClick={handlePrimary}
              idleColor="17, 24, 39"
              darkIdleColor="255, 255, 255"
              highlightColor="139, 92, 246"
              darkHighlightColor="167, 139, 250"
              containerClassName="rounded-full"
              className="whitespace-nowrap bg-white px-6 py-2.5 text-base font-black leading-none tracking-tighter text-black dark:bg-black dark:text-white"
            >
              {primaryLabel}
            </HoverBorderGradient>
          ) : (
            user && (
              <>
                <button
                  type="button"
                  onClick={() => router.push("/feed/search")}
                  aria-label="Search"
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  <SearchIcon size={18} />
                </button>
                <NotificationsBell />
                <UserAvatarMenu />
              </>
            )
          )}
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          {useMarketingVariant ? (
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          ) : (
            // Authed mobile users get the same avatar dropdown as desktop —
            // mirrors the right-side anchor users expect and pulls theme +
            // sign out into a tidy menu instead of leaving the bar bare.
            <div className="flex items-center gap-1">
              <NotificationsBell />
              <UserAvatarMenu />
            </div>
          )}
        </MobileNavHeader>

        <MobileNavMenu isOpen={isMobileMenuOpen && useMarketingVariant}>
          {navItems.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => {
                router.push(item.link);
                setIsMobileMenuOpen(false);
              }}
              className="text-left text-xl font-black tracking-tight text-slate-800 dark:text-slate-100"
            >
              {item.name}
            </button>
          ))}

          {useMarketingVariant && (
            <HoverBorderGradient
              onClick={() => {
                handlePrimary();
                setIsMobileMenuOpen(false);
              }}
              idleColor="17, 24, 39"
              darkIdleColor="255, 255, 255"
              highlightColor="139, 92, 246"
              darkHighlightColor="167, 139, 250"
              containerClassName="mt-2 w-full rounded-full"
              className="w-full py-4 text-center text-xs font-black uppercase tracking-widest"
            >
              {primaryLabel}
            </HoverBorderGradient>
          )}
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}

/**
 * UserAvatarMenu — circular avatar trigger that opens a dropdown with the
 * user's identity, quick links, and sign out. Lives inside AppNavbar so the
 * scroll-aware navbar styling propagates without extra wiring.
 */
function UserAvatarMenu() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const t = useTranslations("Navbar");

  if (!user) return null;

  const displayName = user.name || user.username || user.email;
  const initial = (displayName || "?").charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("accountMenu")}
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200/80 shadow-sm ring-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700/70 dark:ring-offset-slate-950"
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-black text-white">
              {initial}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-60 rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-xl backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/95"
      >
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-black text-white">
                {initial}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {displayName}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-slate-200/80 dark:bg-slate-700/60" />
        <DropdownMenuItem
          onSelect={handleSignOut}
          className="cursor-pointer gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-rose-600 focus:bg-rose-50 focus:text-rose-700 dark:text-rose-400 dark:focus:bg-rose-500/10 dark:focus:text-rose-300"
        >
          <LogOut size={16} />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

