"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ParallaxHeroImages } from "@/components/ui/parallax-hero-images";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { LinkPreview } from "@/components/ui/link-preview";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { FlipWords } from "@/components/ui/flip-words";
import PoweredByLogos from "@/components/powered-by-logos";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState } from "react";
import { cn } from "@/lib/utils";

// --- Sub-component: HeroSection ---
const HeroSection = () => {
  const router = useRouter();
  const heroImages = [
    "https://images.unsplash.com/photo-1489599849228-13632ca16442?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1495446815901-a7297e01a5ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1507842298343-583f20981122?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
  ];

  const words = ["Movie", "Book", "Story", "Adventure", "Classic"];

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
      <ParallaxHeroImages images={heroImages} />
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center">
        <div className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50 transition-colors duration-300">
          Discover Your Next Favorite
          <br />
          <FlipWords words={words} className="text-indigo-600 dark:text-indigo-400" />
        </div>

        <p className="max-w-md text-lg text-slate-700 dark:text-slate-200 transition-colors duration-300">
          AI-powered recommendations for movies and books tailored to your taste.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <HoverBorderGradient
            onClick={() => router.push("/content-selection")}
            containerClassName="rounded-full"
            as="button"
            className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2 px-8 py-3"
          >
            <span>Get Started</span>
          </HoverBorderGradient>
        </div>
      </div>
    </section>
  );
};

// --- Main Component: Index ---
const Index = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleGetStarted = () => {
    user ? router.push("/content-selection") : router.push("/auth");
  };

  const handleSignIn = () => {
    user ? router.push("/history") : router.push("/auth");
  };

  const navItems = [
    { name: "How It Works", link: "#how-it-works" },
    { name: "Powered By", link: "#powered-by" },
    { name: "Our Team", link: "#meet-the-team" },
  ];

  const teamMembers = [
    { id: 1, name: "AI Engine", designation: "Smart Questionnaire", image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=300&q=80" },
    { id: 2, name: "TMDB API", designation: "Movie Data", image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80" },
    { id: 3, name: "Google Books", designation: "Book Recommendations", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80" },
    { id: 4, name: "Supabase", designation: "Data Storage", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80" },
  ];

  const cards = [
    { title: "Smart Questionnaire", description: "AI generates 5 personalized questions tailored to you", gradient: "from-red-500 to-pink-500" },
    { title: "Tailored Recommendations", description: "Get book and movie picks that match your taste perfectly", gradient: "from-purple-500 to-blue-500" },
    { title: "Instant Results", description: "Discover your next favorite in seconds with smart filtering", gradient: "from-cyan-500 to-green-500" },
  ];

  return (
    <div className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300 antialiased">
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NavbarButton variant="secondary" onClick={handleSignIn}>
              {user ? "Dashboard" : "Sign In"}
            </NavbarButton>

            <HoverBorderGradient
              onClick={handleGetStarted}
              containerClassName="rounded-full"
              className="dark:bg-slate-900 bg-white text-black dark:text-white px-4 py-1.5"
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
              <MobileNavToggle isOpen={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
            </div>
          </MobileNavHeader>
          <MobileNavMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
            {navItems.map((item, idx) => (
              <a key={idx} href={item.link} onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors duration-300">
                {item.name}
              </a>
            ))}
            <div className="flex w-full flex-col gap-4 mt-4">
              <NavbarButton onClick={handleSignIn} variant="secondary" className="w-full">{user ? "Dashboard" : "Sign In"}</NavbarButton>
              <HoverBorderGradient
                onClick={handleGetStarted}
                containerClassName="rounded-full w-full"
                className="dark:bg-slate-900 bg-white text-black dark:text-white w-full py-2"
              >
                Get Started
              </HoverBorderGradient>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <HeroSection />

      {/* --- How It Works with Glowing Effect --- */}
      <section id="how-it-works" className="py-20 md:py-32 px-4 md:px-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/50 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">How It Works</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">Simple, smart, and personalized for you</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {cards.map((card, index) => (
              <div key={index} className="group relative h-full min-h-[250px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-1">
                {/* The Glowing Effect Background */}
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                />

                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-2xl p-6 transition-all duration-500 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50">
                  <div className="relative z-10">
                    <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 text-white font-bold bg-gradient-to-br shadow-lg", card.gradient)}>
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <h3 className="text-xl font-bold mb-3 tracking-tight text-slate-900 dark:text-slate-100">{card.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Powered By --- */}
      <section id="powered-by" className="py-20 md:py-32 px-4 md:px-6 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powered By</h2>
          </div>
          <PoweredByLogos />
        </div>
      </section>

      {/* --- Meet the Team --- */}
      <section id="meet-the-team" className="py-20 md:py-32 px-4 md:px-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Meet the Team</h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-20">The essential services behind our intelligence</p>
          <div className="flex items-center justify-center">
            <div className="w-full flex justify-center relative h-40">
              <AnimatedTooltip items={teamMembers} />
            </div>
          </div>
        </div>
      </section>

      <footer className="py-20 px-4 md:px-6 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Built with
          <LinkPreview url="#" className="mx-1 font-semibold text-blue-600">React</LinkPreview>,
          <LinkPreview url="#" className="mx-1 font-semibold text-slate-900 dark:text-white">Next.js</LinkPreview>, and
          <LinkPreview url="#" className="mx-1 font-semibold text-blue-500">TypeScript</LinkPreview>
        </p>
        <p className="text-slate-600 dark:text-slate-400">© 2026 Smart Advisor. AI-powered entertainment recommendations.</p>
      </footer>
    </div>
  );
};

export default Index;
