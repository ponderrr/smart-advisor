import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./use-auth";

/**
 * Redirects to /auth if the user is not authenticated or has pending MFA.
 * Returns { ready: true } once auth state is resolved and user is fully authenticated.
 */
export const useRequireAuth = () => {
  const router = useRouter();
  const { user, session, loading, mfaPending, sessionExpired } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!session && !user) {
      // Append session_expired param so auth page can show a message
      const target = sessionExpired ? "/auth?session_expired=true" : "/auth";
      router.replace(target);
    } else if (mfaPending) {
      router.replace("/auth");
    }
  }, [loading, session, user, mfaPending, sessionExpired, router]);

  return { ready: !loading && !mfaPending && !!(session || user) };
};
