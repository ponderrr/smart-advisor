"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandLinkedin,
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

const howItWorksCards = [
  {
    title: "Share Your Taste",
    description:
      "Tell Smart Advisor what mood, genre, and pacing you want in under a minute.",
    image:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
    detail:
      "Adaptive prompts tune recommendations to your current intent, not generic history.",
  },
  {
    title: "AI Refines Context",
    description:
      "Our engine combines your answers with trusted book and movie metadata in real time.",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1616530940355-351fabd9524b?auto=format&fit=crop&w=1200&q=80",
    detail:
      "Context-aware ranking boosts relevance so your first picks feel immediately right.",
  },
  {
    title: "Get Curated Picks",
    description:
      "Receive ranked books and movies with plain-language reasons for every recommendation.",
    image:
      "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1200&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=1200&q=80",
    detail:
      "Save favorites, compare options fast, and discover your next obsession without scrolling for hours.",
  },
];

const poweredCards = [
  {
    title: "AI Conversation Engine",
    description:
      "Live recommendation dialogue inspired by your current intent and feedback.",
    skeleton: "chat",
  },
  {
    title: "Poster + Cover Review",
    description:
      "Side-by-side media previews with focus indicators for faster decisions.",
    skeleton: "video",
  },
  {
    title: "Community Taste Clusters",
    description:
      "Floating profile groups surface what similar users are loving right now.",
    skeleton: "avatars",
  },
  {
    title: "Recommendation Mentor Loop",
    description:
      "Guided tips and explainers that move continuously with your session context.",
    skeleton: "marquee",
  },
  {
    title: "Metadata Sync Layer",
    description:
      "Realtime enrichment from TMDB and Google Books keeps picks sharp.",
    skeleton: "chat",
  },
  {
    title: "Collaborative Ranking",
    description:
      "Signals from user actions continuously rebalance what appears first.",
    skeleton: "video",
  },
] as const;

const faqItems = [
  {
    question: "How does Smart Advisor personalize recommendations?",
    answer:
      "We combine your answers with trusted metadata from movie and book providers, then rank results to match your mood, genre preferences, and discovery intent.",
  },
  {
    question: "Do I need to complete a long onboarding flow?",
    answer:
      "No. The flow is intentionally short. You can answer quickly and still get high-quality recommendations with clear reasoning behind each pick.",
  },
  {
    question: "Can I use Smart Advisor for both movies and books?",
    answer:
      "Yes. You can discover movies, books, or both in the same experience, and your recommendation history is saved for future sessions.",
  },
  {
    question: "Is my account required to use the app?",
    answer:
      "You can explore the landing page without an account, but signing in unlocks saved history, favorites, and a consistent recommendation profile.",
  },
  {
    question: "What if recommendations feel off for me?",
    answer:
      "You can rerun the questionnaire and adjust answers. The engine is designed to quickly adapt to changing preferences and contexts.",
  },
];

const teamMembers = [
  {
    quote:
      "The question flow feels personal and fast. I got movie picks I actually wanted to watch tonight.",
    name: "AI Engine",
    designation: "Smart Questionnaire Layer",
    src: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=900&q=80",
  },
  {
    quote:
      "Metadata enrichment from TMDB makes recommendations feel complete, not generic placeholders.",
    name: "TMDB API",
    designation: "Movie Intelligence",
    src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=900&q=80",
  },
  {
    quote:
      "Google Books data fills in strong context so users can discover their next read with confidence.",
    name: "Google Books",
    designation: "Book Intelligence",
    src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=900&q=80",
  },
  {
    quote:
      "Persistent user history and favorites make the experience feel like a real product from day one.",
    name: "Supabase",
    designation: "Data & Auth Backbone",
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=900&q=80",
  },
];

