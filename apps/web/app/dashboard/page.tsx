"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-900/80 bg-zinc-950/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/20 ring-1 ring-emerald-300/40">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-300" />
            </span>
            <span className="text-base font-semibold tracking-tight">
              CodeLens
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8 lg:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">
            Signed in
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome, {user.email}
          </h1>
          <p className="mt-2 max-w-prose text-sm text-zinc-400 sm:text-base">
            You&apos;re authenticated. This is a placeholder dashboard — your
            real workspace will live here.
          </p>

          <dl className="mt-8 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4">
              <dt className="text-xs uppercase tracking-wider text-zinc-500">
                User ID
              </dt>
              <dd className="mt-1 break-all font-mono text-zinc-200">
                {user.id}
              </dd>
            </div>
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4">
              <dt className="text-xs uppercase tracking-wider text-zinc-500">
                Member since
              </dt>
              <dd className="mt-1 text-zinc-200">
                {new Date(user.createdAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
