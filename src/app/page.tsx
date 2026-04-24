"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  IconBrandGithub,
  IconChevronDown,
  IconLayoutGrid,
  IconAdjustmentsHorizontal,
  IconMessageCircleQuestion,
  IconSparkles,
} from "@tabler/icons-react";
import { LinkPreview } from "@/components/ui/link-preview";
import FeaturesSectionDemo from "@/components/features-section-demo-3";
import { AppNavbar } from "@/components/app-navbar";
import { HeroSection } from "@/features/home/components";
import { cn } from "@/lib/utils";
import { faqItems, logoSets, teamMembers } from "@/features/home/data";

const HOW_IT_WORKS_STEPS = [
  {
    Icon: IconLayoutGrid,
    title: "Pick your format",
    description:
      "Tell us if you're in the mood for a movie, a book, or both. We tailor the rest of the flow to whichever you choose.",
  },
  {
    Icon: IconAdjustmentsHorizontal,
    title: "Set your depth",
    description:
      "Choose how many questions you want to answer — a quick taste check or a deep dive, your call.",
  },
  {
    Icon: IconMessageCircleQuestion,
    title: "Answer a personalized quiz",
    description:
      "Our AI generates fresh questions tuned to your age and content type. No two quizzes are the same.",
  },
  {
    Icon: IconSparkles,
    title: "Get your picks",
    description:
      "Real recommendations with a match score and a written reason for why each one fits you specifically.",
  },
] as const;

