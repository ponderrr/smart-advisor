"use client";

import { useCallback, useEffect, useRef, useState, forwardRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/features/auth/hooks/use-auth";
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
  SessionsManagement,
} from "@/features/auth/components";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { PillButton } from "@/components/ui/pill-button";
import { PageLoader } from "@/components/ui/loader";
import { AppNavbar } from "@/components/app-navbar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SettingsSection = "profile" | "security" | "content" | "integrations";

/* ------------------------------------------------------------------ */
/*  Zod schemas                                                       */
/* ------------------------------------------------------------------ */
const profileSchema = z.object({
  newName: z.string().min(1, "Username is required").trim(),
  age: z.coerce.number().int().min(13, "Must be at least 13").max(120, "Must be 120 or under").optional().or(z.literal("")),
});

const emailSchema = z.object({
  newEmail: z.string().email("Enter a valid email").trim(),
});

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const backupEmailSchema = z.object({
  backupEmail: z.string().email("Enter a valid email").trim(),
});

const PREF_CONTENT_KEY = "smart_advisor_pref_content_focus";
const PREF_CONTENT_TONE_KEY = "smart_advisor_pref_content_tone";
const PREF_QUESTION_COUNT_KEY = "smart_advisor_pref_question_count";

/* ------------------------------------------------------------------ */
/*  Reusable sub-components                                          */
/* ------------------------------------------------------------------ */

const SectionCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/60 sm:p-6",
      className,
    )}
  >
    {children}
  </div>
);

const SectionHeader = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="mb-5">
    <h2 className="text-xl font-bold tracking-tight">{title}</h2>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
      {description}
    </p>
  </div>
);

const SettingsInput = forwardRef<
  HTMLInputElement,
  {
    label: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
    readOnly?: boolean;
    icon?: React.ReactNode;
    error?: string;
  } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">
>(({ label, placeholder, type = "text", disabled = false, readOnly = false, icon, error, ...props }, ref) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {label}
    </span>
    <div className="relative">
      <input
        ref={ref}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
        readOnly={readOnly}
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-indigo-500",
          (disabled || readOnly) &&
            "cursor-not-allowed bg-slate-50 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400",
          error && "border-red-300 focus:border-red-400 focus:ring-red-500/20 dark:border-red-700",
        )}
        {...props}
      />
      {icon && (
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>
      )}
    </div>
    {error && (
      <p className="text-xs font-medium text-red-500 dark:text-red-400">{error}</p>
    )}
  </label>
));
SettingsInput.displayName = "SettingsInput";


/* ------------------------------------------------------------------ */
/*  Main settings page                                                */
/* ------------------------------------------------------------------ */

