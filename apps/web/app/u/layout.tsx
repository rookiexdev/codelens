"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { FullPageSpinnerSkeleton } from "@/components/ui/skeleton";
import { useAccessToken } from "@/lib/use-access-token";

export default function ProtectedUserLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const token = useAccessToken();
  const hasToken = token !== null;

  useEffect(() => {
    if (!hasToken) router.replace("/login");
  }, [hasToken, router]);

  if (!hasToken) return <FullPageSpinnerSkeleton label="Loading…" />;
  return <>{children}</>;
}
