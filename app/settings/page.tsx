'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Save, Shield, SlidersHorizontal, UserRound, Sparkles } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
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

const SettingsPage = () => {
  const router = useRouter();
  const { user, signOut, updateProfile, updateEmail, updatePassword } = useAuth();

  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [age, setAge] = useState(user?.age ? String(user.age) : "");
  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [contentFocus, setContentFocus] = useState("both");
  const [discoveryLevel, setDiscoveryLevel] = useState("balanced");

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
    const parsedAge = Number(age);
    const result = await updateProfile(name.trim(), Number.isFinite(parsedAge) ? parsedAge : 25);
    setMessage(result.error ?? "Profile updated.");
    setSavingProfile(false);
  };

  const handleSaveEmail = async () => {
    setSavingEmail(true);
    setMessage(null);
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
              className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-slate-700 transition-colors hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400"
            >
              <LogOut size={14} />
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
                <SidebarBody className="border-r border-slate-200/80 dark:border-slate-700/70 dark:!bg-slate-900/70">
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
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Name</span>
                          <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
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
                        className="h-10 w-auto rounded-full px-5"
                      >
                        <Save size={14} />
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
                        <input
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
                          placeholder="name@example.com"
                        />
                        <StatefulButton
                          onClick={handleSaveEmail}
                          state={savingEmail ? "loading" : "idle"}
                          className="h-10 w-auto rounded-full px-5"
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
                          className="h-10 w-auto rounded-full px-5"
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
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setContentFocus(opt.id)}
                              className={cn(
                                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                                contentFocus === opt.id
                                  ? "border-indigo-500 bg-indigo-500 text-white"
                                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800",
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Discovery level</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {["safe", "balanced", "adventurous"].map((level) => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setDiscoveryLevel(level)}
                              className={cn(
                                "rounded-full border px-4 py-2 text-sm font-semibold capitalize transition-colors",
                                discoveryLevel === level
                                  ? "border-indigo-500 bg-indigo-500 text-white"
                                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800",
                              )}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                        <Sparkles size={13} />
                        Preferences apply on your next quiz session
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200/80 px-6 py-3 text-sm text-slate-600 dark:border-slate-700/70 dark:text-slate-300">
              {message || "Choose a section to update your settings."}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
