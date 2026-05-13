export const navItems = [
  { name: "How It Works", link: "#how-it-works" },
  { name: "Why Smart Advisor", link: "#why-smart-advisor" },
  { name: "Powered By", link: "#powered-by" },
  { name: "Our Team", link: "#meet-the-team" },
  { name: "FAQ", link: "#faq" },
];

export const howItWorksCards = [
  {
    title: "Tell Us What You Are In The Mood For",
    description:
      "Pick what you feel like right now, genres you want (or want to avoid), and how adventurous you want recommendations to be.",
    image:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "We Narrow Down Your Best Options",
    description:
      "Smart Advisor combines your answers with trusted movie and book details to find options that fit your mood.",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1616530940355-351fabd9524b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Get Picks You Can Trust",
    description:
      "You get curated movies and books with plain-language reasoning instead of random lists with no explanation.",
    image:
      "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1200&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=1200&q=80",
  },
];

export const logoSets = [
  [
    { name: "Next.js", src: "https://cdn.simpleicons.org/nextdotjs/111111" },
    { name: "Supabase", src: "https://cdn.simpleicons.org/supabase/111111" },
    {
      name: "TMDB",
      src: "https://cdn.simpleicons.org/themoviedatabase/111111",
    },
    { name: "Open Library", src: "" },
  ],
  [
    {
      name: "TypeScript",
      src: "https://cdn.simpleicons.org/typescript/111111",
    },
    { name: "React", src: "https://cdn.simpleicons.org/react/111111" },
    { name: "Framer", src: "https://cdn.simpleicons.org/framer/111111" },
    { name: "Node.js", src: "https://cdn.simpleicons.org/nodedotjs/111111" },
  ],
  [
    { name: "Tailwind", src: "https://cdn.simpleicons.org/tailwindcss/111111" },
    { name: "Vercel", src: "https://cdn.simpleicons.org/vercel/111111" },
    { name: "GitHub", src: "https://cdn.simpleicons.org/github/111111" },
    { name: "Anthropic", src: "https://cdn.simpleicons.org/anthropic/111111" },
  ],
];

export const FAQ_CATEGORY_IDS = [
  "getting-started",
  "how-it-works",
  "group-quiz",
  "library",
  "account",
] as const;

export type FaqCategory = (typeof FAQ_CATEGORY_IDS)[number];

// Translations for category labels live in messages/{en,es}.json under
// Home.faq.categories.{id}. The page resolves them via useTranslations.
export const FAQ_CATEGORIES: { id: FaqCategory }[] = FAQ_CATEGORY_IDS.map(
  (id) => ({ id }),
);

// Each FAQ item points to a translation key under Home.faq.items.{key}.
// Question + answer text live in the messages files.
export const faqItems: {
  category: FaqCategory;
  key: string;
}[] = [
  { category: "getting-started", key: "create-account" },
  { category: "getting-started", key: "verify-email" },
  { category: "how-it-works", key: "personalize" },
  { category: "how-it-works", key: "quiz-flow" },
  { category: "how-it-works", key: "results-generated" },
  { category: "how-it-works", key: "movies-and-books" },
  { category: "how-it-works", key: "off-results" },
  { category: "how-it-works", key: "trailer-preview" },
  { category: "how-it-works", key: "year-in-review" },
  { category: "group-quiz", key: "group-what" },
  { category: "group-quiz", key: "group-account" },
  { category: "group-quiz", key: "group-host" },
  { category: "group-quiz", key: "group-synthesis" },
  { category: "group-quiz", key: "group-expiry" },
  { category: "library", key: "library-vs-history" },
  { category: "library", key: "library-improves" },
  { category: "account", key: "mfa" },
  { category: "account", key: "sessions" },
  { category: "account", key: "delete-account" },
  { category: "account", key: "data-handling" },
  { category: "account", key: "open-source" },
];

// Names + photos stay in code; designations + quotes are translated and
// live under Home.team.members.{key} in the messages files.
export const teamMembers = [
  { key: "andrew", name: "Andrew Ponder", src: "/images/Andrew.jpg" },
  { key: "vlad", name: "Vladimir Fiffie Jr", src: "/images/Vlad.jpg" },
];
