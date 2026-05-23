"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Bell,
  CircleOff,
  Shield,
  SlidersHorizontal,
  UserRound,
  Link2,
  UserMinus,
  Trash2,
  ShieldCheck,
  Mail,
  Lock,
  X,
  Check,
  Sun,
  Moon,
  Monitor,
  Newspaper,
  LifeBuoy,
  Sparkles,
  UserPlus,
  Trophy,
  UserCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import {
  SidebarNavItem,
  SidebarNavGroup,
  SidebarUser,
  SidebarNavShell,
} from "@/components/sidebar-nav";
import { authService } from "@/features/auth/services/auth-service";
import { MFAFactor } from "@/features/auth/types/mfa";
import {
  MfaSetup,
  MfaManagement,
  PasskeyManagement,
  SessionsManagement,
} from "@/features/auth/components";
import { FieldRequirements } from "@/features/auth/components/auth-shared";
import {
  SectionCard,
  SectionHeader,
  SettingsInput,
} from "./_components/settings-ui";
import { RecommendationFiltersCard } from "./_components/recommendation-filters-card";
import { ActivityNotificationsCard } from "./_components/activity-notifications-card";
import { BlockedPeopleCard } from "./_components/blocked-people-card";
import { MyReportsCard } from "./_components/my-reports-card";
import { usePasswordRules } from "./_hooks/use-password-rules";
import {
  useContentPreferences,
  PREF_CONTENT_KEY,
  PREF_CONTENT_TONE_KEY,
  PREF_QUESTION_COUNT_KEY,
} from "./_hooks/use-content-preferences";
import { useAvatarUpload } from "./_hooks/use-avatar-upload";
import { useReauthVerification } from "./_hooks/use-reauth-verification";
import { useAccountActions } from "./_hooks/use-account-actions";
import { useSettingsSaveHandlers } from "./_hooks/use-settings-save-handlers";
import {
  useFeedVisibility,
  type FeedVisibility,
} from "@/features/feed/use-feed-visibility";
import {
  useFeedPrefs,
  type FeedView,
} from "@/features/feed/use-feed-prefs";
import type {
  CommentSort,
  FeedCommunity,
  FeedScope,
} from "@/features/feed/types";
import {
  profileSchema,
  emailSchema,
  passwordSchema,
  backupEmailSchema,
  type ProfileForm,
  type EmailForm,
  type PasswordForm,
  type BackupEmailForm,
} from "./_lib/schemas";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { PillButton } from "@/components/ui/pill-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { PageLoader } from "@/components/ui/loader";
import { AppNavbar } from "@/components/app-navbar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SettingsSection =
  | "profile"
  | "security"
  | "content"
  | "feed"
  | "notifications"
  | "integrations"
  | "help";

const SETTINGS_SECTIONS: SettingsSection[] = [
  "profile",
  "security",
  "content",
  "feed",
  "notifications",
  "integrations",
  "help",
];

function isSettingsSection(v: string | null): v is SettingsSection {
  return !!v && (SETTINGS_SECTIONS as string[]).includes(v);
}


/* ------------------------------------------------------------------ */
/*  Main settings page                                                */
/* ------------------------------------------------------------------ */

type ThemeChoice = "light" | "dark" | "system";

/** Curated interest tags offered as chips in the "About me" editor. */
const CURATED_INTERESTS = [
  "Sci-Fi",
  "Fantasy",
  "Horror",
  "Thrillers",
  "Comedy",
  "Drama",
  "Romance",
  "Mystery",
  "Action",
  "Documentary",
  "Animation",
  "Indie",
  "Classics",
  "Non-fiction",
  "True crime",
] as const;

/** Question-count depth tier — drives both the i18n depth label and the
 *  hue of the slider/number, so the control colour shifts as it moves. */
const questionTier = (
  n: number,
): "quick" | "focused" | "balanced" | "thorough" | "comprehensive" =>
  n <= 4
    ? "quick"
    : n <= 7
      ? "focused"
      : n <= 10
        ? "balanced"
        : n <= 13
          ? "thorough"
          : "comprehensive";

const QUESTION_TIER_STYLE: Record<
  ReturnType<typeof questionTier>,
  { text: string; accent: string }
> = {
  quick: { text: "text-emerald-500", accent: "accent-emerald-500" },
  focused: { text: "text-sky-500", accent: "accent-sky-500" },
  balanced: { text: "text-indigo-500", accent: "accent-indigo-500" },
  thorough: { text: "text-amber-500", accent: "accent-amber-500" },
  comprehensive: { text: "text-rose-500", accent: "accent-rose-500" },
};

const SettingsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Settings");
  const { theme, setTheme } = useTheme();
  const { user, refreshUser } = useAuth();
  const { ready } = useRequireAuth();
  const [feedVisibility, setFeedVisibility] = useFeedVisibility();
  const [feedPrefs, setFeedPrefs] = useFeedPrefs();

  const settingsTabs = SETTINGS_SECTIONS;
  // Deep-link support: /settings?section=feed opens that tab directly
  // (used by the /feed opt-in prompt). Falls back to profile.
  const [activeSection, setActiveSection] = useState<SettingsSection>(() => {
    const requested = searchParams?.get("section") ?? null;
    return isSettingsSection(requested) ? requested : "profile";
  });
  // Section transitions always slide rightward — entering content starts on
  // the left and moves to center — so the motion feels consistent regardless
  // of which tab the user came from.
  const sectionSlideDir = -1;

  // Snap the page to the top on section change so the user lands at the
  // start of the new content instead of in the middle of empty space.
  // We use `behavior: "instant"` (not "smooth") on purpose — smooth scrolls
  // trigger iOS Safari's URL bar to collapse/expand, which wobbles the
  // fixed bottom nav and the navbar mid-transition.
  const changeSection = (id: SettingsSection) => {
    if (id === activeSection) return;
    setActiveSection(id);
    if (typeof window !== "undefined" && window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  };

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { newName: user?.name ?? "", age: user?.age ?? 18 },
  });

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { newEmail: "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const backupEmailForm = useForm<BackupEmailForm>({
    resolver: zodResolver(backupEmailSchema),
    defaultValues: { backupEmail: "" },
  });

  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const {
    contentFocus,
    setContentFocus,
    contentTone,
    setContentTone,
    preferredQuestionCount,
    setPreferredQuestionCount,
  } = useContentPreferences(user?.content_tone);
  const [savingContent, setSavingContent] = useState(false);
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const [showMfaPanel, setShowMfaPanel] = useState(false);
  const [mfaSetupModal, setMfaSetupModal] = useState<{
    open: boolean;
    isAdditional: boolean;
  }>({ open: false, isAdditional: false });
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaChecked, setMfaChecked] = useState(false);
  const [mfaPanelKey, setMfaPanelKey] = useState(0);
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const newPasswordAnchorRef = useRef<HTMLDivElement>(null);
  const confirmPasswordAnchorRef = useRef<HTMLDivElement>(null);
  const watchedNewPassword = passwordForm.watch("newPassword");
  const watchedConfirmPassword = passwordForm.watch("confirmPassword");
  const { newPasswordRules, confirmPasswordRules } = usePasswordRules(
    watchedNewPassword,
    watchedConfirmPassword,
  );
  const [currentBackupEmail, setCurrentBackupEmail] = useState<string | null>(
    null,
  );
  const showMessage = (
    text: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setMessage({ text, type });
    if (type === "success") toast.success(text);
    else if (type === "error") toast.error(text);
    else toast.info(text);
  };

  // "About me" — bio + interest/freeform tags. Saved on its own (no
  // re-auth gate) since it's low-sensitivity profile flavour.
  const [aboutBio, setAboutBio] = useState(user?.bio ?? "");
  const [aboutInterests, setAboutInterests] = useState<string[]>(
    user?.interests ?? [],
  );
  const [aboutTags, setAboutTags] = useState<string[]>(user?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [savingAbout, setSavingAbout] = useState(false);

  // Re-seed once the profile loads (user is null on the first render).
  useEffect(() => {
    if (!user) return;
    setAboutBio(user.bio ?? "");
    setAboutInterests(user.interests ?? []);
    setAboutTags(user.tags ?? []);
  }, [user]);

  const toggleInterest = (interest: string) =>
    setAboutInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );

  const addTag = () => {
    const value = tagDraft.trim().toLowerCase().replace(/^#+/, "");
    if (value && !aboutTags.includes(value) && aboutTags.length < 10) {
      setAboutTags((prev) => [...prev, value]);
    }
    setTagDraft("");
  };

  // Hue for the question-count slider + number, by depth tier.
  const questionStyle =
    QUESTION_TIER_STYLE[questionTier(preferredQuestionCount)];

  const handleSaveAbout = async () => {
    if (!user || savingAbout) return;
    setSavingAbout(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        bio: aboutBio.trim() || null,
        interests: aboutInterests,
        tags: aboutTags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSavingAbout(false);
    if (error) {
      showMessage(t("profile.aboutSaveError"), "error");
      return;
    }
    await refreshUser?.();
    showMessage(t("profile.aboutSavedToast"), "success");
  };

  const {
    avatarUploading,
    avatarInputRef,
    handleAvatarFileChange,
    handleRemoveAvatar,
  } = useAvatarUpload(showMessage);

  const {
    requestVerification,
    verifyModal,
    verifyCode,
    setVerifyCode,
    verifyError,
    setVerifyError,
    verifyLoading,
    closeVerifyModal,
    handleVerifySubmit,
  } = useReauthVerification(mfaEnabled);

  const sectionTabs: {
    id: SettingsSection;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: "profile", label: t("tabs.profile"), icon: <UserRound size={15} /> },
    { id: "security", label: t("tabs.security"), icon: <Shield size={15} /> },
    {
      id: "content",
      label: t("tabs.content"),
      icon: <SlidersHorizontal size={15} />,
    },
    { id: "feed", label: t("tabs.feed"), icon: <Newspaper size={15} /> },
    {
      id: "notifications",
      label: t("tabs.notifications"),
      icon: <Bell size={15} />,
    },
    {
      id: "integrations",
      label: t("tabs.integrations"),
      icon: <Link2 size={15} />,
    },
    { id: "help", label: t("tabs.help"), icon: <LifeBuoy size={15} /> },
  ];

  const {
    handleSaveProfile,
    handleSaveEmail,
    handleSavePassword,
    handleSaveContentPreferences,
    handleSaveBackupEmail,
    handleRemoveBackupEmail,
    removingBackupEmail,
  } = useSettingsSaveHandlers({
    profileForm,
    emailForm,
    passwordForm,
    backupEmailForm,
    requestVerification,
    showMessage,
    clearMessage: () => setMessage(null),
    contentFocus,
    contentTone,
    preferredQuestionCount,
    setSavingContent,
    setCurrentBackupEmail,
  });

  const { handleDisableAccount, handleDeleteAccount } = useAccountActions({
    requestVerification,
    showMessage,
    clearMessage: () => setMessage(null),
    setAccountActionLoading,
  });

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(t);
  }, [message]);

  useEffect(() => {
    if (user?.name) profileForm.setValue("newName", user.name);
    if (user?.age) profileForm.setValue("age", user.age);
  }, [user?.name, user?.age, profileForm]);

  // Check MFA status on mount and when panel closes
  useEffect(() => {
    const checkMfa = async () => {
      const { data } = await authService.listMFAFactors();
      const hasVerified =
        data?.totp?.some((f: MFAFactor) => f.status === "verified") ?? false;
      setMfaEnabled(hasVerified);
      setMfaChecked(true);
    };
    checkMfa();
  }, [showMfaPanel]);

  // Load backup email on mount
  useEffect(() => {
    const loadBackupEmail = async () => {
      const { email } = await authService.getBackupEmail();
      setCurrentBackupEmail(email);
    };
    loadBackupEmail();
  }, []);
  if (!ready) {
    return <PageLoader text="Loading..." />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppNavbar />

      <main className="px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
              {t("eyebrow")}
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t("subtitle")}
            </p>
          </div>

          {/* Mobile pill nav — desktop keeps the grouped sidebar below.
              Icons are omitted on mobile so "Integrations" (the longest
              label) gets enough room inside its 1/4 segment share without
              spilling past the pill on narrow phones. */}
          <div className="mb-4 md:hidden">
            <SegmentedControl<SettingsSection>
              layoutId="settings-mobile-tabs"
              value={activeSection}
              onChange={changeSection}
              size="sm"
              ariaLabel="Account sections"
              options={sectionTabs.map((tab) => ({
                value: tab.id,
                label: tab.label,
                pillClassName: "bg-indigo-500",
              }))}
            />
          </div>

          {/* Sidebar + content layout */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
            <SidebarNavShell className="hidden md:flex">
              <nav aria-label="Account sections" className="flex-1">
                <SidebarNavGroup label={t("groups.account")} />
                {sectionTabs
                  .filter(
                    (tab) => tab.id === "profile" || tab.id === "security",
                  )
                  .map((tab) => (
                    <SidebarNavItem
                      key={tab.id}
                      icon={tab.icon}
                      label={tab.label}
                      active={activeSection === tab.id}
                      onClick={() => changeSection(tab.id)}
                    />
                  ))}

                <SidebarNavGroup label={t("groups.app")} />
                {sectionTabs
                  .filter(
                    (tab) =>
                      tab.id === "content" ||
                      tab.id === "feed" ||
                      tab.id === "notifications" ||
                      tab.id === "integrations" ||
                      tab.id === "help",
                  )
                  .map((tab) => (
                    <SidebarNavItem
                      key={tab.id}
                      icon={tab.icon}
                      label={tab.label}
                      active={activeSection === tab.id}
                      onClick={() => changeSection(tab.id)}
                    />
                  ))}
              </nav>

              <div className="mt-6">
                <SidebarUser
                  name={user?.name ?? ""}
                  email={user?.email ?? ""}
                  avatarUrl={user?.avatar_url}
                />
              </div>
            </SidebarNavShell>

            <div className="min-w-0 flex-1">
              {/* Toast Message */}
              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={cn(
                      "mb-5 rounded-xl border px-4 py-2.5 text-sm font-medium",
                      message.type === "success" &&
                        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
                      message.type === "error" &&
                        "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300",
                      message.type === "info" &&
                        "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300",
                    )}
                  >
                    {message.text}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Section Content — wrapped in a min-height container so the
                  page doesn't shrink when switching from a tall section
                  (security has email + password + MFA + passkeys + backup
                  + sessions stacked) to a short one. Without this, the
                  browser auto-scrolls to keep the viewport valid, which
                  reads as "the page jumped up". */}
              <div className="min-h-[70vh]">
                <AnimatePresence mode="popLayout">
                  {activeSection === "profile" && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: sectionSlideDir * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: sectionSlideDir * -30 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Profile picture */}
                    <SectionCard>
                      <SectionHeader
                        title={t("profile.pictureTitle")}
                        description={t("profile.pictureDescription")}
                      />
                      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                        {user?.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.name || "Avatar"}
                            className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-2 ring-slate-200/70 dark:ring-slate-700/60"
                          />
                        ) : (
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-500 text-2xl font-black text-white ring-2 ring-slate-200/70 dark:ring-slate-700/60">
                            {(user?.name || user?.email || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <div className="flex flex-1 flex-col gap-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => avatarInputRef.current?.click()}
                              disabled={avatarUploading}
                              className="h-10 rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800/70"
                            >
                              {avatarUploading
                                ? t("profile.uploading")
                                : user?.avatar_url
                                  ? t("profile.changePicture")
                                  : t("profile.uploadPicture")}
                            </button>
                            {user?.avatar_url && (
                              <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                disabled={avatarUploading}
                                className="h-10 rounded-full px-4 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60 dark:text-rose-400 dark:hover:bg-rose-500/10"
                              >
                                {t("profile.remove")}
                              </button>
                            )}
                          </div>
                          <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarFileChange}
                          />
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard>
                      <SectionHeader
                        title={t("profile.detailsTitle")}
                        description={t("profile.detailsDescription")}
                      />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <SettingsInput
                          label={t("profile.currentUsername")}
                          defaultValue={user?.name || ""}
                          readOnly
                          disabled
                          icon={<CircleOff size={14} />}
                        />
                        <SettingsInput
                          label={t("profile.newUsername")}
                          placeholder={t("profile.newUsernamePlaceholder")}
                          error={profileForm.formState.errors.newName?.message}
                          {...profileForm.register("newName")}
                        />
                        <SettingsInput
                          label={t("profile.age")}
                          type="number"
                          placeholder={t("profile.agePlaceholder")}
                          min={13}
                          max={120}
                          error={profileForm.formState.errors.age?.message}
                          {...profileForm.register("age")}
                        />
                      </div>
                      <div className="mt-5 flex justify-end">
                        <StatefulButton
                          onClick={handleSaveProfile}
                          state={
                            profileForm.formState.isSubmitting
                              ? "loading"
                              : "idle"
                          }
                          className="h-10 w-auto rounded-full px-6 text-sm font-semibold"
                        >
                          {t("profile.save")}
                        </StatefulButton>
                      </div>
                    </SectionCard>

                    {/* About me — bio + interest/freeform tags. */}
                    <SectionCard>
                      <SectionHeader
                        title={t("profile.aboutTitle")}
                        description={t("profile.aboutDescription")}
                      />
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t("profile.bioLabel")}
                      </label>
                      <textarea
                        value={aboutBio}
                        onChange={(e) => setAboutBio(e.target.value)}
                        rows={3}
                        maxLength={300}
                        placeholder={t("profile.bioPlaceholder")}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-800"
                      />
                      <p className="mt-1 text-right text-[11px] text-slate-400">
                        {aboutBio.length}/300
                      </p>

                      <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t("profile.interestsLabel")}
                      </label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {CURATED_INTERESTS.map((interest) => {
                          const on = aboutInterests.includes(interest);
                          return (
                            <button
                              key={interest}
                              type="button"
                              onClick={() => toggleInterest(interest)}
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                                on
                                  ? "bg-indigo-100 text-indigo-700 ring-1 ring-inset ring-indigo-300 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/40"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
                              )}
                            >
                              {interest}
                            </button>
                          );
                        })}
                      </div>

                      <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t("profile.tagsLabel")}
                      </label>
                      {aboutTags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {aboutTags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            >
                              #{tag}
                              <button
                                type="button"
                                onClick={() =>
                                  setAboutTags((prev) =>
                                    prev.filter((x) => x !== tag),
                                  )
                                }
                                aria-label={`Remove ${tag}`}
                                className="text-slate-400 hover:text-rose-500"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex gap-2">
                        <input
                          value={tagDraft}
                          onChange={(e) => setTagDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                          maxLength={24}
                          placeholder={t("profile.tagsPlaceholder")}
                          className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-800"
                        />
                        <button
                          type="button"
                          onClick={addTag}
                          disabled={
                            !tagDraft.trim() || aboutTags.length >= 10
                          }
                          className="h-10 shrink-0 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                        >
                          {t("profile.tagsAdd")}
                        </button>
                      </div>

                      <div className="mt-5 flex justify-end">
                        <StatefulButton
                          onClick={handleSaveAbout}
                          state={savingAbout ? "loading" : "idle"}
                          className="h-10 w-auto rounded-full px-6 text-sm font-semibold"
                        >
                          {t("profile.save")}
                        </StatefulButton>
                      </div>
                    </SectionCard>

                    {/* UI preferences — language + theme. They sit here in
                        Profile (not Content) since they control how the app
                        looks for you, not what gets recommended. */}
                    <SectionCard>
                      <LanguageSwitcher />
                    </SectionCard>

                    <SectionCard>
                      <p className="mb-1 text-base font-bold tracking-tight">
                        {t("theme.title")}
                      </p>
                      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
                        {t("theme.description")}
                      </p>
                      <SegmentedControl<ThemeChoice>
                        layoutId="settings-theme"
                        value={(theme as ThemeChoice) ?? "system"}
                        onChange={setTheme}
                        ariaLabel={t("theme.title")}
                        options={[
                          {
                            value: "light",
                            label: t("theme.light"),
                            icon: <Sun size={14} />,
                            pillClassName: "bg-amber-500",
                          },
                          {
                            value: "dark",
                            label: t("theme.dark"),
                            icon: <Moon size={14} />,
                            pillClassName: "bg-indigo-600",
                          },
                          {
                            value: "system",
                            label: t("theme.system"),
                            icon: <Monitor size={14} />,
                            pillClassName: "bg-slate-700 dark:bg-slate-600",
                          },
                        ]}
                      />
                    </SectionCard>
                  </motion.div>
                )}

                {activeSection === "security" && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, x: sectionSlideDir * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: sectionSlideDir * -30 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Email */}
                    <SectionCard>
                      <SectionHeader
                        title={t("email.title")}
                        description={t("email.description")}
                      />

                      <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-800/40">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Mail
                            size={16}
                            className="shrink-0 text-slate-400 dark:text-slate-500"
                          />
                          <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {user?.email || "—"}
                          </span>
                        </div>
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {t("email.current")}
                        </span>
                      </div>

                      <SettingsInput
                        label={t("email.newEmail")}
                        placeholder={t("email.newEmailPlaceholder")}
                        error={emailForm.formState.errors.newEmail?.message}
                        {...emailForm.register("newEmail")}
                      />

                      <div className="mt-5 flex justify-end">
                        <StatefulButton
                          onClick={handleSaveEmail}
                          state={
                            emailForm.formState.isSubmitting
                              ? "loading"
                              : "idle"
                          }
                          className="h-10 w-auto rounded-full px-6 text-sm font-semibold"
                        >
                          {t("email.update")}
                        </StatefulButton>
                      </div>
                    </SectionCard>

                    {/* Password */}
                    <SectionCard>
                      <SectionHeader
                        title={t("password.title")}
                        description={t("password.description")}
                      />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <div ref={newPasswordAnchorRef}>
                            <SettingsInput
                              label={t("password.newPassword")}
                              type="password"
                              placeholder={t("password.passwordPlaceholder")}
                              icon={<Lock size={14} />}
                              error={
                                passwordForm.formState.errors.newPassword
                                  ?.message
                              }
                              {...passwordForm.register("newPassword", {
                                onBlur: () => setNewPasswordFocused(false),
                              })}
                              onFocus={() => setNewPasswordFocused(true)}
                            />
                          </div>
                          <FieldRequirements
                            rules={newPasswordRules}
                            visible={newPasswordFocused}
                            anchorRef={newPasswordAnchorRef}
                            title={t("password.requirementsTitle")}
                          />
                        </div>
                        <div>
                          <div ref={confirmPasswordAnchorRef}>
                            <SettingsInput
                              label={t("password.confirmPassword")}
                              type="password"
                              placeholder={t("password.passwordPlaceholder")}
                              icon={<Lock size={14} />}
                              error={
                                passwordForm.formState.errors.confirmPassword
                                  ?.message
                              }
                              {...passwordForm.register("confirmPassword", {
                                onBlur: () => setConfirmPasswordFocused(false),
                              })}
                              onFocus={() => setConfirmPasswordFocused(true)}
                            />
                          </div>
                          <FieldRequirements
                            rules={confirmPasswordRules}
                            visible={confirmPasswordFocused}
                            anchorRef={confirmPasswordAnchorRef}
                            title={t("password.confirmRulesTitle")}
                          />
                        </div>
                      </div>
                      <div className="mt-5 flex justify-end">
                        <StatefulButton
                          onClick={handleSavePassword}
                          state={
                            passwordForm.formState.isSubmitting
                              ? "loading"
                              : "idle"
                          }
                          className="h-10 w-auto rounded-full px-6 text-sm font-semibold"
                        >
                          {t("password.update")}
                        </StatefulButton>
                      </div>
                    </SectionCard>

                    {/* MFA — same SectionHeader pattern as the others */}
                    <SectionCard>
                      {!showMfaPanel ? (
                        <>
                          <SectionHeader
                            title={t("mfa.title")}
                            description={t("mfa.description")}
                          />

                          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-800/40">
                            <div className="flex items-center gap-2.5">
                              <ShieldCheck
                                size={16}
                                className={cn(
                                  "shrink-0",
                                  mfaEnabled
                                    ? "text-emerald-500 dark:text-emerald-400"
                                    : "text-slate-400 dark:text-slate-500",
                                )}
                              />
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                {mfaChecked
                                  ? mfaEnabled
                                    ? t("mfa.on")
                                    : t("mfa.off")
                                  : t("mfa.checking")}
                              </span>
                            </div>
                            {mfaChecked && (
                              <span
                                className={cn(
                                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                  mfaEnabled
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                                )}
                              >
                                {mfaEnabled ? t("mfa.enabled") : t("mfa.disabled")}
                              </span>
                            )}
                          </div>

                          <div className="mt-5 flex justify-end">
                            <StatefulButton
                              onClick={() => {
                                if (mfaEnabled) {
                                  setShowMfaPanel(true);
                                } else {
                                  setMfaSetupModal({
                                    open: true,
                                    isAdditional: false,
                                  });
                                }
                              }}
                              // Same controlled-state fix as the Add
                              // Authenticator and Add Passkey buttons —
                              // without this, the synchronous handler
                              // returns undefined and StatefulButton's
                              // auto-detect flashes a green check before
                              // the modal/panel even mounts.
                              state={
                                mfaSetupModal.open &&
                                !mfaSetupModal.isAdditional
                                  ? "loading"
                                  : "idle"
                              }
                              className="h-10 w-auto rounded-full px-6 text-sm font-semibold"
                            >
                              {mfaEnabled
                                ? t("mfa.manage")
                                : t("mfa.enable")}
                            </StatefulButton>
                          </div>
                        </>
                      ) : (
                        <MfaManagement
                          key={mfaPanelKey}
                          mfaEnabled={mfaEnabled}
                          onMfaStatusChange={() => setShowMfaPanel(false)}
                          onAddAuthenticator={async () => {
                            // Adding a factor requires AAL2 — the user has
                            // to re-verify their existing TOTP first.
                            // Without this, the API rejects the enroll call
                            // with AAL2_REQUIRED and the setup modal shows
                            // "Failed to start MFA enrollment".
                            const verified = await requestVerification(
                              t("verifyAction.addAuthenticator"),
                            );
                            if (!verified) return;
                            setMfaSetupModal({
                              open: true,
                              isAdditional: true,
                            });
                          }}
                          addingAuthenticator={
                            mfaSetupModal.open && mfaSetupModal.isAdditional
                          }
                        />
                      )}
                    </SectionCard>

                    {/* Passkeys */}
                    <SectionCard>
                      <PasskeyManagement />
                    </SectionCard>

                    {/* Backup Email */}
                    <SectionCard>
                      <SectionHeader
                        title={t("backupEmail.title")}
                        description={t("backupEmail.description")}
                      />

                      {currentBackupEmail && (
                        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-800/40">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <Mail
                              size={16}
                              className="shrink-0 text-slate-400 dark:text-slate-500"
                            />
                            <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {currentBackupEmail}
                            </span>
                          </div>
                          <button
                            onClick={handleRemoveBackupEmail}
                            disabled={removingBackupEmail}
                            className="shrink-0 text-xs font-semibold text-rose-600 transition-colors hover:text-rose-500 disabled:opacity-50 dark:text-rose-400"
                          >
                            {t("backupEmail.remove")}
                          </button>
                        </div>
                      )}

                      <SettingsInput
                        label={
                          currentBackupEmail
                            ? t("backupEmail.labelChange")
                            : t("backupEmail.labelDefault")
                        }
                        placeholder={
                          currentBackupEmail
                            ? t("backupEmail.placeholderChange")
                            : t("backupEmail.placeholderDefault")
                        }
                        error={
                          backupEmailForm.formState.errors.backupEmail?.message
                        }
                        {...backupEmailForm.register("backupEmail")}
                      />

                      <div className="mt-5 flex justify-end">
                        <StatefulButton
                          onClick={handleSaveBackupEmail}
                          state={
                            backupEmailForm.formState.isSubmitting
                              ? "loading"
                              : "idle"
                          }
                          className="h-10 w-auto rounded-full px-6 text-sm font-semibold"
                        >
                          {currentBackupEmail
                            ? t("backupEmail.update")
                            : t("backupEmail.save")}
                        </StatefulButton>
                      </div>
                    </SectionCard>

                    {/* Sessions */}
                    {user?.id && (
                      <SectionCard>
                        <SessionsManagement
                          userId={user.id}
                          requestVerification={requestVerification}
                        />
                      </SectionCard>
                    )}
                  </motion.div>
                )}

                {activeSection === "content" && (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, x: sectionSlideDir * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: sectionSlideDir * -30 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <SectionCard>
                      <SectionHeader
                        title={t("content.title")}
                        description={t("content.description")}
                      />

                      <div className="space-y-6">
                        <div>
                          <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            {t("content.typeLabel")}
                          </p>
                          <SegmentedControl<
                            "movie" | "book" | "music" | "both" | "mix"
                          >
                            layoutId="settings-content-focus"
                            value={contentFocus}
                            onChange={setContentFocus}
                            ariaLabel={t("content.typeLabel")}
                            options={[
                              {
                                value: "movie",
                                label: t("content.type.movie.label"),
                                pillClassName: "bg-amber-500",
                              },
                              {
                                value: "book",
                                label: t("content.type.book.label"),
                                pillClassName: "bg-emerald-500",
                              },
                              {
                                value: "music",
                                label: t("content.type.music.label"),
                                pillClassName: "bg-rose-500",
                              },
                              {
                                value: "mix",
                                label: t("content.type.mix.label"),
                                pillClassName: "bg-violet-500",
                              },
                            ]}
                          />
                        </div>

                        <div>
                          <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            {t("content.toneLabel")}
                          </p>
                          {(user?.age ?? 0) < 18 ? (
                            <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/60 p-4 dark:border-indigo-500/30 dark:from-indigo-500/10 dark:via-slate-900/40 dark:to-violet-500/10">
                              <span
                                aria-hidden="true"
                                className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-400 to-violet-500"
                              />
                              <div className="flex items-center gap-2 pl-2">
                                <ShieldCheck
                                  size={14}
                                  className="text-indigo-600 dark:text-indigo-400"
                                />
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">
                                  {t("content.ageLockedEyebrow")}
                                </p>
                              </div>
                              <p className="mt-2 pl-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                                {user?.age != null
                                  ? t("content.ageLockedBody", {
                                      age: user.age,
                                    })
                                  : t("content.ageLockedBodyMissing")}
                              </p>
                            </div>
                          ) : (
                            <SegmentedControl<"standard" | "family">
                              layoutId="settings-content-tone"
                              value={contentTone}
                              onChange={setContentTone}
                              ariaLabel={t("content.toneLabel")}
                              options={[
                                {
                                  value: "standard",
                                  label: t("content.tone.standard"),
                                  pillClassName: "bg-indigo-500",
                                },
                                {
                                  value: "family",
                                  label: t("content.tone.family"),
                                  pillClassName: "bg-emerald-500",
                                },
                              ]}
                            />
                          )}
                          {(user?.age ?? 0) >= 18 && (
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                              {contentTone === "family"
                                ? t("content.toneHint.family")
                                : t("content.toneHint.standard")}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            {t("content.questionCountLabel")}
                          </p>
                          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-indigo-50/60 via-white to-violet-50/60 p-5 dark:border-slate-700/70 dark:from-indigo-500/5 dark:via-slate-900/40 dark:to-violet-500/5">
                            <div className="mb-4 flex items-end justify-between gap-4">
                              <div>
                                <motion.p
                                  key={preferredQuestionCount}
                                  initial={{ scale: 0.9, opacity: 0.7 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{
                                    duration: 0.18,
                                    ease: "easeOut",
                                  }}
                                  className={cn(
                                    "text-5xl font-black tracking-tighter leading-none transition-colors",
                                    questionStyle.text,
                                  )}
                                >
                                  {preferredQuestionCount}
                                </motion.p>
                                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                  {t("content.questionWord", {
                                    count: preferredQuestionCount,
                                  })}
                                </p>
                              </div>
                              <p
                                className={cn(
                                  "text-sm font-bold tracking-tight transition-colors",
                                  questionStyle.text,
                                )}
                              >
                                {t(
                                  `content.depth.${questionTier(
                                    preferredQuestionCount,
                                  )}`,
                                )}
                              </p>
                            </div>
                            <input
                              type="range"
                              min={3}
                              max={15}
                              value={preferredQuestionCount}
                              onChange={(e) =>
                                setPreferredQuestionCount(
                                  Number(e.target.value),
                                )
                              }
                              aria-label={t("content.rangeAria")}
                              className={cn(
                                "w-full cursor-pointer transition-colors",
                                questionStyle.accent,
                              )}
                            />
                            <div className="mt-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              <span>3</span>
                              <span>15</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {t("content.appliesNext")}
                        </span>
                        <StatefulButton
                          onClick={handleSaveContentPreferences}
                          state={savingContent ? "loading" : "idle"}
                          className="h-10 w-auto rounded-full px-6 text-sm font-semibold"
                        >
                          {t("content.save")}
                        </StatefulButton>
                      </div>
                    </SectionCard>

                    <RecommendationFiltersCard />
                  </motion.div>
                )}

                {activeSection === "feed" && (
                  <motion.div
                    key="feed"
                    initial={{ opacity: 0, x: sectionSlideDir * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: sectionSlideDir * -30 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <SectionCard>
                      <SectionHeader
                        title={t("feed.title")}
                        description={t("feed.description")}
                      />
                      <div className="space-y-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                          {t("feed.visibilityLabel")}
                        </p>
                        <SegmentedControl<FeedVisibility>
                          layoutId="settings-feed-visibility"
                          value={feedVisibility}
                          onChange={setFeedVisibility}
                          ariaLabel={t("feed.visibilityLabel")}
                          options={[
                            {
                              value: "public",
                              label: t("feed.public"),
                              pillClassName: "bg-violet-500",
                            },
                            {
                              value: "private",
                              label: t("feed.private"),
                              pillClassName: "bg-slate-500",
                            },
                          ]}
                        />
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {feedVisibility === "private"
                            ? t("feed.privateHint")
                            : t("feed.publicHint")}
                        </p>
                      </div>
                    </SectionCard>

                    <SectionCard>
                      <SectionHeader
                        title={t("feed.prefsTitle")}
                        description={t("feed.prefsDescription")}
                      />
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            {t("feed.viewLabel")}
                          </p>
                          <SegmentedControl<FeedView>
                            layoutId="settings-feed-view"
                            value={feedPrefs.view}
                            onChange={(v) => setFeedPrefs({ view: v })}
                            ariaLabel={t("feed.viewLabel")}
                            options={[
                              {
                                value: "cards",
                                label: t("feed.viewCards"),
                                pillClassName: "bg-violet-500",
                              },
                              {
                                value: "list",
                                label: t("feed.viewList"),
                                pillClassName: "bg-slate-500",
                              },
                            ]}
                          />
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            {t("feed.scopeLabel")}
                          </p>
                          <SegmentedControl<FeedScope>
                            layoutId="settings-feed-scope"
                            value={feedPrefs.scope}
                            onChange={(v) => setFeedPrefs({ scope: v })}
                            ariaLabel={t("feed.scopeLabel")}
                            options={[
                              {
                                value: "friends",
                                label: t("feed.scopeFriends"),
                                pillClassName: "bg-indigo-500",
                              },
                              {
                                value: "discover",
                                label: t("feed.scopeDiscover"),
                                pillClassName: "bg-violet-500",
                              },
                              {
                                value: "group",
                                label: t("feed.scopeGroup"),
                                pillClassName: "bg-rose-500",
                              },
                            ]}
                          />
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            {t("feed.communityLabel")}
                          </p>
                          <SegmentedControl<FeedCommunity | "all">
                            layoutId="settings-feed-community"
                            value={feedPrefs.community}
                            onChange={(v) => setFeedPrefs({ community: v })}
                            ariaLabel={t("feed.communityLabel")}
                            options={[
                              {
                                value: "all",
                                label: t("feed.communityAll"),
                                pillClassName: "bg-violet-500",
                              },
                              {
                                value: "movies",
                                label: t("feed.communityMovies"),
                                pillClassName: "bg-amber-500",
                              },
                              {
                                value: "books",
                                label: t("feed.communityBooks"),
                                pillClassName: "bg-emerald-500",
                              },
                              {
                                value: "music",
                                label: t("feed.communityMusic"),
                                pillClassName: "bg-rose-500",
                              },
                            ]}
                          />
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            {t("feed.commentSortLabel")}
                          </p>
                          <SegmentedControl<CommentSort>
                            layoutId="settings-feed-comment-sort"
                            value={feedPrefs.commentSort}
                            onChange={(v) => setFeedPrefs({ commentSort: v })}
                            ariaLabel={t("feed.commentSortLabel")}
                            options={[
                              {
                                value: "top",
                                label: t("feed.commentSortTop"),
                                pillClassName: "bg-violet-500",
                              },
                              {
                                value: "new",
                                label: t("feed.commentSortNew"),
                                pillClassName: "bg-indigo-500",
                              },
                            ]}
                          />
                        </div>
                      </div>
                    </SectionCard>

                    <BlockedPeopleCard />
                    <MyReportsCard />
                  </motion.div>
                )}

                {activeSection === "notifications" && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, x: sectionSlideDir * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: sectionSlideDir * -30 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <ActivityNotificationsCard />
                  </motion.div>
                )}

                {activeSection === "integrations" && (
                  <motion.div
                    key="integrations"
                    initial={{ opacity: 0, x: sectionSlideDir * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: sectionSlideDir * -30 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <SectionCard>
                      <SectionHeader
                        title={t("integrations.title")}
                        description={t("integrations.description")}
                      />
                      <div className="rounded-2xl border border-dashed border-slate-300/80 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/40 p-10 text-center dark:border-slate-700/70 dark:from-slate-900/40 dark:via-slate-900/20 dark:to-slate-900/40">
                        <Link2
                          className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600"
                          aria-hidden="true"
                        />
                        <p className="mt-4 text-xl font-black tracking-tight text-slate-700 dark:text-slate-200">
                          {t("integrations.emptyTitle")}
                        </p>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                          {t("integrations.emptyBody")}
                        </p>
                      </div>
                    </SectionCard>

                    {/* Danger Zone */}
                    <SectionCard className="!border-red-200/70 dark:!border-red-900/40">
                      <div className="mb-4">
                        <h2 className="text-xl font-black tracking-tight text-red-700 sm:text-2xl dark:text-red-400">
                          {t("danger.title")}
                        </h2>
                        <p className="mt-1 text-sm text-red-600/80 dark:text-red-300/70">
                          {t("danger.description")}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <PillButton
                          onClick={handleDisableAccount}
                          disabled={accountActionLoading}
                          variant="destructive"
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                        >
                          <UserMinus size={14} />
                          {accountActionLoading
                            ? t("danger.processing")
                            : t("danger.disable")}
                        </PillButton>
                        <PillButton
                          onClick={handleDeleteAccount}
                          disabled={accountActionLoading}
                          variant="destructive"
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          {accountActionLoading
                            ? t("danger.processing")
                            : t("danger.delete")}
                        </PillButton>
                      </div>
                    </SectionCard>
                  </motion.div>
                )}

                {activeSection === "help" && (
                  <motion.div
                    key="help"
                    initial={{ opacity: 0, x: sectionSlideDir * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: sectionSlideDir * -30 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <SectionCard>
                      <SectionHeader
                        title={t("help.title")}
                        description={t("help.description")}
                      />
                      <div className="space-y-3">
                        <a
                          href="/#faq"
                          className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-indigo-500/60 dark:hover:bg-indigo-500/10"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                            <LifeBuoy size={18} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {t("help.faq.title")}
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                              {t("help.faq.subtitle")}
                            </span>
                          </span>
                        </a>
                        <button
                          type="button"
                          onClick={() => router.push("/quiz")}
                          className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-violet-300 hover:bg-violet-50/40 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-violet-500/60 dark:hover:bg-violet-500/10"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                            <Sparkles size={18} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {t("help.takeQuiz.title")}
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                              {t("help.takeQuiz.subtitle")}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push("/feed/people")}
                          className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-rose-300 hover:bg-rose-50/40 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-rose-500/60 dark:hover:bg-rose-500/10"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                            <UserPlus size={18} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {t("help.findFriends.title")}
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                              {t("help.findFriends.subtitle")}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push("/milestones")}
                          className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-amber-300 hover:bg-amber-50/40 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-amber-500/60 dark:hover:bg-amber-500/10"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                            <Trophy size={18} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {t("help.milestones.title")}
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                              {t("help.milestones.subtitle")}
                            </span>
                          </span>
                        </button>
                        {/* Onboarding replay — dev-build only. Useful
                            for screenshots and QA; gated by
                            NODE_ENV !== 'production' so it never ships. */}
                        {process.env.NODE_ENV !== "production" && (
                          <button
                            type="button"
                            onClick={() =>
                              router.push("/onboarding?preview=true")
                            }
                            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-slate-600 dark:bg-slate-900/60 dark:hover:border-indigo-500/60 dark:hover:bg-indigo-500/10"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              <UserCircle size={18} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {t("help.showOnboarding.title")}
                              </span>
                              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                {t("help.showOnboarding.subtitle")}
                              </span>
                            </span>
                          </button>
                        )}
                      </div>
                    </SectionCard>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MFA Verification Modal */}
      <AnimatePresence>
        {verifyModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => closeVerifyModal(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Identity verification"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative mx-4 w-full max-w-md rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xl dark:border-slate-700/60 dark:bg-slate-900"
            >
              <button
                onClick={() => closeVerifyModal(false)}
                aria-label={t("verifyModal.closeAria")}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>

              {verifyModal.mode === "totp" ? (
                <>
                  <div className="mb-5">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="rounded-xl bg-violet-100 p-2 dark:bg-violet-900/30">
                        <ShieldCheck
                          size={18}
                          className="text-violet-600 dark:text-violet-400"
                        />
                      </div>
                      <h3 className="text-lg font-bold">
                        {t("verifyModal.title")}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t("verifyModal.description", {
                        action: verifyModal.actionLabel,
                      })}
                    </p>
                  </div>

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setVerifyCode(v);
                      setVerifyError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleVerifySubmit();
                    }}
                    placeholder={t("verifyModal.placeholder")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-2xl font-mono tracking-[0.3em] transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
                    autoFocus
                  />

                  {verifyError && (
                    <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
                      {verifyError}
                    </p>
                  )}

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => closeVerifyModal(false)}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {t("verifyModal.cancel")}
                    </button>
                    <StatefulButton
                      onClick={handleVerifySubmit}
                      state={verifyLoading ? "loading" : "idle"}
                      disabled={verifyCode.length !== 6}
                      className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold"
                    >
                      {t("verifyModal.verify")}
                    </StatefulButton>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="rounded-xl bg-violet-100 p-2 dark:bg-violet-900/30">
                        <ShieldCheck
                          size={18}
                          className="text-violet-600 dark:text-violet-400"
                        />
                      </div>
                      <h3 className="text-lg font-bold">
                        {t("verifyModalEnroll.title")}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t("verifyModalEnroll.description", {
                        action: verifyModal.actionLabel,
                      })}
                    </p>
                  </div>

                  <MfaSetup
                    skipIntro
                    onComplete={() => {
                      setMfaEnabled(true);
                      closeVerifyModal(true);
                    }}
                    onSkip={() => closeVerifyModal(false)}
                  />
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mfaSetupModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() =>
              setMfaSetupModal((prev) => ({ ...prev, open: false }))
            }
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Set up two-factor authentication"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200/70 bg-white shadow-xl dark:border-slate-700/60 dark:bg-slate-900"
            >
              <button
                onClick={() =>
                  setMfaSetupModal((prev) => ({ ...prev, open: false }))
                }
                aria-label={t("mfaSetupModal.closeAria")}
                className="absolute right-4 top-4 z-10 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
              <MfaSetup
                skipIntro
                skipBackupCodes={mfaSetupModal.isAdditional}
                onComplete={() => {
                  setMfaEnabled(true);
                  setMfaSetupModal({ open: false, isAdditional: false });
                  setMfaPanelKey((k) => k + 1);
                }}
                onSkip={() =>
                  setMfaSetupModal({ open: false, isAdditional: false })
                }
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
