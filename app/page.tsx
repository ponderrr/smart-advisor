"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ParallaxHeroImages } from "@/components/ui/parallax-hero-images";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { LinkPreview } from "@/components/ui/link-preview";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "motion/react";
import PoweredByLogos from "@/components/powered-by-logos";
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
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// --- Sub-component: HeroSection ---
// Moved outside of Index to prevent nesting syntax errors
const HeroSection = () => {
  const router = useRouter();
  const heroImages = [
    "https://images.unsplash.com/photo-1489599849228-13632ca16442?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1495446815901-a7297e01a5ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1507842298343-583f20981122?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1489599849228-13632ca16442?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
  ];

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
      <ParallaxHeroImages images={heroImages} />
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] dark:text-slate-50 dark:drop-shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-colors duration-300">
          Discover Your Next Favorite
        </h1>
        <p className="max-w-md text-lg text-slate-700 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] dark:text-slate-200 dark:drop-shadow-[0_0_10px_rgba(0,0,0,0.4)] transition-colors duration-300">
          AI-powered recommendations for movies and books tailored to your
          taste.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <button
            onClick={() => router.push("/content-selection")}
            className={cn(
              "px-10 py-4 text-white font-bold rounded-full transition-all duration-300",
              "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600",
              "hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700",
              "shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_30px_rgba(99,102,241,0.7)] hover:scale-105 transform",
            )}
          >
            Get Started
          </button>
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

  const cards = [
    {
      title: "Smart Questionnaire",
      description: "AI generates 5 personalized questions tailored to you",
      gradient: "from-red-500 to-pink-500",
    },
    {
      title: "Tailored Recommendations",
      description: "Get book and movie picks that match your taste perfectly",
      gradient: "from-purple-500 to-blue-500",
    },
    {
      title: "Instant Results",
      description:
        "Discover your next favorite in seconds with smart filtering",
      gradient: "from-cyan-500 to-green-500",
    },
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
            <NavbarButton variant="primary" onClick={handleGetStarted}>
              Get Started
            </NavbarButton>
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

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors duration-300"
              >
                {item.name}
              </a>
            ))}
            <div className="flex w-full flex-col gap-4 mt-4">
              <NavbarButton
                onClick={handleSignIn}
                variant="secondary"
                className="w-full"
              >
                {user ? "Dashboard" : "Sign In"}
              </NavbarButton>
              <NavbarButton
                onClick={handleGetStarted}
                variant="primary"
                className="w-full"
              >
                Get Started
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <HeroSection />

      <section
        id="how-it-works"
        className="py-20 md:py-32 px-4 md:px-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/50 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white transition-colors duration-300">
              How It Works
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg transition-colors duration-300">
              Simple, smart, and personalized for you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6">
            {cards.map((card, index) => (
              <div
                key={index}
                className={cn(
                  "group relative overflow-hidden rounded-xl transition-all duration-500",
                  "bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800",
                  "p-6 md:p-8 flex flex-col h-full",
                  "hover:shadow-lg dark:hover:shadow-lg hover:shadow-slate-900/10 dark:hover:shadow-blue-500/10",
                  "hover:border-slate-300 dark:hover:border-slate-700",
                )}
              >
                {/* Background gradient accent on hover */}
                <div
                  className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl",
                    `bg-gradient-to-br ${card.gradient}`,
                  )}
                  style={{ opacity: 0.05 }}
                ></div>

                <div className="relative z-10 flex flex-col h-full">
                  {/* Number badge */}
                  <div
                    className={cn(
                      "inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4",
                      `bg-gradient-to-br ${card.gradient}`,
                      "text-white font-bold text-lg transition-transform duration-300 group-hover:scale-110",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3 transition-colors duration-300">
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base flex-grow transition-colors duration-300">
                    {card.description}
                  </p>

                  {/* Bottom accent line */}
                  <div
                    className={cn(
                      "mt-6 h-1 rounded-full w-0 group-hover:w-12 transition-all duration-500",
                      `bg-gradient-to-r ${card.gradient}`,
                    )}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="powered-by"
        className="py-20 md:py-32 px-4 md:px-6 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white transition-colors duration-300">
              Powered By
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg transition-colors duration-300">
              Built with cutting-edge AI and data services
            </p>
          </div>

          <PoweredByLogos />
        </div>
      </section>

      <section
        id="meet-the-team"
        className="py-20 md:py-32 px-4 md:px-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white transition-colors duration-300">
              Meet the Team
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg transition-colors duration-300">
              Powered by essential services and integrations
            </p>
          </div>

          {/* Animated Tooltips */}
          <div className="flex items-center justify-center mb-16">
            <div className="w-full flex justify-center relative h-40">
              <AnimatedTooltip items={teamMembers} />
            </div>
          </div>

          {/* Services Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-8 transition-all duration-300 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-4 transition-colors duration-300">
                Intelligence Layer
              </h4>
              <p className="text-slate-600 dark:text-slate-400 transition-colors duration-300">
                Our AI Engine powers intelligent question generation, creating
                personalized questionnaires that adapt to your preferences in
                real-time.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-8 transition-all duration-300 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-4 transition-colors duration-300">
                Data Sources
              </h4>
              <p className="text-slate-600 dark:text-slate-400 transition-colors duration-300">
                TMDB API provides comprehensive movie data, Google Books
                supplies extensive book information, and Supabase handles secure
                data storage and user management.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-20 px-4 md:px-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/50 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          {/* Footer Credit */}
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400 transition-colors duration-300 mb-4">
              Built with
              <LinkPreview
                url="#"
                className="mx-2 font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300 inline"
              >
                React
              </LinkPreview>
              ,
              <LinkPreview
                url="#"
                className="mx-2 font-semibold text-slate-900 dark:text-white hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-300 inline"
              >
                Next.js
              </LinkPreview>
              , and
              <LinkPreview
                url="#"
                className="mx-2 font-semibold text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors duration-300 inline"
              >
                TypeScript
              </LinkPreview>
            </p>
            <p className="text-slate-600 dark:text-slate-400 transition-colors duration-300">
              © 2026 Smart Advisor. AI-powered entertainment recommendations.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-3 transition-colors duration-300">
              Aceternity UI components and modern web technologies.
            </p>
            <div className="mt-6 flex justify-center gap-6">
              <a
                href="#"
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-300"
              >
                GitHub
              </a>
              <a
                href="#"
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-300"
              >
                Twitter
              </a>
              <a
                href="#"
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-300"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
