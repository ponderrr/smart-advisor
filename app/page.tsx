"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { HeroSection } from "@/components/hero-section";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { LinkPreview } from "@/components/ui/link-preview";
import { ThemeToggle } from "@/components/theme-toggle";
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

const Index = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleGetStarted = () => {
    if (user) {
      router.push("/history");
    } else {
      router.push("/auth");
    }
  };

  const handleSignIn = () => {
    if (user) {
      router.push("/history");
    } else {
      router.push("/auth");
    }
  };

  const navItems = [
    { name: "Movie Survey", link: "/questionnaire?type=movie" },
    { name: "Book Survey", link: "/questionnaire?type=book" },
    { name: "How It Works", link: "#how-it-works" },
  ];

  const teamMembers = [
    {
      id: 1,
      name: "AI Engine",
      designation: "Smart Questionnaire",
      image:
        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3387&q=80",
    },
    {
      id: 2,
      name: "TMDB API",
      designation: "Movie Data",
      image:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
    },
    {
      id: 3,
      name: "Google Books",
      designation: "Book Recommendations",
      image:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
    },
    {
      id: 4,
      name: "Supabase",
      designation: "Data Storage",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
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
    <div className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300">
      {/* Navbar */}
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
              {user ? "View History" : "Start Survey"}
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
                className="relative text-neutral-600 dark:text-neutral-300 light:text-neutral-700 hover:text-neutral-900 dark:hover:text-white light:hover:text-neutral-900 transition-colors"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4 mt-4">
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignIn();
                }}
                variant="secondary"
                className="w-full"
              >
                {user ? "Dashboard" : "Sign In"}
              </NavbarButton>
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleGetStarted();
                }}
                variant="primary"
                className="w-full"
              >
                Start Survey
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Hero Section */}
      <HeroSection userLoggedIn={!!user} />

      {/* Features Cards Section */}
      <section className="py-20 md:py-32 px-4 md:px-6 bg-white dark:bg-slate-950 light:bg-white border-t border-slate-200 dark:border-slate-800 light:border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-slate-900 dark:text-white light:text-slate-900">
            How It Works
          </h2>
          <p className="text-center text-slate-600 dark:text-slate-400 light:text-slate-600 mb-16 text-lg">
            Simple, smart, and personalized for you
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {cards.map((card, index) => (
              <div
                key={index}
                className={cn(
                  "group cursor-pointer overflow-hidden relative card h-full min-h-[300px] rounded-2xl shadow-xl mx-auto flex flex-col justify-end p-8",
                  "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 light:from-slate-50 light:to-slate-100",
                  "border border-slate-200 dark:border-slate-700 light:border-slate-200",
                  "transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-2xl dark:hover:shadow-blue-500/20",
                )}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                ></div>
                <div className="text relative z-10">
                  <div
                    className={`inline-block text-3xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent mb-4`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <h3 className="font-bold text-2xl md:text-3xl text-slate-900 dark:text-white light:text-slate-900 relative mb-4">
                    {card.title}
                  </h3>
                  <p className="font-normal text-base text-slate-700 dark:text-slate-300 light:text-slate-700 relative">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Animated Tooltips Section */}
      <section className="py-20 md:py-32 px-4 md:px-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 light:from-slate-50 light:to-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-slate-900 dark:text-white light:text-slate-900">
            Powered By
          </h2>
          <p className="text-center text-slate-600 dark:text-slate-400 light:text-slate-600 mb-16 text-lg">
            Built with the best technologies in the industry
          </p>

          <div className="flex flex-col items-center justify-center">
            <AnimatedTooltip items={teamMembers} />
            <p className="text-center text-slate-600 dark:text-slate-400 light:text-slate-600 mt-12 max-w-3xl">
              Our platform integrates cutting-edge AI, comprehensive movie
              databases, extensive book collections, and secure cloud
              infrastructure to deliver the best recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* Footer with Link Preview */}
      <section className="py-20 md:py-32 px-4 md:px-6 bg-white dark:bg-slate-950 light:bg-white border-t border-slate-200 dark:border-slate-800 light:border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-slate-900 dark:text-white light:text-slate-900">
              Start Your Discovery
            </h2>
            <div className="mb-12 space-y-6">
              <p className="text-slate-700 dark:text-slate-300 light:text-slate-700 text-lg max-w-3xl">
                Ready to find your next favorite? Check out our{" "}
                <LinkPreview
                  url="/"
                  className="font-bold text-blue-600 dark:text-blue-400 light:text-blue-600 hover:text-blue-700 dark:hover:text-blue-300 light:hover:text-blue-700"
                >
                  movie survey
                </LinkPreview>{" "}
                or{" "}
                <LinkPreview
                  url="/"
                  className="font-bold text-purple-600 dark:text-purple-400 light:text-purple-600 hover:text-purple-700 dark:hover:text-purple-300 light:hover:text-purple-700"
                >
                  book survey
                </LinkPreview>{" "}
                to get started.
              </p>
              <p className="text-slate-600 dark:text-slate-400 light:text-slate-600 text-sm">
                Questions? Learn more about{" "}
                <LinkPreview
                  url="/"
                  className="font-semibold text-cyan-600 dark:text-cyan-400 light:text-cyan-600 hover:text-cyan-700 dark:hover:text-cyan-300 light:hover:text-cyan-700"
                >
                  how Smart Advisor works
                </LinkPreview>
                .
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push("/questionnaire?type=movie")}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-500 dark:to-pink-500 light:from-red-600 light:to-pink-600 hover:from-red-700 hover:to-pink-700 dark:hover:from-red-600 dark:hover:to-pink-600 light:hover:from-red-700 light:hover:to-pink-700 text-white font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-red-500/50"
              >
                🎬 Movie Survey
              </button>
              <button
                onClick={() => router.push("/questionnaire?type=book")}
                className="px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-500 dark:to-orange-500 light:from-amber-600 light:to-orange-600 hover:from-amber-700 hover:to-orange-700 dark:hover:from-amber-600 dark:hover:to-orange-600 light:hover:from-amber-700 light:hover:to-orange-700 text-white font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-amber-500/50"
              >
                📚 Book Survey
              </button>
            </div>
          </div>

          {/* Footer Credit */}
          <div className="mt-20 pt-8 border-t border-slate-200 dark:border-slate-800 light:border-slate-200 text-center text-slate-500 dark:text-slate-400 light:text-slate-600 text-sm">
            <p>
              © 2026 Smart Advisor. AI-powered entertainment recommendations.
            </p>
            <p className="mt-2">
              Built with Aceternity UI components and Next.js
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index.
