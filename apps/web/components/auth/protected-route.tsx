"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { FullPageSpinnerSkeleton } from "@/components/ui/skeleton";
import { getAccessToken } from "@/lib/auth-storage";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "authed">("checking");

  useEffect(() => {
    // Read localStorage inside the effect so SSR/hydration doesn't briefly
    // see null and bounce to /login. Deferring the state transition to a
    // microtask keeps it out of the synchronous effect body (which the
    // react-hooks/set-state-in-effect rule rejects).
    void Promise.resolve().then(() => {
      if (getAccessToken() === null) {
        router.replace("/login");
        return;
      }
      setStatus("authed");
    });
  }, [router]);

  if (status !== "authed") {
    return <>{fallback ?? <FullPageSpinnerSkeleton label="Loading…" />}</>;
  }

  return <>{children}</>;
}