export default function Index() {
  const router = useRouter();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleGetStarted = () =>
    user ? router.push("/content-selection") : router.push("/auth");

  const navItems = [
    { name: "How It Works", link: "#how-it-works" },
    { name: "Powered By", link: "#powered-by" },
    { name: "FAQ", link: "#faq" },
    { name: "Our Team", link: "#meet-the-team" },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <Navbar>
        <NavBody>
          <div className="flex flex-1 items-center">
            <NavbarLogo />
          </div>

          <NavItems items={navItems} className="justify-center" />

          <div className="flex flex-1 items-center justify-end gap-6">
            <ThemeToggle />
            <HoverBorderGradient
              onClick={handleGetStarted}
              containerClassName="rounded-full"
              className="bg-white px-6 py-2 text-sm font-black tracking-tighter text-black transition-colors hover:bg-indigo-600 hover:text-white dark:bg-black dark:text-white"
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
              className="w-full py-4 text-center text-xs font-black uppercase tracking-widest transition-colors hover:bg-indigo-600 hover:text-white"
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
            <h2 className="mb-4 mt-5 text-4xl font-black tracking-tighter md:text-5xl">
              Powered By
            </h2>
            <p className="mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-400 md:text-lg">
              Interactive infrastructure previews of the systems that keep Smart Advisor fast and personalized.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {poweredCards.map((card) => (
              <article
                key={`${card.title}-${card.skeleton}`}
                className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70"
              >
                <div className="relative h-52 overflow-hidden rounded-xl bg-slate-100/80 p-3 [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)] dark:bg-slate-800/70">
                  {card.skeleton === "chat" && <ChatSkeleton />}
                  {card.skeleton === "video" && <VideoSkeleton />}
                  {card.skeleton === "avatars" && <AvatarDriftSkeleton />}
                  {card.skeleton === "marquee" && <MarqueeSkeleton />}
                </div>
                <h3 className="mt-5 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
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

          <div className="mt-10 flex flex-col items-center justify-between gap-5 text-xs text-slate-500 dark:text-slate-400 md:flex-row">
            <p>© 2026 Smart Advisor. All rights reserved.</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Built with{" "}
              <LinkPreview url="#" className="font-semibold text-indigo-600">
                React
              </LinkPreview>
              ,{" "}
              <LinkPreview url="#" className="font-semibold text-slate-900 dark:text-white">
                Next.js
              </LinkPreview>
              , and{" "}
              <LinkPreview url="#" className="font-semibold text-blue-500">
                TypeScript
              </LinkPreview>
            </p>
            <div className="flex items-center gap-4">
              <a href="#" aria-label="LinkedIn" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                <IconBrandLinkedin className="h-5 w-5" />
              </a>
              <a href="#" aria-label="GitHub" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                <IconBrandGithub className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Instagram" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                <IconBrandInstagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const ChatSkeleton = () => {
  const messages = ["Need a sci-fi thriller", "Try Arrival + Dune", "Also add a mind-bender", "Perfect, saved"];

  return (
    <div className="flex h-full flex-col gap-2">
      {messages.map((message, index) => (
        <motion.div
          key={message}
          initial={{ opacity: 0, x: index % 2 === 0 ? -12 : 12 }}
          animate={{ opacity: [0.45, 1, 0.45], x: 0 }}
          transition={{
            delay: index * 0.22,
            duration: 2.2,
            repeat: Infinity,
            repeatDelay: 0.2,
          }}
          className={cn(
            "max-w-[82%] rounded-lg px-3 py-2 text-xs",
            index % 2 === 0
              ? "self-start bg-white text-slate-700 dark:bg-slate-700 dark:text-slate-100"
              : "self-end bg-indigo-600 text-white",
          )}
        >
          {message}
        </motion.div>
      ))}
    </div>
  );
};

const VideoSkeleton = () => {
  const tiles = [0, 1, 2, 3];
  return (
    <div className="grid h-full grid-cols-2 gap-2">
      {tiles.map((tile) => (
        <motion.div
          key={tile}
          initial={{ opacity: 0.45, scale: 0.96 }}
          animate={{ opacity: [0.45, 0.95, 0.45], scale: [0.96, 1, 0.96] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: tile * 0.12 }}
          className="relative overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700"
        >
          <div className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <div className="absolute bottom-2 left-2 right-2 h-1.5 rounded bg-slate-300 dark:bg-slate-600" />
        </motion.div>
      ))}
    </div>
  );
};

const AvatarDriftSkeleton = () => {
  const avatars = [
    "AB",
    "CD",
    "EF",
    "GH",
    "IJ",
    "KL",
    "MN",
    "OP",
  ];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % avatars.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [avatars.length]);

  return (
    <div className="relative h-full w-full">
      {avatars.map((avatar, index) => {
        const angle = (index / avatars.length) * Math.PI * 2;
        const x = 42 + Math.cos(angle) * 32;
        const y = 42 + Math.sin(angle) * 30;

        return (
          <motion.div
            key={avatar}
            className={cn(
              "absolute flex h-10 w-10 items-center justify-center rounded-full text-[10px] font-bold",
              active === index
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-700 dark:bg-slate-700 dark:text-slate-100",
            )}
            style={{ left: `${x}%`, top: `${y}%` }}
            animate={{ y: [0, -6, 0], x: [0, 3, 0] }}
            transition={{ duration: 4 + (index % 3), repeat: Infinity, ease: "easeInOut" }}
          >
            {avatar}
          </motion.div>
        );
      })}
    </div>
  );
};

const MarqueeSkeleton = () => {
  const mentors = ["Taste Coach", "Genre Scout", "Mood Curator", "Story Guide", "Pacing Mentor"];

  return (
    <div className="relative h-full overflow-hidden">
      <motion.div
        className="absolute inset-y-0 flex items-center gap-3"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        {[...mentors, ...mentors].map((mentor, index) => (
          <div
            key={`${mentor}-${index}`}
            className="whitespace-nowrap rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100"
          >
            {mentor}
          </div>
        ))}
      </motion.div>
    </div>
  );
};
