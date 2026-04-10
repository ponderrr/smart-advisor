"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
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
  { name: "History", link: "/history" },
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
          <ThemeToggle />

          {/* Marketing variant gets the gradient CTA. Logged-in app pages
              show only the Sign Out text — Dashboard already lives in the
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
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm font-bold tracking-tight text-slate-700 transition-colors hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400"
              >
                Sign Out
              </button>
            )
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
