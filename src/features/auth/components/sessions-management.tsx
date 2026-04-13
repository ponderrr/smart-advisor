"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sessionManagementService } from "../services/session-management";
import { authService } from "../services/auth-service";
import { LogOut, Smartphone, Globe, LogOutIcon } from "lucide-react";
import {
  IconBrandChrome,
  IconBrandFirefox,
  IconBrandSafari,
  IconBrandEdge,
  IconBrandOpera,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
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
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin">
            <Smartphone className="h-5 w-5 text-slate-400" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Active Sessions
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage your active sessions and devices. Sign out to revoke access.
          </p>
        </div>
        {sessions.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRevokeAll}
            disabled={signingOutAll}
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
          >
            <LogOutIcon className="h-4 w-4 mr-2" />
            {signingOutAll ? "Signing out..." : "Sign Out All"}
          </Button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <Smartphone className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">
            No active sessions found
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const BrowserIcon = getBrowserIcon(session.browser_name);
            return (
            <div
              key={session.id}
              className={`flex items-start justify-between rounded-lg border px-4 py-4 transition-colors ${
                session.is_current_device
                  ? "border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/20"
                  : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50"
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  {session.device_type === "mobile" ? (
                    <Smartphone className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  ) : (
                    <BrowserIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {session.device_name}
                    </p>
                    {session.is_current_device && (
                      <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 rounded-full whitespace-nowrap">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {session.os_name} &bull; {session.browser_name}{" "}
                    {session.browser_version}
                  </p>
                  {session.ip_address && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      IP: {session.ip_address}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                    Last active: {formatLastActivity(session.last_activity)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevokeSession(session)}
                disabled={revoking === session.id || signingOutAll}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 ml-2"
              >
                {revoking === session.id ? (
                  <span className="h-4 w-4 animate-spin">&#8987;</span>
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </Button>
            </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
