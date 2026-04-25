"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sessionManagementService } from "../services/session-management";
import { authService } from "../services/auth-service";
import { Loader, LogOut, Smartphone, Globe, LogOutIcon } from "lucide-react";
import {
  IconBrandChrome,
  IconBrandFirefox,
  IconBrandSafari,
  IconBrandEdge,
  IconBrandOpera,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatLastActivity } from "../utils/device";

/**
 * Maps a session's browser_name to a brand-specific icon component.
 * Falls back to Globe for unknown browsers.
 */
const getBrowserIcon = (browserName?: string) => {
  const name = (browserName ?? "").toLowerCase();
  if (name.includes("chrome") && !name.includes("chromium")) return IconBrandChrome;
  if (name.includes("firefox")) return IconBrandFirefox;
  if (name.includes("safari") && !name.includes("chrome")) return IconBrandSafari;
  if (name.includes("edge") || name.includes("edg")) return IconBrandEdge;
  if (name.includes("opera") || name.includes("opr")) return IconBrandOpera;
  return Globe;
};

interface Session {
  id: string;
  device_name: string;
  device_type: string;
  browser_name: string;
  browser_version: string;
  os_name: string;
  os_version: string;
  ip_address: string | null;
  last_activity: string;
  created_at: string;
  is_current_device: boolean;
}

interface SessionsManagementProps {
  userId: string;
}

export const SessionsManagement = ({ userId }: SessionsManagementProps) => {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [signingOutAll, setSigningOutAll] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [userId]);

  const loadSessions = async () => {
    setLoading(true);
    const { sessions, error } =
      await sessionManagementService.getActiveSessions(userId);
    setLoading(false);

    if (error) {
      toast.error(error);
      return;
    }

    setSessions(sessions as Session[]);
  };

  const handleRevokeSession = async (session: Session) => {
    const promptMessage = session.is_current_device
      ? "Sign out of this device? You'll be returned to the home page."
      : `Sign out of ${session.device_name}? That session will lose access immediately.`;
    if (!window.confirm(promptMessage)) {
      return;
    }

    setRevoking(session.id);
    const { error } = await sessionManagementService.revokeSession(session.id);
    setRevoking(null);

    if (error) {
      toast.error(error);
    } else {
      toast.success("You've been signed out of that device");
      setSessions((prev) => prev.filter((s) => s.id !== session.id));

      // If revoking current device, sign out and redirect
      if (session.is_current_device) {
        await authService.signOut();
        router.push("/");
      }
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm("Are you sure? You'll be signed out on all devices.")) {
      return;
    }

    setSigningOutAll(true);

    // signOutAllDevices: revokes DB sessions, then signs out globally from Supabase
    const { error } = await authService.signOutAllDevices();
    setSigningOutAll(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("You've been signed out of all devices");
      router.push("/");
    }
  };

  if (loading) {
    return (
      <>
        <div className="mb-5">
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">Active sessions</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage devices currently signed in to your account.
          </p>
        </div>
        <div className="flex items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50 py-8 dark:border-slate-700/60 dark:bg-slate-800/40">
          <Smartphone className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      </>
    );
  }

  const hasSessions = sessions.length > 0;

  return (
    <>
      <div className="mb-5">
        <h2 className="text-xl font-black tracking-tight sm:text-2xl">
          Active sessions
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage devices currently signed in to your account. Sign out to
          revoke access.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-800/40">
        <div className="flex items-center gap-2.5">
          <Globe
            size={16}
            className={
              hasSessions
                ? "shrink-0 text-emerald-500 dark:text-emerald-400"
                : "shrink-0 text-slate-400 dark:text-slate-500"
            }
          />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {hasSessions
              ? `${sessions.length} device${sessions.length === 1 ? "" : "s"} signed in`
              : "No active sessions"}
          </span>
        </div>
        {sessions.length > 1 && (
          <button
            type="button"
            onClick={handleRevokeAll}
            disabled={signingOutAll}
            className="group inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-bold tracking-tight text-red-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:border-red-500/30 dark:bg-slate-900/60 dark:text-red-400 dark:hover:border-red-500/60 dark:hover:bg-red-500/10"
          >
            <LogOutIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            {signingOutAll ? "Signing out…" : "Sign out all"}
          </button>
        )}
      </div>

      {!hasSessions ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white/60 px-6 py-8 text-center dark:border-slate-700/60 dark:bg-slate-900/40">
          <Smartphone
            className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600"
            aria-hidden="true"
          />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No active sessions found
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {sessions.map((session) => {
            const BrowserIcon = getBrowserIcon(session.browser_name);
            return (
              <div
                key={session.id}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-xl border px-4 py-3 transition-colors",
                  session.is_current_device
                    ? "border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                    : "border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-900/40",
                )}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {session.device_type === "mobile" ? (
                    <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-slate-600 dark:text-slate-400" />
                  ) : (
                    <BrowserIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-600 dark:text-slate-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {session.device_name}
                      </p>
                      {session.is_current_device && (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {session.os_name} · {session.browser_name}{" "}
                      {session.browser_version}
                    </p>
                    {session.ip_address && (
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        IP {session.ip_address}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      Last active {formatLastActivity(session.last_activity)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevokeSession(session)}
                  disabled={revoking === session.id || signingOutAll}
                  aria-label={`Sign out of ${session.device_name}`}
                  title={`Sign out of ${session.device_name}`}
                  className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white text-red-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-red-400 dark:hover:border-red-500/60 dark:hover:bg-red-500/10"
                >
                  {revoking === session.id ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
