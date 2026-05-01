"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FullPageSpinnerSkeleton } from "@/components/ui/skeleton";
import { getAccessToken } from "@/lib/auth-storage";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    router.replace(token ? "/dashboard" : "/login");
  }, [router]);

  return <FullPageSpinnerSkeleton label="Redirecting…" />;
}
