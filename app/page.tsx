"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { LinkPreview } from "@/components/ui/link-preview";
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

import HeroSection from "@/components/hero-section";
import PoweredByLogos from "@/components/powered-by-logos";
import { cn } from "@/lib/utils";

const howItWorksCards = [
  {
    title: "Share Your Taste",
    description: "Answer a short intent-aware prompt set so the engine understands what you want right now.",
    image:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "AI Refines Context",
    description: "Your inputs are enriched with metadata from trusted media sources to sharpen recommendation quality.",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1616530940355-351fabd9524b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Get Curated Picks",
    description: "Receive instantly ranked books and movies with context-rich explanations that match your vibe.",
    image:
      "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1200&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=1200&q=80",
  },
];

const Index = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleGetStarted = () =>
    user ? router.push("/content-selection") : router.push("/auth");

  const navItems = [
    { name: "How It Works", link: "#how-it-works" },
    { name: "Powered By", link: "#powered-by" },
    { name: "Our Team", link: "#meet-the-team" },
  ];

  const teamMembers = [
    {
      id: 1,
      name: "AI Engine",
      designation: "Smart Questionnaire",
      image:
        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=300&q=80",
    },
    {
      id: 2,
      name: "TMDB API",
      designation: "Movie Data",
      image:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80",
    },
    {
      id: 3,
      name: "Google Books",
      designation: "Book Recommendations",
      image:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
    },
    {
      id: 4,
      name: "Supabase",
      designation: "Data Storage",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <HoverBorderGradient
              onClick={handleGetStarted}
              containerClassName="rounded-full"
              className="bg-white px-6 py-2 text-sm font-black tracking-tighter text-black dark:bg-black dark:text-white"
            >
              Get Started
            </HoverBorderGradient>
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
              <a
                key={item.name}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100"
              >
                {item.name}
              </a>
            ))}
            <HoverBorderGradient
              onClick={handleGetStarted}
              containerClassName="mt-2 w-full rounded-full"
              className="w-full py-4 text-center text-xs font-black uppercase tracking-widest"
            >
              Get Started
            </HoverBorderGradient>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <HeroSection />

      <section
        id="how-it-works"
        className="border-t bg-gradient-to-b from-white to-slate-50 px-6 py-24 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900/60 md:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center md:mb-20">
            <h2 className="mb-4 text-4xl font-black tracking-tighter md:text-5xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-400 md:text-lg">
              Three clear steps to personalized recommendations without endless browsing.
            </p>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-3">
            {howItWorksCards.map((card, idx) => (
              <article
                key={card.title}
                className={cn(
                  "group relative h-[22rem] w-full overflow-hidden rounded-3xl border border-slate-200/70 p-5 shadow-sm transition-all duration-500",
                  "dark:border-slate-700/70",
                )}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
                  style={{ backgroundImage: `url(${card.image})` }}
                />
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ backgroundImage: `url(${card.hoverImage})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-tr from-indigo-500/25 to-cyan-400/20" />

                <div className="relative z-10 flex h-full flex-col justify-end">
                  <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-slate-900 shadow-sm">
                    {idx + 1}
                  </span>
                  <h3 className="text-2xl font-black tracking-tight text-white md:text-[1.75rem]">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-100 md:text-base">
                    {card.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="powered-by" className="border-t py-32 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="mb-20 text-4xl font-black tracking-tighter md:text-5xl">
            Powered By
          </h2>
          <PoweredByLogos />
        </div>
      </section>

      <section id="meet-the-team" className="border-t py-32 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="mb-24 text-4xl font-black tracking-tighter md:text-5xl">
            Meet the Team
          </h2>
          <div className="flex h-32 justify-center">
            <AnimatedTooltip items={teamMembers} />
          </div>
        </div>
      </section>

      <footer className="border-t px-6 py-20 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <p className="mb-4">
          Built with{" "}
          <LinkPreview url="#" className="font-bold text-indigo-600">
            React
          </LinkPreview>
          ,{" "}
          <LinkPreview url="#" className="font-bold text-slate-900 dark:text-white">
            Next.js
          </LinkPreview>
          , and{" "}
          <LinkPreview url="#" className="font-bold text-blue-500">
            TypeScript
          </LinkPreview>
        </p>
        <p className="text-sm">© 2026 Smart Advisor. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
