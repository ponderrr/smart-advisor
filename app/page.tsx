"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconBrandGithub,
  IconChevronDown,
} from "@tabler/icons-react";

import { useAuth } from "@/hooks/useAuth";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
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
import { cn } from "@/lib/utils";
import {
  faqItems,
  howItWorksCards,
  logoSets,
  navItems,
  teamMembers,
} from "@/data/homepage";

export default function Index() {
  const router = useRouter();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleGetStarted = () =>
    user ? router.push("/content-selection") : router.push("/auth");

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <Navbar>
        <NavBody>
          <div className="flex flex-1 items-center">
            <NavbarLogo />
          </div>

          <NavItems items={navItems} className="justify-center" />

          <div className="flex flex-1 items-center justify-end gap-6 pl-8">
            <ThemeToggle />
            <HoverBorderGradient
              onClick={handleGetStarted}
              containerClassName="rounded-full"
              className="whitespace-nowrap bg-white px-6 py-2.5 text-base font-black leading-none tracking-tighter text-black dark:bg-black dark:text-white"
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
                onClick={(event) => {
                  if (item.link.startsWith("#")) {
                    event.preventDefault();
                    document
                      .querySelector(item.link)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                  setIsMobileMenuOpen(false);
                }}
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

      <section id="how-it-works" className="scroll-mt-32 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="mb-4 mt-5 text-4xl font-black tracking-tighter md:text-5xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-400 md:text-lg">
              A focused, three-step flow designed to turn uncertainty into confident picks.
            </p>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
            {howItWorksCards.map((card, idx) => (
              <article
                key={card.title}
                className={cn(
                  "group relative h-[26rem] w-full overflow-hidden rounded-3xl border border-slate-200/70 p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl",
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
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/25 to-cyan-400/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative z-10 flex h-full flex-col justify-end">
                  <span className="mb-4 inline-flex w-fit rounded-full bg-white/90 px-3 py-1 text-xs font-black tracking-[0.16em] text-slate-900 shadow-sm">
                    STEP 0{idx + 1}
                  </span>
                  <h3 className="text-2xl font-black tracking-tight text-white md:text-[1.75rem]">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-100 md:text-base">
                    {card.description}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-slate-200/95 md:text-sm">
                    {card.detail}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="powered-by" className="scroll-mt-32 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="mb-4 mt-5 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 bg-clip-text text-4xl font-black tracking-tighter text-transparent md:text-5xl">
              Powered By
            </h2>
            <p className="mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-400 md:text-lg">
              Trusted tools and APIs that keep Smart Advisor fast, reliable, and context aware.
            </p>
          </div>
          <RotatingLogoSets />
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
              </a>
              .
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

      <section id="meet-the-team" className="scroll-mt-32 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="mb-24 text-4xl font-black tracking-tighter md:text-5xl">
            Meet the Team
          </h2>
          <AnimatedTestimonials testimonials={teamMembers} autoplay />
        </div>
      </section>

      <footer className="px-6 py-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-center">
            <a href="/" className="group flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-indigo-600 transition-transform group-hover:rotate-12" />
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Smart Advisor
              </span>
            </a>
          </div>

          <nav className="mt-8">
            <ul className="flex flex-col items-center justify-center gap-4 text-sm font-medium text-slate-700 dark:text-slate-300 md:flex-row md:gap-8">
              {["Products", "Studio", "Clients", "Pricing", "Blog", "Privacy", "Terms"].map((item) => (
                <li key={item}>
                  <a href="#" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-10 grid grid-cols-1 items-center gap-5 text-xs text-slate-500 dark:text-slate-400 md:grid-cols-3">
            <p className="text-center md:text-left">© 2026 Smart Advisor. All rights reserved.</p>
            <p className="text-center text-sm text-slate-700 dark:text-slate-300">
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
            </p>
            <div className="flex items-center justify-center gap-4 md:justify-end">
              <a href="#" aria-label="GitHub" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
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
          className="flex flex-wrap items-center justify-center gap-8"
        >
          {logoSets[activeSet].map((logo, index) => (
            <motion.div
              key={logo.name}
              initial={{ y: 40, opacity: 0, filter: "blur(10px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -40, opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.45, delay: index * 0.1, ease: "easeOut" }}
              className="flex min-w-[140px] items-center justify-center"
            >
              {logo.src ? (
                <img
                  src={logo.src}
                  alt={logo.name}
                  className="h-10 w-auto dark:invert"
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
