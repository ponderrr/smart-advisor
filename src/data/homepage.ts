export const navItems = [
  { name: "How It Works", link: "#how-it-works" },
  { name: "Powered By", link: "#powered-by" },
  { name: "FAQ", link: "#faq" },
  { name: "Our Team", link: "#meet-the-team" },
];

export const howItWorksCards = [
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

export const logoSets = [
  [
    { name: "Next.js", src: "https://cdn.simpleicons.org/nextdotjs/111111" },
    { name: "Supabase", src: "https://cdn.simpleicons.org/supabase/111111" },
    { name: "TMDB", src: "https://cdn.simpleicons.org/themoviedatabase/111111" },
    { name: "Google Books", src: "https://cdn.simpleicons.org/googlebooks/111111" },
  ],
  [
    { name: "TypeScript", src: "https://cdn.simpleicons.org/typescript/111111" },
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

export const faqItems = [
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
    question: "How is my personal data handled?",
    answer:
      "Account data is stored in Supabase with authentication controls. We use your profile information only to improve recommendation relevance and core app functionality.",
  },
  {
    question: "Can I request deletion of my account data?",
    answer:
      "Yes. Contact support and we can help remove your profile and associated recommendation history from the platform.",
  },
  {
    question: "What if recommendations feel off for me?",
    answer:
      "You can rerun the questionnaire and adjust answers. The engine is designed to quickly adapt to changing preferences and contexts.",
  },
];

export const teamMembers = [
  {
    quote:
      "Built Smart Advisor to make recommendations feel personal, fast, and genuinely useful.",
    name: "Andrew Ponder",
    designation: "Creator",
    src: "/Andrew.jpg",
  },
  {
    quote:
      "Focused on creating a clean interface that keeps the experience smooth on desktop and mobile.",
    name: "Vladimir Fiffie Jr",
    designation: "Web Designer",
    src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=900&q=80",
  },
];
