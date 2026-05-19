"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /wrapped/month — convenience entry for the monthly Wrapped recap.
 * Redirects to /wrapped?y=YYYY&m=MM for the current month, mirroring
 * the mobile /wrapped/month route (a3ead6a). Server-side redirect
 * isn't viable here because the target depends on the user's "today".
 */
export default function MonthlyWrappedRedirect() {
  const router = useRouter();
  useEffect(() => {
    const now = new Date();
    router.replace(`/wrapped?y=${now.getFullYear()}&m=${now.getMonth()}`);
  }, [router]);
  return null;
}
