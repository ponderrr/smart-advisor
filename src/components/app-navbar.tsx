"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, MonitorSmartphone, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";

import { useAuth } from "@/features/auth/hooks/use-auth";
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

const LOGGED_OUT_ITEMS = [
  { name: "How It Works", link: "/#how-it-works" },
  { name: "Why Smart Advisor", link: "/#why-smart-advisor" },
  { name: "Powered By", link: "/#powered-by" },
  { name: "Our Team", link: "/#meet-the-team" },
  { name: "FAQ", link: "/#faq" },
];

const DEMO_ITEMS = [
  { name: "How It Works", link: "/#how-it-works" },
  { name: "FAQ", link: "/#faq" },
];

const LOGGED_IN_ITEMS = [
  { name: "Dashboard", link: "/dashboard" },
  { name: "Library", link: "/library" },
  { name: "History", link: "/history" },
  { name: "Group Quiz", link: "/group-quiz" },
  { name: "Settings", link: "/settings" },
];

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // The demo flow is for prospective users — even if a logged-in user lands
  // here, we show a trimmed marketing-style navbar so the demo stays focused.
  const isDemoContext = pathname?.startsWith("/demo") ?? false;
  const useMarketingVariant = !user || isDemoContext;
  const navItems = isDemoContext
    ? DEMO_ITEMS
    : useMarketingVariant
      ? LOGGED_OUT_ITEMS
      : LOGGED_IN_ITEMS;

  const handlePrimary = () => {
    if (useMarketingVariant) {
      router.push(user ? "/dashboard" : "/auth");
    } else {
      router.push("/dashboard");
    }
  };

  const primaryLabel = useMarketingVariant
    ? user
      ? "Dashboard"
      : "Get Started"
    : "Dashboard";

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
            user && <UserAvatarMenu />
          )}
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </div>
        </MobileNavHeader>

        <MobileNavMenu isOpen={isMobileMenuOpen}>
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

          {user && !useMarketingVariant && (
            <button
              type="button"
              onClick={async () => {
                await handleSignOut();
                setIsMobileMenuOpen(false);
              }}
              className="text-left text-xl font-black tracking-tight text-rose-600 dark:text-rose-400"
            >
              Sign Out
            </button>
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
          aria-label="Account menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200/80 shadow-sm ring-offset-2 transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700/70 dark:ring-offset-slate-950"
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
        <ThemeSwitcherRow />
        <DropdownMenuSeparator className="bg-slate-200/80 dark:bg-slate-700/60" />
        <DropdownMenuItem
          onSelect={handleSignOut}
          className="cursor-pointer gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-rose-600 focus:bg-rose-50 focus:text-rose-700 dark:text-rose-400 dark:focus:bg-rose-500/10 dark:focus:text-rose-300"
        >
          <LogOut size={16} />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * ThemeSwitcherRow — segmented Light / Dark / System control rendered inside
 * the avatar dropdown. Uses plain buttons (not DropdownMenuItem) so picking a
 * theme doesn't auto-close the menu.
 */
function ThemeSwitcherRow() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Each option mirrors the standalone ThemeToggle's color language so the
  // active theme reads at a glance — orange for light, indigo for dark, and
  // a cool blue for system.
  const options = [
    {
      value: "light",
      label: "Light",
      Icon: Sun,
      activeBg: "bg-orange-50",
      activeIcon: "text-orange-600",
      activeText: "text-orange-900",
    },
    {
      value: "dark",
      label: "Dark",
      Icon: Moon,
      activeBg: "bg-indigo-950",
      activeIcon: "text-indigo-400",
      activeText: "text-indigo-100",
    },
    {
      value: "system",
      label: "System",
      Icon: MonitorSmartphone,
      hint: "Matches your device setting",
      activeBg: "bg-blue-50 dark:bg-blue-950/40",
      activeIcon: "text-blue-500",
      activeText: "text-blue-900 dark:text-blue-100",
    },
  ] as const;

  // Until mounted, next-themes can't tell us the resolved value — render the
  // row in a neutral state so SSR and client markup match.
  const active = mounted ? theme : undefined;

  return (
    <div className="px-2 py-2">
      <p className="px-1 pb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
        Theme
      </p>
      <div className="relative flex rounded-full bg-slate-100 p-1 dark:bg-slate-800/60">
        {options.map((option) => {
          const { value, label, Icon, activeBg, activeIcon, activeText } = option;
          const hint = "hint" in option ? option.hint : undefined;
          const isActive = active === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              aria-pressed={isActive}
              aria-label={hint ? `${label} theme — ${hint}` : `${label} theme`}
              title={hint}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-2 text-xs transition-colors",
                isActive
                  ? cn(activeText, "font-semibold")
                  : "font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="theme-switcher-pill"
                  aria-hidden
                  className={cn(
                    "absolute inset-0 -z-0 rounded-full shadow-sm",
                    activeBg,
                  )}
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 34,
                    mass: 0.8,
                  }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                <Icon
                  size={13}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    isActive ? activeIcon : "opacity-70",
                  )}
                />
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
