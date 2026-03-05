'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleOff, Shield, SlidersHorizontal, UserRound, Sparkles } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { GlowPillButton } from "@/components/ui/glow-pill-button";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/sidebar";
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
import { cn } from "@/lib/utils";

type SettingsSection = "profile" | "security" | "content";
const PREF_CONTENT_KEY = "smart_advisor_pref_content_focus";
const PREF_DISCOVERY_KEY = "smart_advisor_pref_discovery";
const PREF_QUESTION_COUNT_KEY = "smart_advisor_pref_question_count";

const SettingsPage = () => {
  const router = useRouter();
  const { user, signOut, updateProfile, updateEmail, updatePassword } = useAuth();

  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [age, setAge] = useState(user?.age ? String(user.age) : "");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [contentFocus, setContentFocus] = useState("both");
  const [discoveryLevel, setDiscoveryLevel] = useState("balanced");
  const [preferredQuestionCount, setPreferredQuestionCount] = useState(5);

  const verifyWithPasswordPrompt = async (actionLabel: string) => {
    if (!user?.email) {
      setMessage("Unable to verify your account right now. Please sign in again.");
      return false;
    }

    const password = window.prompt(
      `Enter your current password to ${actionLabel}:`,
      "",
    );

    if (password === null) {
      setMessage(`${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} canceled.`);
      return false;
    }

    if (!password.trim()) {
      setMessage("Password is required to continue.");
      return false;
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email.trim().toLowerCase(),
      password: password.trim(),
    });

    if (verifyError) {
      setMessage("Password verification failed. No changes were saved.");
      return false;
    }

    return true;
  };

  const navItems = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "History", link: "/history" },
    { name: "Settings", link: "/settings" },
  ];

  const sectionLinks = [
    {
      id: "profile" as SettingsSection,
      label: "Profile",
      icon: <UserRound className="h-4 w-4 text-slate-700 dark:text-slate-300" />,
    },
    {
      id: "security" as SettingsSection,
      label: "Security",
      icon: <Shield className="h-4 w-4 text-slate-700 dark:text-slate-300" />,
    },
    {
      id: "content" as SettingsSection,
      label: "Content",
      icon: <SlidersHorizontal className="h-4 w-4 text-slate-700 dark:text-slate-300" />,
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setMessage(null);

    const verified = await verifyWithPasswordPrompt("save your profile");
    if (!verified) {
      setSavingProfile(false);
      return;
    }

    const trimmedName = newName.trim();
    if (!trimmedName) {
      setMessage("New username is required.");
      setSavingProfile(false);
      return;
    }

    const parsedAge = Number(age);
    const result = await updateProfile(trimmedName, Number.isFinite(parsedAge) ? parsedAge : 25);
    setMessage(result.error ?? "Profile updated.");
    setSavingProfile(false);
  };

  const handleSaveEmail = async () => {
    setSavingEmail(true);
    setMessage(null);

    if (!newEmail.trim()) {
      setMessage("New email is required.");
      setSavingEmail(false);
      return;
    }

    if (user?.email && newEmail.trim().toLowerCase() === user.email.trim().toLowerCase()) {
      setMessage("New email must be different from your current email.");
      setSavingEmail(false);
      return;
    }

    const verified = await verifyWithPasswordPrompt("update your email");
    if (!verified) {
      setSavingEmail(false);
      return;
    }

    const result = await updateEmail(newEmail);
    setMessage(result.error ?? "Check your inbox to confirm your new email.");
    setSavingEmail(false);
  };

  const handleSavePassword = async () => {
    setSavingPassword(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setSavingPassword(false);
      return;
    }

    const verified = await verifyWithPasswordPrompt("change your password");
    if (!verified) {
      setSavingPassword(false);
      return;
    }

    const result = await updatePassword(newPassword);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Password updated.");
      setNewPassword("");
      setConfirmPassword("");
    }

    setSavingPassword(false);
  };

  const handleSaveContentPreferences = async () => {
    if (typeof window === "undefined") return;
    const verified = await verifyWithPasswordPrompt("save content preferences");
    if (!verified) {
      return;
    }

    window.localStorage.setItem(PREF_CONTENT_KEY, contentFocus);
    window.localStorage.setItem(PREF_DISCOVERY_KEY, discoveryLevel);
    window.localStorage.setItem(
      PREF_QUESTION_COUNT_KEY,
      String(preferredQuestionCount),
    );
    setMessage("Content preferences saved.");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedContent = window.localStorage.getItem(PREF_CONTENT_KEY);
    const storedDiscovery = window.localStorage.getItem(PREF_DISCOVERY_KEY);
    const storedQuestionCount = Number(
      window.localStorage.getItem(PREF_QUESTION_COUNT_KEY) || "5",
    );

    if (storedContent && ["movie", "book", "both"].includes(storedContent)) {
      setContentFocus(storedContent);
    }
    if (
      storedDiscovery &&
      ["safe", "balanced", "adventurous"].includes(storedDiscovery)
    ) {
      setDiscoveryLevel(storedDiscovery);
    }
    if (
      Number.isFinite(storedQuestionCount) &&
      storedQuestionCount >= 3 &&
      storedQuestionCount <= 15
    ) {
      setPreferredQuestionCount(storedQuestionCount);
    }
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    setAge(user?.age ? String(user.age) : "");
  }, [user?.age]);

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <Navbar>
        <NavBody>
          <div className="flex w-[320px] shrink-0 items-center">
            <NavbarLogo />
          </div>
          <div className="flex flex-1 justify-center">
            <NavItems items={navItems} className="justify-center px-2" />
          </div>
          <div className="flex w-[320px] shrink-0 items-center justify-end gap-4">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm font-bold tracking-tight text-slate-700 transition-colors hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400"
            >
              Sign Out
            </button>
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
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  router.push(item.link);
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-xl font-black tracking-tight text-slate-800 dark:text-slate-100"
              >
                {item.name}
              </button>
            ))}
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
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <main className="px-6 pb-20 pt-32 md:pt-36">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Settings
            </p>
            <h1 className="mt-3 text-5xl font-black tracking-tighter md:text-6xl">Account Preferences</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-400 md:text-lg">
              Manage profile details, security, and recommendation defaults.
            </p>
          </div>

          <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/65">
            <div className="flex min-h-[620px] w-full">
              <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
                <SidebarBody className="h-full min-h-[620px] border-r border-slate-200/80 dark:border-slate-700/70 dark:!bg-slate-900/70">
                  <div className="mt-2 flex flex-1 flex-col gap-1">
                    {sectionLinks.map((section) => (
                      <SidebarLink
                        key={section.id}
                        link={{
                          label: section.label,
                          href: "#",
                          icon: section.icon,
                        }}
                        className={cn(
                          "rounded-xl px-2",
                          activeSection === section.id
                            ? "bg-slate-200/80 dark:bg-slate-800/90"
                            : "hover:bg-slate-200/40 dark:hover:bg-slate-800/40",
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveSection(section.id);
                        }}
                      />
                    ))}
                  </div>
                </SidebarBody>
              </Sidebar>

              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-3xl transition-opacity duration-300">
                  {message && (
                    <div className="mb-5 inline-flex max-w-xl items-center rounded-xl border border-slate-200/80 bg-slate-50/90 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                      {message}
                    </div>
                  )}

                  {activeSection === "profile" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight">Profile Details</h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          Update your public account details.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Current Username</span>
                          <div className="relative">
                            <input
                              value={user?.name || ""}
                              readOnly
                              disabled
                              tabIndex={-1}
                              aria-disabled="true"
                              className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 pr-11 text-sm text-slate-600 opacity-100 disabled:pointer-events-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                            />
                            <CircleOff
                              size={16}
                              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                            />
                          </div>
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">New Username</span>
                          <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Enter new username"
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Age</span>
                          <input
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            type="number"
                            min={13}
                            max={120}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
                          />
                        </label>
                      </div>
                      <StatefulButton
                        onClick={handleSaveProfile}
                        state={savingProfile ? "loading" : "idle"}
                        className="h-11 w-auto min-w-[180px] justify-center rounded-full px-6 text-sm font-semibold"
                      >
                        Save Profile
                      </StatefulButton>
                    </div>
                  )}

                  {activeSection === "security" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight">Security</h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          Manage email and password settings.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email address</p>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="relative">
                            <input
                              value={user?.email || ""}
                              readOnly
                              disabled
                              tabIndex={-1}
                              aria-disabled="true"
                              className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                              placeholder="Current email"
                            />
                          </div>
                          <input
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
                            placeholder="New email"
                          />
                        </div>
                        <StatefulButton
                          onClick={handleSaveEmail}
                          state={savingEmail ? "loading" : "idle"}
                          className="h-11 w-auto min-w-[180px] justify-center rounded-full px-6 text-sm font-semibold"
                        >
                          Update Email
                        </StatefulButton>
                      </div>

                      <div className="h-px w-full bg-slate-200 dark:bg-slate-700" />

                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Change password</p>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
                            placeholder="New password"
                          />
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
                            placeholder="Confirm password"
                          />
                        </div>
                        <StatefulButton
                          onClick={handleSavePassword}
                          state={savingPassword ? "loading" : "idle"}
                          className="h-11 w-auto min-w-[180px] justify-center rounded-full px-6 text-sm font-semibold"
                        >
                          Update Password
                        </StatefulButton>
                      </div>
                    </div>
                  )}

                  {activeSection === "content" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight">Content Preferences</h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          Set your default recommendation behavior.
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Default recommendation type</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[
                            { id: "movie", label: "Movies" },
                            { id: "book", label: "Books" },
                            { id: "both", label: "Both" },
                          ].map((opt) => (
                            <GlowPillButton
                              key={opt.id}
                              onClick={() => setContentFocus(opt.id)}
                              active={contentFocus === opt.id}
                              className="px-4 py-2 text-sm font-semibold"
                            >
                              {opt.label}
                            </GlowPillButton>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Discovery level</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {["safe", "balanced", "adventurous"].map((level) => (
                            <GlowPillButton
                              key={level}
                              onClick={() => setDiscoveryLevel(level)}
                              active={discoveryLevel === level}
                              className="px-4 py-2 text-sm font-semibold capitalize"
                            >
                              {level}
                            </GlowPillButton>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Default question count
                        </p>
                        <div className="mt-3 max-w-lg">
                          <input
                            type="range"
                            min={3}
                            max={15}
                            value={preferredQuestionCount}
                            onChange={(e) =>
                              setPreferredQuestionCount(Number(e.target.value))
                            }
                            className="w-full cursor-pointer accent-indigo-500"
                          />
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            {preferredQuestionCount} questions
                          </p>
                        </div>
                      </div>

                      <StatefulButton
                        onClick={handleSaveContentPreferences}
                        className="h-11 w-auto min-w-[220px] justify-center rounded-full px-6 text-sm font-semibold"
                      >
                        Save Content Preferences
                      </StatefulButton>

                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                        <Sparkles size={13} />
                        Preferences apply on your next quiz session
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
