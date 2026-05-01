"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { api, type AuthUser } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth-storage";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    api
      .get<AuthUser>("/auth/me")
      .then(({ data }) => {
        if (cancelled) return;
        setUser(data);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        clearAccessToken();
        router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = (): void => {
    clearAccessToken();
    router.replace("/login");
  };

  if (status !== "ready" || !user) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="border-b border-border bg-bg/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Logo />
          <div className="flex items-center gap-3">
            <ThemeToggle size="sm" />
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-border bg-surface/60 px-3 py-1.5 text-sm text-fg transition hover:border-fg-subtle hover:bg-surface"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="rounded-2xl border border-border bg-surface/40 p-6 sm:p-8 lg:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Signed in
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome, {user.email}
          </h1>
          <p className="mt-2 max-w-prose text-sm text-fg-muted sm:text-base">
            You&apos;re authenticated. This is a placeholder dashboard — your
            real workspace will live here.
          </p>

          <dl className="mt-8 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-2/60 p-4">
              <dt className="text-xs uppercase tracking-wider text-fg-subtle">
                User ID
              </dt>
              <dd className="mt-1 break-all font-mono text-fg">{user.id}</dd>
            </div>
            <div className="rounded-xl border border-border bg-surface-2/60 p-4">
              <dt className="text-xs uppercase tracking-wider text-fg-subtle">
                Member since
              </dt>
              <dd className="mt-1 text-fg">
                {new Date(user.createdAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