const HowItWorksSection = () => (
  <section
    id="how-it-works"
    className="scroll-mt-32 bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 md:py-24 dark:bg-slate-950"
  >
    <div className="mx-auto max-w-6xl">
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-500 dark:text-indigo-400">
          How It Works
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tighter sm:text-4xl md:text-5xl">
          From indecision to a great pick in four steps
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-400">
          A faster way to land on a watch or read worth your time.
        </p>
      </div>

      {/* Card grid with a subtle horizontal connector behind them */}
      <div className="relative mt-10 sm:mt-12 md:mt-16">
        {/* Horizontal flow line behind the cards (desktop only) */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-12 right-12 top-12 hidden h-px bg-gradient-to-r from-transparent via-indigo-200/80 to-transparent lg:block dark:via-indigo-500/30"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {HOW_IT_WORKS_STEPS.map((step, index) => {
            const Icon = step.Icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group relative"
              >
                {/* Gradient border that brightens on hover */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-200/40 via-transparent to-violet-200/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:from-indigo-500/30 dark:via-transparent dark:to-violet-500/20" />

                <div className="relative flex h-full flex-col rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-sm backdrop-blur-md transition-all duration-300 group-hover:-translate-y-1 group-hover:border-indigo-200 group-hover:shadow-lg sm:p-6 md:p-7 dark:border-slate-700/60 dark:bg-slate-900/65 dark:group-hover:border-indigo-500/40">
                  {/* Step number — large, gradient, sits in the corner */}
                  <span className="absolute right-5 top-5 bg-gradient-to-br from-indigo-500 to-violet-500 bg-clip-text text-4xl font-black leading-none tracking-tighter text-transparent opacity-30 transition-opacity duration-300 group-hover:opacity-100 sm:right-6 sm:top-6 sm:text-5xl dark:from-indigo-400 dark:to-violet-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {/* Icon in a tinted square */}
                  <div className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 text-indigo-600 shadow-inner ring-1 ring-indigo-200/60 sm:h-14 sm:w-14 dark:from-indigo-500/20 dark:to-indigo-500/5 dark:text-indigo-300 dark:ring-indigo-500/30">
                    <Icon size={24} strokeWidth={1.75} />
                  </div>

                  {/* Title */}
                  <h3 className="mt-5 text-lg font-black tracking-tight text-slate-900 sm:mt-6 sm:text-xl dark:text-slate-100">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:mt-3 dark:text-slate-400">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  </section>
);

const Index = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const smoothScrollToSection = (selector: string) => {
    const section = document.querySelector(selector) as HTMLElement | null;
    if (!section) return;
    const navbar = document.querySelector(
      "[data-main-navbar='true']",
    ) as HTMLElement | null;
    const offset = (navbar?.offsetHeight ?? 96) + 16;
    const top = section.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      {/* Hero Section */}
      <HeroSection />

      {/* HOW IT WORKS SECTION */}
      <HowItWorksSection />

      {/* Features Section */}
      <FeaturesSectionDemo />

      {/* Powered By */}
      <section
        id="powered-by"
        className="scroll-mt-32 px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center sm:mb-10 md:mb-14">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-500 dark:text-indigo-400">
              Powered By
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tighter text-slate-900 sm:text-4xl md:text-5xl dark:text-slate-100">
              Built on trusted infrastructure
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-sm text-slate-600 sm:text-base md:whitespace-nowrap md:text-lg dark:text-slate-400">
              Trusted services that help Smart Advisor stay fast, dependable,
              and helpful.
            </p>
          </div>
          <RotatingLogoSets />
        </div>
      </section>

      {/* Meet The Team */}
      <section
        id="meet-the-team"
        className="relative scroll-mt-32 overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:py-28"
      >
        {/* Light grid background — horizontal + vertical guide lines */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:48px_48px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]"
        />
        {/* Soft radial mask so the grid fades at the edges */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(248,250,252,0.95)_85%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(2,6,23,0.95)_85%)]"
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-500 dark:text-indigo-400">
              The People
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tighter sm:text-4xl md:text-5xl">
              Meet the Team
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-400">
              The folks behind Smart Advisor.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 md:mt-16 md:gap-6 lg:grid-cols-3">
            {teamMembers.map((member, index) => (
              <motion.article
                key={member.name}
                // SSR-safe initial style — matches the framer initial state so
                // the first paint is already hidden, no visible→hidden→visible
                // flicker on hydration.
                style={{ opacity: 0, transform: "translateY(16px)" }}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-sm backdrop-blur-md transition-[border,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg sm:p-6 dark:border-slate-700/60 dark:bg-slate-900/65 dark:hover:border-indigo-500/40"
              >
                {/* Photo */}
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800">
                  <Image
                    src={member.src}
                    alt={member.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Name + role */}
                <div className="mt-4 sm:mt-5">
                  <h3 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl dark:text-slate-100">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                    {member.designation}
                  </p>
                </div>

                {/* Quote */}
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:mt-4 dark:text-slate-400">
                  &ldquo;{member.quote}&rdquo;
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="scroll-mt-32 px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:py-28"
      >
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center sm:mb-10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-500 dark:text-indigo-400">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tighter sm:text-4xl md:text-5xl">
              Questions, answered
            </h2>
            <p className="mx-auto mt-4 max-w-2xl break-words text-sm text-slate-600 dark:text-slate-400 md:text-base">
              Questions before you get started? Reach out at{" "}
              <a
                href="mailto:support@smartadvisor.live"
                className="break-all text-blue-600 underline underline-offset-2 dark:text-blue-400"
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
              . Smart Advisor is open source, so you can review and contribute
              anytime.
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
                    aria-expanded={isOpen}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors sm:px-5 sm:py-4",
                      isOpen
                        ? "bg-slate-100 dark:bg-slate-800/80"
                        : "bg-white dark:bg-slate-900/60",
                    )}
                  >
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 md:text-base">
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
                        transition={{
                          duration: 0.25,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="overflow-hidden"
                      >
                        <p className="bg-white px-4 pb-4 pt-1 text-sm leading-relaxed text-slate-600 sm:px-5 sm:pb-5 dark:bg-slate-900/60 dark:text-slate-300">
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

      {/* Footer */}
      <footer className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Footer navigation">
            <ul className="flex flex-col items-center justify-center gap-3 text-sm font-medium text-slate-700 sm:gap-4 md:flex-row md:gap-8 dark:text-slate-300">
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
                    className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-8 grid grid-cols-1 items-center gap-4 text-xs text-slate-500 sm:mt-10 sm:gap-5 md:grid-cols-3 dark:text-slate-400">
            <p className="text-center md:text-left">
              © 2026 Smart Advisor. All rights reserved.
            </p>
            <div className="text-center text-sm text-slate-700 md:whitespace-nowrap dark:text-slate-300">
              Built with{" "}
              <LinkPreview
                url="https://react.dev"
                className="font-semibold text-slate-900 dark:text-slate-100"
              >
                React
              </LinkPreview>
              ,{" "}
              <LinkPreview
                url="https://nextjs.org"
                className="font-semibold text-slate-900 dark:text-white"
              >
                Next.js
              </LinkPreview>
              , and{" "}
              <LinkPreview
                url="https://www.typescriptlang.org"
                className="font-semibold text-slate-900 dark:text-slate-100"
              >
                TypeScript
              </LinkPreview>{" "}
              as an open-source project.
            </div>
            <div className="flex items-center justify-center gap-4 md:justify-end">
              <a
                href="https://github.com/ponderrr/smart-advisor"
                aria-label="GitHub"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <IconBrandGithub className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Rotating Logos Component
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
              transition={{
                duration: 0.45,
                delay: index * 0.1,
                ease: "easeOut",
              }}
              className="flex h-16 min-w-[150px] items-center justify-center"
            >
              {logo.src ? (
                <img
                  src={logo.src}
                  alt={logo.name}
                  className={cn(
                    "w-auto object-contain grayscale brightness-0 transition dark:invert",
                    logo.name === "Open Library"
                      ? "h-12 md:h-[3.25rem]"
                      : "h-10 md:h-11",
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

export default Index;
