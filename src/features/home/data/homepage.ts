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

export const FAQ_CATEGORIES = [
  { id: "getting-started", label: "Getting started" },
  { id: "how-it-works", label: "How it works" },
  { id: "library", label: "Library" },
  { id: "account", label: "Account & privacy" },
] as const;

export type FaqCategory = (typeof FAQ_CATEGORIES)[number]["id"];

export const faqItems: {
  category: FaqCategory;
  question: string;
  answer: string;
}[] = [
  {
    category: "getting-started",
    question: "How do I create an account?",
    answer:
      "Click Sign Up on the login page, enter your name, email, and a password (minimum 8 characters). You will receive a verification email — click the link to activate your account before signing in.",
  },
  {
    category: "getting-started",
    question: "Why do I need to verify my email?",
    answer:
      "Email verification confirms your identity and protects your account. You will not be able to sign in until you click the verification link sent to your inbox. Check your spam folder if you do not see it.",
  },
  {
    category: "how-it-works",
    question: "How does Smart Advisor personalize recommendations?",
    answer:
      "Smart Advisor uses your quiz answers to understand your mood, pacing preferences, and genre interests. It then combines this with real-time data from TMDB and Open Library to generate recommendations with clear reasoning behind every pick.",
  },
  {
    category: "how-it-works",
    question: "How does the quiz work?",
    answer:
      "You choose a content type (movie, book, or both), select how many questions you want (3 to 15), then answer each one. Your responses are sent to our AI which generates personalized recommendations tailored to your answers.",
  },
  {
    category: "how-it-works",
    question: "How are results generated?",
    answer:
      "Your answers are processed by an AI model that selects titles matching your preferences. Each recommendation is then enriched with real poster art, ratings, and descriptions from TMDB (movies) and Open Library (books).",
  },
  {
    category: "how-it-works",
    question: "Can I use Smart Advisor for both movies and books?",
    answer:
      "Yes. Select 'Both' during content selection to receive one movie and one book recommendation in the same session. Your entire recommendation history is saved for future reference.",
  },
  {
    category: "how-it-works",
    question: "What if my recommendations feel off?",
    answer:
      "You can retake the quiz anytime with different answers, or adjust the number of questions and your mood and pacing choices. The fastest way to improve future picks is to log reactions to your library — marking a past pick as 'Not for me' teaches the AI to steer away from similar titles, and a thumbs-up nudges it toward more like that.",
  },
  {
    category: "library",
    question: "What is the library and how does it differ from history?",
    answer:
      "History is every recommendation the AI has generated for you. Your library is a separate log of what you have actually watched or read — with a status (Finished, In progress, Wishlist), a thumbs rating, and an optional one-line reaction. You can log a title from any results card or from the history modal.",
  },
  {
    category: "library",
    question: "How does the library improve my recommendations?",
    answer:
      "Your most recent rated entries are sent to the AI alongside your quiz answers as a taste signal. A thumbs-up tells it 'more like this'; a thumbs-down tells it to steer clear. Reactions you write are read verbatim, so a one-liner like 'too slow' carries real weight on the next pick.",
  },
  {
    category: "account",
    question: "What is two-factor authentication (MFA)?",
    answer:
      "MFA adds an extra layer of security by requiring a code from an authenticator app (like Google Authenticator or Authy) when you sign in. You can enable it from Account Settings under the Security tab.",
  },
  {
    category: "account",
    question: "How do I manage my devices and sessions?",
    answer:
      "Go to Account Settings, open the Security tab, and scroll to Active Sessions. You can see all devices where you are signed in, revoke access for individual devices, or sign out of all devices at once.",
  },
  {
    category: "account",
    question: "Can I delete or disable my account?",
    answer:
      "Yes. In Account Settings under the Integrations tab, you will find a Danger Zone section. You can disable your account (which can be re-enabled by support) or permanently delete it along with all associated data.",
  },
  {
    category: "account",
    question: "How is my personal data handled?",
    answer:
      "Your data is stored securely in Supabase with row-level security policies. We only use your preferences and quiz answers to generate recommendations. We do not share your data with third parties.",
  },
  {
    category: "account",
    question: "Is Smart Advisor open source?",
    answer:
      "Yes. Smart Advisor is fully open source. You can review the codebase, report issues, and follow development progress on GitHub.",
  },
];

export const teamMembers = [
  {
    quote:
      "Built Smart Advisor to make recommendations feel personal, fast, and genuinely useful.",
    name: "Andrew Ponder",
    designation: "Creator",
    src: "/images/Andrew.jpg",
  },
  {
    quote:
      "Focused on creating a clean interface that keeps the experience smooth on desktop.",
    name: "Vladimir Fiffie Jr",
    designation: "Web Designer",
    src: "/images/Vlad.jpg",
  },
];
