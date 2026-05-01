"use client";

import { useUser } from "@/components/profile/user-context";

export default function DashboardPage() {
  const user = useUser();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <div className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-8 lg:p-10">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          Signed in
        </p>
        <h1 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Welcome, {user.email}
        </h1>
        <p className="mt-2 max-w-prose text-sm text-fg-muted sm:text-base">
          You&apos;re authenticated. This is a placeholder dashboard — your
          real workspace will live here.
        </p>

        <dl className="mt-6 grid grid-cols-1 gap-3 text-sm sm:mt-8 sm:grid-cols-2 sm:gap-4">
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
  );
}
