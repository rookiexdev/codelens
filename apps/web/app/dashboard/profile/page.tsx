"use client";

import { ArrowLeft, LogOut, Palette, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  getUserDisplayName,
  getUserInitials,
  useUser,
} from "@/components/profile/user-context";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { clearAccessToken } from "@/lib/auth-storage";

const DUMMY_PROFILE = {
  fullName: "Jane Developer",
  role: "Software Engineer",
  bio: "Reads code on calm Sundays. Reviews PRs on noisy Mondays.",
  location: "Bengaluru, IN",
  timezone: "Asia/Kolkata",
};

export default function ProfilePage() {
  const router = useRouter();
  const user = useUser();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user);

  const handleSignOut = (): void => {
    setSigningOut(true);
    clearAccessToken();
    toast({
      variant: "success",
      title: "Signed out",
      description: "You've been logged out of your workspace.",
    });
    router.replace("/login");
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <nav className="mb-4 text-xs sm:mb-6 sm:text-sm">
        <Link
          href="/dashboard"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded font-medium text-fg-muted underline-offset-4 transition hover:text-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <ArrowLeft aria-hidden className="h-3.5 w-3.5" strokeWidth={2.25} />
          Back to dashboard
        </Link>
      </nav>

      <header className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <span
            aria-hidden
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent text-lg font-bold uppercase tracking-wide text-accent-fg sm:h-20 sm:w-20 sm:text-xl"
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              <Sparkles aria-hidden className="h-3.5 w-3.5" strokeWidth={2.25} />
              Profile
            </p>
            <h1 className="mt-1 truncate text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
              {DUMMY_PROFILE.fullName}
            </h1>
            <p className="mt-1 truncate text-sm font-medium text-fg-muted sm:text-base">
              {displayName} · {user.email}
            </p>
          </div>
        </div>

        <p className="mt-5 max-w-prose text-sm font-medium leading-relaxed text-fg-muted sm:mt-6 sm:text-base">
          {DUMMY_PROFILE.bio}
        </p>

        <dl className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:gap-4">
          <Field label="Role" value={DUMMY_PROFILE.role} />
          <Field label="Location" value={DUMMY_PROFILE.location} />
          <Field label="Timezone" value={DUMMY_PROFILE.timezone} />
          <Field
            label="Member since"
            value={new Date(user.createdAt).toLocaleDateString()}
          />
          <Field label="User ID" value={user.id} mono />
        </dl>
      </header>

      <section className="mt-5 rounded-2xl border border-border bg-surface/40 p-5 sm:mt-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h2 className="inline-flex items-center gap-2 text-base font-bold tracking-tight sm:text-lg">
              <Palette aria-hidden className="h-4 w-4 text-accent" strokeWidth={2.25} />
              Appearance
            </h2>
            <p className="mt-1 text-sm font-medium text-fg-muted">
              Pick a color theme for your workspace.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-danger/30 bg-danger/5 p-5 sm:mt-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h2 className="inline-flex items-center gap-2 text-base font-bold tracking-tight sm:text-lg">
              <LogOut aria-hidden className="h-4 w-4 text-danger" strokeWidth={2.25} />
              Sign out
            </h2>
            <p className="mt-1 text-sm font-medium text-fg-muted">
              You&apos;ll need to sign back in to access your workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger sm:text-[0.95rem]"
          >
            <LogOut aria-hidden className="h-4 w-4" strokeWidth={2.25} />
            Sign out
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Sign out of CodeLens?"
        description="You'll need to sign back in to access your workspace. Any unsaved drafts will stay where they are."
        confirmLabel="Yes, sign out"
        cancelLabel="Stay signed in"
        tone="danger"
        busy={signingOut}
        onConfirm={handleSignOut}
        onCancel={() => setConfirmOpen(false)}
      />
    </main>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/60 p-3 sm:p-4">
      <dt className="text-xs uppercase tracking-wider text-fg-subtle">
        {label}
      </dt>
      <dd
        className={`mt-1 break-all text-fg ${mono ? "font-mono text-xs sm:text-sm" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
