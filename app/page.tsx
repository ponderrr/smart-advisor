"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconBrandGithub,
  IconChevronDown,
} from "@tabler/icons-react";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { LinkPreview } from "@/components/ui/link-preview";
import { BrandWordmark } from "@/components/brand-wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import FeaturesSectionDemo from "@/components/features-section-demo-3";
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
import { HeroSection } from "@/features/home/components";
import { cn } from "@/lib/utils";
import {
  faqItems,
  howItWorksCards,
  logoSets,
  teamMembers,
} from "@/features/home/data";

const howItWorksInteractive = [
  {
    title: "Share Your Mood",
    description: "Pick what you want right now in a few quick taps.",
    detail: "Choose genres, tone, and discovery level so recommendations feel personal from the start.",
  },
  {
    title: "Get Movie + Book Matches",
    description: "We surface both movie and book options together.",
    detail: "See two formats side by side so you can choose what fits your time and attention.",
  },
  {
    title: "Pick With Confidence",
    description: "Each result is clear, focused, and easy to compare.",
    detail: "No endless scrolling. You get context-aware picks you can act on immediately.",
  },
];

const howItWorksVideos = [
  "/animations/security-status-safe.webm",
  "/animations/Popcorn.webm",
  "/animations/Books.webm",
];

export default function Index() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeHowItWorks, setActiveHowItWorks] = useState(0);

  const handleGetStarted = () =>
    user ? router.push("/dashboard") : router.push("/auth");
  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const homeNavItems = user
    ? [
      { name: "Dashboard", link: "/dashboard" },
      { name: "History", link: "/history" },
      { name: "Settings", link: "/settings" },
    ]
    : [
      { name: "How It Works", link: "#how-it-works" },
      { name: "Why Smart Advisor", link: "#why-smart-advisor" },
      { name: "Powered By", link: "#powered-by" },
      { name: "Our Team", link: "#meet-the-team" },
      { name: "FAQ", link: "#faq" },
    ];

  const smoothScrollToSection = (selector: string) => {
    const section = document.querySelector(selector) as HTMLElement | null;
    if (!section) return;
    const navbar = document.querySelector("[data-main-navbar='true']") as HTMLElement | null;
    const offset = (navbar?.offsetHeight ?? 96) + 16;
    const top = section.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <Navbar>
        <NavBody>
          <div className="flex min-w-0 flex-1 items-center">
            <NavbarLogo />
          </div>

          <div className="flex shrink-0 justify-center px-6">
            <NavItems items={homeNavItems} className="justify-center px-2" />
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
            <ThemeToggle />
            {user && (
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm font-bold tracking-tight text-slate-700 transition-colors hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400"
              >
                Sign Out
              </button>
            )}
            {!user && (
              <HoverBorderGradient
                onClick={handleGetStarted}
                idleColor="17, 24, 39"
                darkIdleColor="255, 255, 255"
                highlightColor="139, 92, 246"
                darkHighlightColor="167, 139, 250"
                containerClassName="rounded-full"
                className="whitespace-nowrap bg-white px-6 py-2.5 text-base font-black leading-none tracking-tighter text-black dark:bg-black dark:text-white"
              >
                Get Started
              </HoverBorderGradient>
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
            {homeNavItems.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  if (item.link.startsWith("#")) {
                    smoothScrollToSection(item.link);
                  } else {
                    router.push(item.link);
                  }
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-xl font-black tracking-tight text-slate-800 dark:text-slate-100"
              >
                {item.name}
              </button>
            ))}
            {!user && (
              <HoverBorderGradient
                onClick={handleGetStarted}
                idleColor="17, 24, 39"
                darkIdleColor="255, 255, 255"
                highlightColor="139, 92, 246"
                darkHighlightColor="167, 139, 250"
                containerClassName="mt-2 w-full rounded-full"
                className="w-full py-4 text-center text-xs font-black uppercase tracking-widest"
              >
                Get Started
              </HoverBorderGradient>
            )}
            {user && (
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

      <HeroSection />

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="scroll-mt-32 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="mb-4 mt-5 text-4xl font-black tracking-tighter md:text-5xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-400 md:text-lg">
              A faster way to go from indecision to a great watch or read.
            </p>
          </div>

          <motion.div
            key={activeHowItWorks}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={cn(
              "relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md md:p-6",
              "dark:border-slate-700/70 dark:bg-slate-900/65",
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Video Walkthrough
                </p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 md:text-3xl">
                  {howItWorksInteractive[activeHowItWorks].title}
                </h3>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-black dark:border-slate-700/70">
              <video
                key={`how-step-${activeHowItWorks}`}
                className="aspect-video w-full"
                controls
                muted
                playsInline
                preload="metadata"
                src={howItWorksVideos[activeHowItWorks] ?? howItWorksVideos[0]}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
              {howItWorksInteractive.map((step, idx) => {
                const isActive = idx === activeHowItWorks;
                return (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => setActiveHowItWorks(idx)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                      isActive
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800",
                    )}
                  >
                    Step {idx + 1}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
              {howItWorksInteractive[activeHowItWorks].description}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 md:text-sm">
              {howItWorksInteractive[activeHowItWorks].detail}
            </p>
          </motion.div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            {howItWorksCards.map((card, idx) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                className={cn(
                  "rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-700 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-300",
                )}
              >
                {card.detail}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <FeaturesSectionDemo />

      <section id="powered-by" className="scroll-mt-32 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="mb-4 mt-5 text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-100 md:text-5xl">
              Powered By
            </h2>
            <p className="mx-auto max-w-3xl text-base text-slate-600 dark:text-slate-400 md:whitespace-nowrap md:text-lg">
              Trusted services that help Smart Advisor stay fast, dependable, and helpful.
            </p>
          </div>
          <RotatingLogoSets />
        </div>
      </section>

      <section id="meet-the-team" className="scroll-mt-32 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="mb-24 text-4xl font-black tracking-tighter md:text-5xl">
            Meet the Team
          </h2>
          <AnimatedTestimonials testimonials={teamMembers} autoplay showArrows={false} />
        </div>
      </section>

      <section id="faq" className="scroll-mt-32 px-6 py-24 md:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-black tracking-tighter md:text-5xl">FAQ</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 dark:text-slate-400 md:text-base">
              Questions before you get started? Reach out at{" "}
              <a
                href="mailto:support@smartadvisor.live"
                className="text-blue-600 underline underline-offset-2 dark:text-blue-400"
              >
                support@smartadvisor.live
              </a>{" "}
              or report bugs on{" "}
              <a
                href="https://github.com/ponderrr/smart-advisor/issues"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline underline-offset-2 dark:text-blue-400"
              >
                GitHub
              </a>
              . Smart Advisor is open source, so you can review and contribute anytime.
            </p>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={item.question}
                  className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-700/70"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className={cn(
                      "flex w-full items-center justify-between px-5 py-4 text-left transition-colors",
                      isOpen
                        ? "bg-slate-100 dark:bg-slate-800/80"
                        : "bg-white dark:bg-slate-900/60",
                    )}
                  >
                    <span className="pr-4 text-sm font-semibold text-slate-900 dark:text-slate-100 md:text-base">
                      {item.question}
                    </span>
                    <IconChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-slate-500 transition-transform duration-300",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="bg-white px-5 pb-5 pt-1 text-sm leading-relaxed text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="px-6 py-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-center">
            <a
              href="/"
              onClick={(event) => {
                if (typeof window !== "undefined" && window.location.pathname === "/") {
                  event.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="group inline-flex items-center transition-opacity hover:opacity-85"
            >
              <BrandWordmark imageClassName="h-10 md:h-11" />
            </a>
          </div>

          <nav className="mt-8">
            <ul className="flex flex-col items-center justify-center gap-4 text-sm font-medium text-slate-700 dark:text-slate-300 md:flex-row md:gap-8">
              {[
                { label: "How It Works", href: "#how-it-works" },
                { label: "Why Smart Advisor", href: "#why-smart-advisor" },
                { label: "Powered By", href: "#powered-by" },
                { label: "Our Team", href: "#meet-the-team" },
                { label: "FAQ", href: "#faq" },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => smoothScrollToSection(item.href)}
                    className="transition-colors hover:text-rose-600 dark:hover:text-rose-400"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-10 grid grid-cols-1 items-center gap-5 text-xs text-slate-500 dark:text-slate-400 md:grid-cols-3">
            <p className="text-center md:text-left">© 2026 Smart Advisor. All rights reserved.</p>
            <div className="whitespace-nowrap text-center text-sm text-slate-700 dark:text-slate-300">
              Built with{" "}
              <LinkPreview url="https://react.dev" className="font-semibold text-slate-900 dark:text-slate-100">
                React
              </LinkPreview>
              ,{" "}
              <LinkPreview url="https://nextjs.org" className="font-semibold text-slate-900 dark:text-white">
                Next.js
              </LinkPreview>
              , and{" "}
              <LinkPreview url="https://www.typescriptlang.org" className="font-semibold text-slate-900 dark:text-slate-100">
                TypeScript
              </LinkPreview>
              {" "}as an open-source project.
            </div>
            <div className="flex items-center justify-center gap-4 md:justify-end">
              <a
                href="https://github.com/ponderrr/smart-advisor"
                aria-label="GitHub"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-rose-600 dark:hover:text-rose-400"
              >
                <IconBrandGithub className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const RotatingLogoSets = () => {
  const [activeSet, setActiveSet] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSet((prev) => (prev + 1) % logoSets.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto max-w-5xl p-2">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`logo-set-${activeSet}`}
          className="flex min-h-20 flex-wrap items-center justify-center gap-8"
        >
          {logoSets[activeSet].map((logo, index) => (
            <motion.div
              key={logo.name}
              initial={{ y: 40, opacity: 0, filter: "blur(10px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -40, opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.45, delay: index * 0.1, ease: "easeOut" }}
              className="flex h-16 min-w-[150px] items-center justify-center"
            >
              {logo.src ? (
                <img
                  src={logo.src}
                  alt={logo.name}
                  className={cn(
                    "w-auto object-contain grayscale brightness-0 transition dark:invert",
                    logo.name === "Google Books" ? "h-12 md:h-[3.25rem]" : "h-10 md:h-11",
                  )}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="text-sm font-bold uppercase tracking-[0.18em] text-slate-900 dark:text-slate-100">
                  {logo.name}
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
