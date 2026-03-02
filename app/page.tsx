"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ParallaxHeroImages } from "@/components/ui/parallax-hero-images";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { LinkPreview } from "@/components/ui/link-preview";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "motion/react";
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
            onClick={() => router.push("/questionnaire?type=movie")}
            className={cn(
              "px-8 py-3 text-white font-semibold rounded-full transition-all duration-300",
              "bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-500 dark:to-pink-500",
              "hover:from-red-700 hover:to-pink-700 dark:hover:from-red-600 dark:hover:to-pink-600",
              "shadow-lg hover:shadow-red-500/50 hover:scale-105 transform",
            )}
          >
            🎬 Movie Survey
          </button>
          <button
            onClick={() => router.push("/questionnaire?type=book")}
            className={cn(
              "px-8 py-3 text-white font-semibold rounded-full transition-all duration-300",
              "bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-500 dark:to-orange-500",
              "hover:from-amber-700 hover:to-orange-700 dark:hover:from-amber-600 dark:hover:to-orange-600",
              "shadow-lg hover:shadow-amber-500/50 hover:scale-105 transform",
            )}
          >
            📚 Book Survey
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
    user ? router.push("/history") : router.push("/auth");
  };

  const handleSignIn = () => {
    user ? router.push("/history") : router.push("/auth");
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
                Start Survey
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

      <section className="py-20 md:py-32 px-4 md:px-6 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white transition-colors duration-300">
              Powered By
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg transition-colors duration-300">
              Built with cutting-edge AI and technologies
            </p>
          </div>

          {/* Animated Skeleton Card */}
          <div className="max-w-2xl mx-auto">
            <div
              className={cn(
                "w-full mx-auto p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50",
                "shadow-[2px_4px_16px_0px_rgba(248,248,248,0.06)_inset] dark:shadow-[2px_4px_16px_0px_rgba(0,0,0,0.4)_inset]",
                "transition-colors duration-300"
              )}
            >
              {/* Skeleton Container */}
              <div
                className={cn(
                  "h-[15rem] md:h-[20rem] rounded-xl z-40 mb-6",
                  "bg-slate-100 dark:bg-slate-800 [mask-image:radial-gradient(50%_50%_at_50%_50%,white_0%,transparent_100%)]",
                  "transition-colors duration-300"
                )}
              >
                <div className="p-8 overflow-hidden h-full relative flex items-center justify-center">
                  {/* AI Provider Logo Circles */}
                  <div className="flex flex-row shrink-0 justify-center items-center gap-2 md:gap-4">
                    <div className="circle-1 h-8 w-8 md:h-12 md:w-12 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-300 to-amber-400 dark:from-amber-700 dark:to-amber-800 shadow-[0px_0px_8px_0px_rgba(248,248,248,0.25)_inset] transition-all duration-300">
                      <span className="text-xs md:text-sm font-bold text-slate-900">C</span>
                    </div>
                    <div className="circle-2 h-10 w-10 md:h-14 md:w-14 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-500 dark:from-blue-700 dark:to-blue-800 shadow-[0px_0px_8px_0px_rgba(248,248,248,0.25)_inset] transition-all duration-300">
                      <span className="text-xl md:text-2xl">⚡</span>
                    </div>
                    <div className="circle-3 h-12 w-12 md:h-16 md:w-16 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-purple-500 dark:from-purple-700 dark:to-purple-800 shadow-[0px_0px_8px_0px_rgba(248,248,248,0.25)_inset] transition-all duration-300">
                      <span className="text-2xl md:text-3xl">🤖</span>
                    </div>
                    <div className="circle-4 h-10 w-10 md:h-14 md:w-14 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 shadow-[0px_0px_8px_0px_rgba(248,248,248,0.25)_inset] transition-all duration-300">
                      <span className="text-xl md:text-2xl">f</span>
                    </div>
                    <div className="circle-5 h-8 w-8 md:h-12 md:w-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-300 to-blue-400 dark:from-blue-700 dark:to-blue-800 shadow-[0px_0px_8px_0px_rgba(248,248,248,0.25)_inset] transition-all duration-300">
                      <span className="text-xs md:text-sm font-bold text-slate-900">G</span>
                    </div>
                  </div>

                  {/* Vertical Glowing Beam */}
                  <div className="h-40 w-px absolute top-20 m-auto z-40 bg-gradient-to-b from-transparent via-cyan-400 dark:via-cyan-500 to-transparent animate-move">
                    <div className="w-10 h-32 top-1/2 -translate-y-1/2 absolute -left-10">
                      {/* Sparkle Particles */}
                      <div className="absolute inset-0">
                        {[...Array(12)].map((_, i) => {
                          const randomMove = () => Math.random() * 2 - 1;
                          const randomOpacity = () => Math.random();
                          const random = () => Math.random();
                          return (
                            <motion.span
                              key={`star-${i}`}
                              animate={{
                                top: `calc(${random() * 100}% + ${randomMove()}px)`,
                                left: `calc(${random() * 100}% + ${randomMove()}px)`,
                                opacity: randomOpacity(),
                                scale: [1, 1.2, 0],
                              }}
                              transition={{
                                duration: random() * 2 + 4,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              style={{
                                position: "absolute",
                                top: `${random() * 100}%`,
                                left: `${random() * 100}%`,
                                width: `2px`,
                                height: `2px`,
                                borderRadius: "50%",
                                zIndex: 1,
                              }}
                              className="inline-block bg-slate-400 dark:bg-slate-200"
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white mb-3 transition-colors duration-300">
                  AI-Powered Stack
                </h3>
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 transition-colors duration-300">
                  Our platform integrates multiple AI providers (Claude, Copilot, OpenAI, Meta, Gemini) with comprehensive databases to deliver personalized movie and book recommendations.
                </p>
              </div>
            </div>
          </div>

          {/* Provider Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-16">
            {[
              { name: "Claude", icon: "🧠", color: "amber" },
              { name: "Copilot", icon: "⚡", color: "blue" },
              { name: "OpenAI", icon: "🤖", color: "purple" },
              { name: "Meta", icon: "f", color: "blue" },
              { name: "Gemini", icon: "G", color: "cyan" },
            ].map((provider, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center hover:shadow-md dark:hover:shadow-md hover:shadow-slate-900/10 dark:hover:shadow-blue-500/10 transition-all duration-300 hover:scale-105 transform"
              >
                <div className="text-2xl mb-2">{provider.icon}</div>
                <p className="font-medium text-slate-900 dark:text-white text-sm transition-colors duration-300">
                  {provider.name}
                </p>
              </div>
            ))}
          </div>

          {/* Tech Stack Additional Info */}
          <div className="mt-16 p-6 md:p-8 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 transition-colors duration-300">
            <h3 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white mb-4 transition-colors duration-300">
              Complete Integration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm md:text-base text-slate-700 dark:text-slate-300 transition-colors duration-300">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white mb-2">AI & Language Models</p>
                <p>Multiple cutting-edge AI providers for intelligent question generation and recommendations</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white mb-2">Data & Infrastructure</p>
                <p>TMDB, Google Books APIs, and Supabase for secure, comprehensive data and storage</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-20 px-4 md:px-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/50 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          {/* CTA Section */}
          <div className="text-center mb-20 pb-16 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white transition-colors duration-300">
              Start Your Discovery
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto transition-colors duration-300">
              Ready to find your next favorite? Check out our{" "}
              <LinkPreview
                url="/questionnaire?type=movie"
                className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300"
              >
                movie survey
              </LinkPreview>{" "}
              or{" "}
              <LinkPreview
                url="/questionnaire?type=book"
                className="font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-300"
              >
                book survey
              </LinkPreview>
              .
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push("/questionnaire?type=movie")}
                className={cn(
                  "px-8 py-3 text-white font-semibold rounded-full transition-all duration-300",
                  "bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-500 dark:to-pink-500",
                  "hover:from-red-700 hover:to-pink-700 dark:hover:from-red-600 dark:hover:to-pink-600",
                  "shadow-lg hover:shadow-red-500/50 hover:scale-105 transform",
                )}
              >
                🎬 Movie Survey
              </button>
              <button
                onClick={() => router.push("/questionnaire?type=book")}
                className={cn(
                  "px-8 py-3 text-white font-semibold rounded-full transition-all duration-300",
                  "bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-500 dark:to-orange-500",
                  "hover:from-amber-700 hover:to-orange-700 dark:hover:from-amber-600 dark:hover:to-orange-600",
                  "shadow-lg hover:shadow-amber-500/50 hover:scale-105 transform",
                )}
              >
                📚 Book Survey
              </button>
            </div>
          </div>

          {/* Languages & Technologies Section */}
          <div className="mb-16">
            <h3 className="text-2xl md:text-3xl font-bold text-center text-slate-900 dark:text-white mb-12 transition-colors duration-300">
              Languages & Technologies Used
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Frontend Technologies */}
              <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-8 transition-all duration-300 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 transition-colors duration-300">
                  <span className="text-2xl">⚡</span> Frontend
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "React", icon: "⚛️" },
                    { name: "TypeScript", icon: "📘" },
                    { name: "Next.js", icon: "▲" },
                    { name: "Tailwind CSS", icon: "🎨" },
                    { name: "Motion", icon: "✨" },
                    { name: "Lucide Icons", icon: "🎯" },
                  ].map((tech, idx) => (
                    <a
                      key={idx}
                      href="#"
                      className={cn(
                        "p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
                        "hover:border-blue-400 dark:hover:border-blue-400 transition-all duration-300",
                        "hover:shadow-md dark:hover:shadow-blue-500/10",
                        "flex items-center gap-3 group",
                      )}
                    >
                      <span className="text-xl transition-transform duration-300 group-hover:scale-125">
                        {tech.icon}
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {tech.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Backend & Infrastructure */}
              <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-8 transition-all duration-300 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 transition-colors duration-300">
                  <span className="text-2xl">🔧</span> Backend & Infrastructure
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "Supabase", icon: "🗄️" },
                    { name: "PostgreSQL", icon: "🐘" },
                    { name: "Node.js", icon: "🟢" },
                    { name: "Anthropic API", icon: "🤖" },
                    { name: "TMDB API", icon: "🎬" },
                    { name: "Google Books", icon: "📚" },
                  ].map((tech, idx) => (
                    <a
                      key={idx}
                      href="#"
                      className={cn(
                        "p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
                        "hover:border-green-400 dark:hover:border-green-400 transition-all duration-300",
                        "hover:shadow-md dark:hover:shadow-green-500/10",
                        "flex items-center gap-3 group",
                      )}
                    >
                      <span className="text-xl transition-transform duration-300 group-hover:scale-125">
                        {tech.icon}
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 transition-colors duration-300 group-hover:text-green-600 dark:group-hover:text-green-400">
                        {tech.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Credit */}
          <div className="pt-12 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-slate-600 dark:text-slate-400 transition-colors duration-300">
              © 2026 Smart Advisor. AI-powered entertainment recommendations.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-3 transition-colors duration-300">
              Built with Aceternity UI components, Next.js, and modern web
              technologies.
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
