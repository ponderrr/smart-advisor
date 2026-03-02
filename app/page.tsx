"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

// UI Components
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { LinkPreview } from "@/components/ui/link-preview";
import { ThemeToggle } from "@/components/theme-toggle";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import {
  Navbar, NavBody, NavItems, MobileNav, NavbarLogo,
  MobileNavHeader, MobileNavToggle, MobileNavMenu,
} from "@/components/ui/resizable-navbar";

// Custom Components
import HeroSection from "@/components/hero-section";
import PoweredByLogos from "@/components/powered-by-logos";
import { cn } from "@/lib/utils";

const Index = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleGetStarted = () => user ? router.push("/content-selection") : router.push("/auth");

  const navItems = [
    { name: "How It Works", link: "#how-it-works" },
    { name: "Powered By", link: "#powered-by" },
    { name: "Our Team", link: "#meet-the-team" },
  ];

  const cards = [
    { title: "Smart Questionnaire", description: "AI generates 5 personalized questions tailored to you", gradient: "from-red-500 to-pink-500" },
    { title: "Tailored Recommendations", description: "Get book and movie picks that match your taste perfectly", gradient: "from-purple-500 to-blue-500" },
    { title: "Instant Results", description: "Discover your next favorite in seconds with smart filtering", gradient: "from-cyan-500 to-green-500" },
  ];

  const teamMembers = [
    { id: 1, name: "AI Engine", designation: "Smart Questionnaire", image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=300&q=80" },
    { id: 2, name: "TMDB API", designation: "Movie Data", image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80" },
    { id: 3, name: "Google Books", designation: "Book Recommendations", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80" },
    { id: 4, name: "Supabase", designation: "Data Storage", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80" },
  ];

  return (
    <div className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300 antialiased">
      <Navbar>
        <NavBody>
          <NavbarLogo />

          <NavItems items={navItems} />

          <div className="flex items-center gap-6">
            <ThemeToggle />
            {/* MATCHED CTA: No purple shadow, smaller, same font weight as Hero */}
            <HoverBorderGradient
              onClick={handleGetStarted}
              containerClassName="rounded-full"
              className="dark:bg-black bg-white text-black dark:text-white px-6 py-2 text-sm font-black tracking-tighter"
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
              <MobileNavToggle isOpen={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
            </div>
          </MobileNavHeader>
          <MobileNavMenu isOpen={isMobileMenuOpen}>
            {navItems.map((item) => (
              <a key={item.name} href={item.link} onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-black tracking-tighter">
                {item.name}
              </a>
            ))}
            <HoverBorderGradient onClick={handleGetStarted} containerClassName="rounded-full w-full mt-4" className="w-full py-4 text-center font-black uppercase tracking-widest text-xs">
              Get Started
            </HoverBorderGradient>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <HeroSection />

      {/* Sections remain the same but cleaner spacing */}
      <section id="how-it-works" className="py-32 px-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/50 border-t dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">How It Works</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">Simple, smart, and personalized for you.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {cards.map((card, idx) => (
              <div key={idx} className="group relative rounded-3xl border dark:border-slate-800 bg-white dark:bg-slate-900/50 p-1 transition-transform hover:-translate-y-1">
                <GlowingEffect spread={40} glow />
                <div className="relative h-full rounded-[calc(1.5rem-1px)] p-8 transition-all group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50">
                  <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-xl mb-6 text-white font-black bg-gradient-to-br", card.gradient)}>
                    {idx + 1}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 tracking-tight">{card.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="powered-by" className="py-32 border-t dark:border-slate-800">
        <div className="max-w-6xl mx-auto text-center px-6">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-20">Powered By</h2>
          <PoweredByLogos />
        </div>
      </section>

      <section id="meet-the-team" className="py-32 border-t dark:border-slate-800">
        <div className="max-w-6xl mx-auto text-center px-6">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-24">Meet the Team</h2>
          <div className="flex justify-center h-32">
            <AnimatedTooltip items={teamMembers} />
          </div>
        </div>
      </section>

      <footer className="py-20 border-t dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 px-6">
        <p className="mb-4">
          Built with <LinkPreview url="#" className="font-bold text-indigo-600">React</LinkPreview>,
          <LinkPreview url="#" className="font-bold text-slate-900 dark:text-white">Next.js</LinkPreview>, and
          <LinkPreview url="#" className="font-bold text-blue-500">TypeScript</LinkPreview>
        </p>
        <p className="text-sm">© 2026 Smart Advisor. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
