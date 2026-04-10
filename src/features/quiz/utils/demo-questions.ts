import type { QuestionType } from "@/features/quiz/components/question-card";

export type DemoQuestion = {
  id: string;
  title: string;
  subtitle: string;
  type: QuestionType;
  options?: string[];
  placeholder?: string;
};

const FIRST_QUESTION: DemoQuestion = {
  id: "contentType",
  title: "What are you looking for today?",
  subtitle: "Pick one so we can tailor your recommendation flow.",
  type: "single_select",
  options: ["Movies", "Books", "Both"],
};

const LAST_QUESTION: DemoQuestion = {
  id: "describe",
  title: "Describe your perfect recommendation",
  subtitle: "Share your thoughts in your own words.",
  type: "fill_in_blank",
  placeholder:
    "e.g. Something feel-good with a twist ending, or a slow-paced mystery set in a small town...",
};

const MOOD_QUESTIONS: DemoQuestion[] = [
  {
    id: "mood",
    title: "What mood are you in?",
    subtitle: "We use this to shape tone and pacing.",
    type: "single_select",
    options: ["Comforting", "Suspenseful", "Inspiring", "Mind-bending"],
  },
  {
    id: "vibe",
    title: "What vibe sounds right tonight?",
    subtitle: "Set the emotional temperature for your pick.",
    type: "single_select",
    options: [
      "Cozy & nostalgic",
      "Edge-of-your-seat",
      "Wholesome & fun",
      "Dark & layered",
    ],
  },
  {
    id: "energy",
    title: "What energy are you craving?",
    subtitle: "Different days call for different stories.",
    type: "single_select",
    options: [
      "Relaxed escape",
      "Big emotional ride",
      "Quick laugh",
      "Heavy and meaningful",
    ],
  },
];

const GENRE_QUESTIONS: DemoQuestion[] = [
  {
    id: "genres",
    title: "Which genres interest you?",
    subtitle: "Pick all that sound good — we will weight your picks.",
    type: "select_all",
    options: [
      "Action",
      "Fantasy",
      "Drama",
      "Mystery",
      "Sci-Fi",
      "Romance",
      "Thriller",
      "Comedy",
    ],
  },
  {
    id: "themes",
    title: "Which themes pull you in?",
    subtitle: "Choose any that resonate.",
    type: "select_all",
    options: [
      "Coming of age",
      "Found family",
      "Survival",
      "Mystery & intrigue",
      "Love stories",
      "Dystopia",
      "Heist & schemes",
      "Redemption",
    ],
  },
  {
    id: "settings",
    title: "Pick the worlds you would live in",
    subtitle: "Choose the settings that draw you in.",
    type: "select_all",
    options: [
      "Modern day",
      "Historical",
      "Space & sci-fi",
      "Magical realms",
      "Small towns",
      "Urban grit",
    ],
  },
];

const STYLE_QUESTIONS: DemoQuestion[] = [
  {
    id: "pace",
    title: "How fast should it move?",
    subtitle: "Choose your ideal pace for tonight.",
    type: "single_select",
    options: ["Slow burn", "Balanced", "Fast and intense"],
  },
  {
    id: "depth",
    title: "How deep do you want to go?",
    subtitle: "We will calibrate complexity to match.",
    type: "single_select",
    options: ["Easy & breezy", "Smart but accessible", "Layered & complex"],
  },
  {
    id: "ending",
    title: "What kind of ending do you prefer?",
    subtitle: "Helps us pick something that lands the way you want.",
    type: "single_select",
    options: ["Happy & satisfying", "Bittersweet", "Twist", "Open-ended"],
  },
];

const pickOne = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

export function buildDemoQuiz(): DemoQuestion[] {
  return [
    FIRST_QUESTION,
    pickOne(MOOD_QUESTIONS),
    pickOne(GENRE_QUESTIONS),
    pickOne(STYLE_QUESTIONS),
    LAST_QUESTION,
  ];
}
