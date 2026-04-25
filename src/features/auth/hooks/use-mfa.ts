import { useState, useCallback } from "react";
import { authService } from "@/features/auth/services/auth-service";
import { toast } from "sonner";

/**
 * Hook for handling MFA verification flow
 */
export function useMfaVerification() {
  const [isMfaRequired, setIsMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);

  const verifyMfa = useCallback(async (factorId: string, code: string) => {
    setMfaLoading(true);
    setMfaError(null);

    const { error } = await authService.verifyMFA(factorId, code);
    setMfaLoading(false);

    if (error) {
      setMfaError(error);
      toast.error(error);
      return false;
    }

    setIsMfaRequired(false);
    setMfaCode("");
    return true;
  }, []);

  return {
    isMfaRequired,
    setIsMfaRequired,
    mfaCode,
    setMfaCode,
    mfaError,
    setMfaError,
    mfaLoading,
    verifyMfa,
  };
}

/**
 * Hook for enrolling MFA
 */
export function useMfaEnrollment() {
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);

  const enrollMfa = useCallback(async () => {
    setEnrolling(true);
    setEnrollmentError(null);

    const { data, error } = await authService.enrollMFA();
    setEnrolling(false);

    if (error) {
      setEnrollmentError(error);
      return null;
    }

    return data;
  }, []);

  return {
    enrolling,
    enrollmentError,
    enrollMfa,
  };
}