const SettingsPage = () => {
  const router = useRouter();
  const {
    user,
    updateProfile,
    updateEmail,
    updatePassword,
    uploadAvatar,
    removeAvatar,
  } = useAuth();
  const { ready } = useRequireAuth();

  const settingsTabs: SettingsSection[] = ["profile", "security", "content", "integrations"];
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("profile");
  // Section transitions always slide rightward — entering content starts on
  // the left and moves to center — so the motion feels consistent regardless
  // of which tab the user came from.
  const sectionSlideDir = -1;

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { newName: user?.name ?? "", age: user?.age ?? 18 },
  });

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { newEmail: "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const backupEmailForm = useForm<z.infer<typeof backupEmailSchema>>({
    resolver: zodResolver(backupEmailSchema),
    defaultValues: { backupEmail: "" },
  });

  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [contentFocus, setContentFocus] = useState("both");
  const [contentTone, setContentTone] = useState<"standard" | "family">(
    "standard",
  );
  const [preferredQuestionCount, setPreferredQuestionCount] = useState(5);
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const [showMfaPanel, setShowMfaPanel] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaChecked, setMfaChecked] = useState(false);
  const [currentBackupEmail, setCurrentBackupEmail] = useState<string | null>(
    null,
  );
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    // Reset so re-selecting the same file still fires onChange.
    event.target.value = "";
    if (!file) return;
    setAvatarUploading(true);
    const result = await uploadAvatar(file);
    setAvatarUploading(false);
    if (result.error) {
      showMessage(result.error, "error");
    } else {
      showMessage("Profile picture updated.", "success");
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    const result = await removeAvatar();
    setAvatarUploading(false);
    if (result.error) {
      showMessage(result.error, "error");
    } else {
      showMessage("Profile picture removed.", "success");
    }
  };

  const showMessage = (
    text: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setMessage({ text, type });
    if (type === "success") toast.success(text);
    else if (type === "error") toast.error(text);
    else toast.info(text);
  };

  // MFA verification modal state
  const [verifyModal, setVerifyModal] = useState<{
    open: boolean;
    actionLabel: string;
    mode: "totp" | "enroll";
  }>({ open: false, actionLabel: "", mode: "totp" });
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const verifyResolveRef = useRef<((ok: boolean) => void) | null>(null);

  const requestVerification = useCallback(
    (actionLabel: string): Promise<boolean> => {
      return new Promise((resolve) => {
        verifyResolveRef.current = resolve;
        setVerifyCode("");
        setVerifyError("");
        setVerifyLoading(false);
        setVerifyModal({
          open: true,
          actionLabel,
          mode: mfaEnabled ? "totp" : "enroll",
        });
      });
    },
    [mfaEnabled],
  );

  const closeVerifyModal = useCallback((result: boolean) => {
    setVerifyModal((prev) => ({ ...prev, open: false }));
    verifyResolveRef.current?.(result);
    verifyResolveRef.current = null;
  }, []);

  const handleVerifySubmit = useCallback(async () => {
    if (verifyCode.length !== 6) {
      setVerifyError("Enter a 6-digit code");
      return;
    }
    setVerifyLoading(true);
    setVerifyError("");
    const { data: factors } = await authService.listMFAFactors();
    const factor = factors?.totp?.find((f: MFAFactor) => f.status === "verified");
    if (!factor) {
      setVerifyError("No verified MFA factor found");
      setVerifyLoading(false);
      return;
    }
    const result = await authService.verifyMFA(factor.id, verifyCode);
    setVerifyLoading(false);
    if (result.error) {
      setVerifyError(result.error);
    } else {
      closeVerifyModal(true);
    }
  }, [verifyCode, closeVerifyModal]);

  const sectionTabs: {
    id: SettingsSection;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: "profile", label: "Profile", icon: <UserRound size={15} /> },
    { id: "security", label: "Security", icon: <Shield size={15} /> },
    { id: "content", label: "Content", icon: <SlidersHorizontal size={15} /> },
    { id: "integrations", label: "Integrations", icon: <Link2 size={15} /> },
  ];

  const handleSaveProfile = profileForm.handleSubmit(async (data) => {
    setMessage(null);
    const verified = await requestVerification("save your profile");
    if (!verified) return;
    const parsedAge = typeof data.age === "number" ? data.age : 25;
    const result = await updateProfile(data.newName, parsedAge);
    showMessage(
      result.error ?? "Profile updated.",
      result.error ? "error" : "success",
    );
  });

  const handleSaveEmail = emailForm.handleSubmit(async (data) => {
    setMessage(null);
    if (
      user?.email &&
      data.newEmail.toLowerCase() === user.email.trim().toLowerCase()
    ) {
      showMessage("New email must be different.", "error");
      return;
    }
    const verified = await requestVerification("update your email");
    if (!verified) return;
    const result = await updateEmail(data.newEmail);
    showMessage(
      result.error ?? "Check your inbox to confirm.",
      result.error ? "error" : "success",
    );
  });

  const handleSavePassword = passwordForm.handleSubmit(async (data) => {
    setMessage(null);
    const verified = await requestVerification("change your password");
    if (!verified) return;
    const result = await updatePassword(data.newPassword);
    if (result.error) {
      showMessage(result.error, "error");
    } else {
      showMessage("Password updated.", "success");
      passwordForm.reset();
    }
  });

  const handleSaveContentPreferences = async () => {
    if (typeof window === "undefined") return;
    const verified = await requestVerification("save content preferences");
    if (!verified) return;
    window.localStorage.setItem(PREF_CONTENT_KEY, contentFocus);
    window.localStorage.setItem(PREF_CONTENT_TONE_KEY, contentTone);
    window.localStorage.setItem(
      PREF_QUESTION_COUNT_KEY,
      String(preferredQuestionCount),
    );
    showMessage("Content preferences saved.", "success");
  };

  const handleDisableAccount = async () => {
    if (
      !window.confirm(
        "Disable your account? You'll be signed out and unable to sign in until re-enabled by support.",
      )
    )
      return;
    const verified = await requestVerification("disable your account");
    if (!verified) return;
    if (!window.confirm("Final confirmation. Disable now?")) return;
    setAccountActionLoading(true);
    setMessage(null);
    const result = await authService.disableAccount();
    if (result.error) {
      showMessage(result.error, "error");
      setAccountActionLoading(false);
      return;
    }
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm("Permanently delete your account? This cannot be undone.")
    )
      return;
    const verified = await requestVerification(
      "permanently delete your account",
    );
    if (!verified) return;
    const typed = window.prompt('Type "DELETE" to confirm:');
    if (typed !== "DELETE") {
      showMessage("Deletion canceled.", "info");
      return;
    }
    setAccountActionLoading(true);
    setMessage(null);
    const result = await authService.deleteAccount();
    if (result.error) {
      showMessage(result.error, "error");
      setAccountActionLoading(false);
      return;
    }
    router.push("/");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sc = window.localStorage.getItem(PREF_CONTENT_KEY);
    const st = window.localStorage.getItem(PREF_CONTENT_TONE_KEY);
    const sq = Number(
      window.localStorage.getItem(PREF_QUESTION_COUNT_KEY) || "5",
    );
    if (sc && ["movie", "book", "both"].includes(sc)) setContentFocus(sc);
    if (st === "standard" || st === "family") setContentTone(st);
    if (Number.isFinite(sq) && sq >= 3 && sq <= 15)
      setPreferredQuestionCount(sq);
  }, []);

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

  const handleSaveBackupEmail = backupEmailForm.handleSubmit(async (data) => {
    const { error } = await authService.setBackupEmail(data.backupEmail);
    if (error) {
      showMessage(error, "error");
    } else {
      setCurrentBackupEmail(data.backupEmail);
      backupEmailForm.reset();
      showMessage("Backup email saved.", "success");
    }
  });

  const [removingBackupEmail, setRemovingBackupEmail] = useState(false);
  const handleRemoveBackupEmail = async () => {
    setRemovingBackupEmail(true);
    const { error } = await authService.removeBackupEmail();
    setRemovingBackupEmail(false);
    if (error) {
      showMessage(error, "error");
    } else {
      setCurrentBackupEmail(null);
      showMessage("Backup email removed.", "success");
    }
  };

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
              Settings
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tighter sm:text-4xl md:text-5xl">
              Account Settings
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Manage your profile, security, and preferences.
            </p>
          </div>

          {/* Sidebar + content layout */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
            <SidebarNavShell>
              <nav aria-label="Account sections" className="flex-1">
                <SidebarNavGroup label="Account" />
                {sectionTabs
                  .filter((tab) => tab.id === "profile" || tab.id === "security")
                  .map((tab) => (
                    <SidebarNavItem
                      key={tab.id}
                      icon={tab.icon}
                      label={tab.label}
                      active={activeSection === tab.id}
                      onClick={() => setActiveSection(tab.id)}
                    />
                  ))}

                <SidebarNavGroup label="App" />
                {sectionTabs
                  .filter(
                    (tab) => tab.id === "content" || tab.id === "integrations",
                  )
                  .map((tab) => (
                    <SidebarNavItem
                      key={tab.id}
                      icon={tab.icon}
                      label={tab.label}
                      active={activeSection === tab.id}
                      onClick={() => setActiveSection(tab.id)}
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

          {/* Section Content */}
          <AnimatePresence mode="wait">
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
                    title="Profile picture"
                    description="Upload an image to show across the app. JPG, PNG, GIF, or WEBP up to 5 MB."
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
                            ? "Uploading…"
                            : user?.avatar_url
                              ? "Change picture"
                              : "Upload picture"}
                        </button>
                        {user?.avatar_url && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            disabled={avatarUploading}
                            className="h-10 rounded-full px-4 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60 dark:text-rose-400 dark:hover:bg-rose-500/10"
                          >
                            Remove
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
                    title="Profile Details"
                    description="Update your public account details."
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SettingsInput
                      label="Current Username"
                      defaultValue={user?.name || ""}
                      readOnly
                      disabled
                      icon={<CircleOff size={14} />}
                    />
                    <SettingsInput
                      label="New Username"
                      placeholder="Enter new username"
                      error={profileForm.formState.errors.newName?.message}
                      {...profileForm.register("newName")}
                    />
                    <SettingsInput
                      label="Age"
                      type="number"
                      placeholder="25"
                      min={13}
                      max={120}
                      error={profileForm.formState.errors.age?.message}
                      {...profileForm.register("age")}
                    />
                  </div>
                  <div className="mt-5 flex justify-end">
                    <StatefulButton
                      onClick={handleSaveProfile}
                      state={profileForm.formState.isSubmitting ? "loading" : "idle"}
                      className="h-10 w-auto rounded-full px-6 text-sm font-semibold"
                    >
                      Save Profile
                    </StatefulButton>
                  </div>
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
                    title="Email"
                    description="The address you use to sign in."
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
                      Current
                    </span>
                  </div>

                  <SettingsInput
                    label="New email"
                    placeholder="new@example.com"
                    error={emailForm.formState.errors.newEmail?.message}
                    {...emailForm.register("newEmail")}
                  />

                  <div className="mt-5 flex justify-end">
                    <StatefulButton
                      onClick={handleSaveEmail}
                      state={emailForm.formState.isSubmitting ? "loading" : "idle"}
                      className="h-10 w-auto rounded-full px-6 text-sm font-semibold"
                    >
                      Update Email
                    </StatefulButton>
                  </div>
                </SectionCard>

                {/* Password */}
                <SectionCard>
                  <SectionHeader
                    title="Password"
                    description="Pick a new password — at least 8 characters."
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SettingsInput
                      label="New Password"
                      type="password"
                      placeholder="••••••••"
                      icon={<Lock size={14} />}
                      error={passwordForm.formState.errors.newPassword?.message}
                      {...passwordForm.register("newPassword")}
                    />
                    <SettingsInput
                      label="Confirm Password"
                      type="password"
                      placeholder="••••••••"
                      icon={<Lock size={14} />}
                      error={passwordForm.formState.errors.confirmPassword?.message}
                      {...passwordForm.register("confirmPassword")}
                    />
                  </div>
                  <div className="mt-5 flex justify-end">
                    <StatefulButton
                      onClick={handleSavePassword}
                      state={passwordForm.formState.isSubmitting ? "loading" : "idle"}
                      className="h-10 w-auto rounded-full px-6 text-sm font-semibold"
                    >
                      Update Password
                    </StatefulButton>
                  </div>
                </SectionCard>

                {/* MFA — same SectionHeader pattern as the others */}
                <SectionCard>
                  {!showMfaPanel ? (
                    <>
                      <SectionHeader
                        title="Two-Factor Authentication"
                        description="An extra step at sign-in to keep your account secure."
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
                                ? "Two-factor is on"
                                : "Two-factor is off"
                              : "Checking…"}
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
                            {mfaEnabled ? "Enabled" : "Disabled"}
                          </span>
                        )}
                      </div>

                      <div className="mt-5 flex justify-end">
                        <StatefulButton
                          onClick={() => setShowMfaPanel(true)}
                          className="h-10 w-auto rounded-full px-6 text-sm font-semibold"
                        >
                          {mfaEnabled ? "Manage two-factor" : "Enable two-factor"}
                        </StatefulButton>
                      </div>
                    </>
                  ) : (
                    <div>
                      <button
                        onClick={() => setShowMfaPanel(false)}
                        className="mb-4 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        &larr; Back to Security
                      </button>
                      {mfaEnabled ? (
                        <MfaManagement
                          mfaEnabled={mfaEnabled}
                          onMfaStatusChange={() => setShowMfaPanel(false)}
                        />
                      ) : (
                        <MfaSetup
                          onComplete={() => setShowMfaPanel(false)}
                          onSkip={() => setShowMfaPanel(false)}
                        />
                      )}
                    </div>
                  )}
                </SectionCard>

                {/* Backup Email */}
                <SectionCard>
                  <SectionHeader
                    title="Backup Email"
                    description="A recovery address used when your authenticator is unavailable."
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
                        Remove
                      </button>
                    </div>
                  )}

                  <SettingsInput
                    label={currentBackupEmail ? "Change to" : "Backup email"}
                    placeholder={
                      currentBackupEmail
                        ? "new-backup@example.com"
                        : "backup@example.com"
                    }
                    error={backupEmailForm.formState.errors.backupEmail?.message}
                    {...backupEmailForm.register("backupEmail")}
                  />

                  <div className="mt-5 flex justify-end">
                    <StatefulButton
                      onClick={handleSaveBackupEmail}
                      state={backupEmailForm.formState.isSubmitting ? "loading" : "idle"}
                      className="h-10 w-auto rounded-full px-6 text-sm font-semibold"
                    >
                      {currentBackupEmail ? "Update Backup" : "Save Backup"}
                    </StatefulButton>
                  </div>
                </SectionCard>

                {/* Sessions */}
                {user?.id && <SessionsManagement userId={user.id} />}
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
                    title="Content Preferences"
                    description="Set your default recommendation behavior."
                  />

                  <div className="space-y-5">
                    <div>
                      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Recommendation Type
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "movie", label: "Movies" },
                          { id: "book", label: "Books" },
                          { id: "both", label: "Both" },
                        ].map((opt) => (
                          <PillButton
                            key={opt.id}
                            onClick={() => setContentFocus(opt.id)}
                            active={contentFocus === opt.id}
                            className="px-4 py-2 text-sm font-semibold"
                          >
                            {opt.label}
                          </PillButton>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Content tone
                      </p>
                      {(user?.age ?? 0) < 18 ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                          Recommendations are kept age-appropriate based on
                          your age ({user?.age ?? "—"}). Adults can choose
                          between standard and family-friendly tones.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {(
                            [
                              { id: "standard", label: "Standard" },
                              { id: "family", label: "Family-friendly" },
                            ] as const
                          ).map((opt) => (
                            <PillButton
                              key={opt.id}
                              onClick={() => setContentTone(opt.id)}
                              active={contentTone === opt.id}
                              className="px-4 py-2 text-sm font-semibold"
                            >
                              {opt.label}
                            </PillButton>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {(user?.age ?? 0) < 18
                          ? "Locked: under-18 accounts always get age-appropriate picks."
                          : contentTone === "family"
                            ? "Picks stay light. No mature themes, dark content, or sexual content."
                            : "Full personality. The AI may suggest dark, complex, or mature picks when they fit you."}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Questions per quiz
                      </p>
                      <div className="max-w-sm rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            Count
                          </span>
                          <span className="inline-flex min-w-[60px] items-center justify-center rounded-full bg-indigo-600 px-2.5 py-0.5 text-sm font-bold text-white">
                            {preferredQuestionCount}
                          </span>
                        </div>
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
                        <div className="mt-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          <span>3</span>
                          <span>15</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Applies on next quiz
                    </span>
                    <StatefulButton
                      onClick={handleSaveContentPreferences}
                      className="h-10 w-auto rounded-full px-6 text-sm font-semibold"
                    >
                      Save Preferences
                    </StatefulButton>
                  </div>
                </SectionCard>
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
                    title="Integrations"
                    description="Connected providers and services."
                  />
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center dark:border-slate-700/70 dark:bg-slate-800/40">
                    <p className="text-xl font-bold tracking-tight text-slate-700 dark:text-slate-200">
                      No integrations available yet
                    </p>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                      Third-party connections will show up here once they go live.
                    </p>
                  </div>
                </SectionCard>

                {/* Danger Zone */}
                <SectionCard className="!border-red-200/70 dark:!border-red-900/40">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-red-700 dark:text-red-400">
                      Danger Zone
                    </h2>
                    <p className="mt-0.5 text-xs text-red-600/80 dark:text-red-300/70">
                      These actions are irreversible. Proceed carefully.
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
                      {accountActionLoading ? "Processing…" : "Disable Account"}
                    </PillButton>
                    <PillButton
                      onClick={handleDeleteAccount}
                      disabled={accountActionLoading}
                      variant="destructive"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      {accountActionLoading ? "Processing…" : "Delete Account"}
                    </PillButton>
                  </div>
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>
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
                aria-label="Close verification dialog"
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
                      <h3 className="text-lg font-bold">Verify Identity</h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Enter your 6-digit authenticator code to{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {verifyModal.actionLabel}
                      </span>
                      .
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
                    placeholder="000000"
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
                      Cancel
                    </button>
                    <StatefulButton
                      onClick={handleVerifySubmit}
                      state={verifyLoading ? "loading" : "idle"}
                      disabled={verifyCode.length !== 6}
                      className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold"
                    >
                      Verify
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
                      <h3 className="text-lg font-bold">Set Up 2FA First</h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Two-factor authentication is required to{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {verifyModal.actionLabel}
                      </span>
                      . Set it up now to continue.
                    </p>
                  </div>

                  <MfaSetup
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
    </div>
  );
};

export default SettingsPage;
