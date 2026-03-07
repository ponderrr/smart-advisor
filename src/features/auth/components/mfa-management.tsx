"use client";

import React, { useState, useEffect } from "react";
import { authService } from "../services/auth-service";
import { ShieldOff, ShieldCheck, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface MfaManagementProps {
  mfaEnabled: boolean;
  onMfaStatusChange?: () => void;
}

export const MfaManagement = ({
  mfaEnabled,
  onMfaStatusChange,
}: MfaManagementProps) => {
  const [factors, setFactors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unenrollingId, setUnenrollingId] = useState<string | null>(null);

  useEffect(() => {
    loadFactors();
  }, []);

  const loadFactors = async () => {
    setLoading(true);
    const { data, error } = await authService.listMFAFactors();
    setLoading(false);

    if (error) {
      toast.error("Failed to load MFA factors");
      return;
    }

    if (data?.totp) {
      setFactors(data.totp);
    }
  };

  const handleUnenroll = async (factorId: string) => {
    setUnenrollingId(factorId);
    const { error } = await authService.unenrollMFA(factorId);
    setUnenrollingId(null);

    if (error) {
      toast.error(error);
    } else {
      toast.success("MFA disabled successfully");
      await loadFactors();
      onMfaStatusChange?.();
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Two-Factor Authentication
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {mfaEnabled
              ? "Your account is protected with 2FA enabled"
              : "Protect your account with two-factor authentication"}
          </p>
        </div>
        {mfaEnabled && (
          <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 dark:bg-green-900/30">
            <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
              Enabled
            </span>
          </div>
        )}
      </div>

      {mfaEnabled && factors.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Active authenticators:
          </div>
          {factors.map((factor) => (
            <div
              key={factor.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {factor.friendly_name || "Authenticator App"}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Added {new Date(factor.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnenroll(factor.id)}
                disabled={unenrollingId === factor.id}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
              >
                {unenrollingId === factor.id ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {!mfaEnabled && (
        <div className="mt-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Enable 2FA to add an extra layer of security to your account. You'll
            need to verify with your authenticator app.
          </p>
          <Button disabled>{loading ? "Loading..." : "Enable 2FA"}</Button>
        </div>
      )}
    </Card>
  );
};
