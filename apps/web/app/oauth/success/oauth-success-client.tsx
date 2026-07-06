"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { setAccessToken } from "@/lib/auth-storage";

interface OAuthSuccessClientProps {
  token: string | null;
}

export function OAuthSuccessClient({ token }: OAuthSuccessClientProps) {
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.replace("/login?error=oauth_missing_token");
      return;
    }
    setAccessToken(token);
    router.replace("/dashboard");
  }, [token, router]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-4 text-fg-muted">
      <Spinner size="lg" />
      <p className="text-sm font-medium">
        {token ? "Signing you in…" : "Redirecting…"}
      </p>
    </main>
  );
}
