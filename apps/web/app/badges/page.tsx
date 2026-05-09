"use client";

import { Award, ArrowRight, KeyRound, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { BadgeIcon } from "@/components/profile/badge-icon";
import { ThemeDropdown } from "@/components/theme/theme-dropdown";
import { extractApiError } from "@/lib/api";
import { badgesApi, type BadgeCatalogEntry } from "@/lib/badges-api";
import type { BadgeCategory, BadgeRarity, BadgeTier } from "@/lib/users-api";
import { useAccessToken } from "@/lib/use-access-token";

const TIER_ORDER: BadgeTier[] = [
  "contributor",
  "quality",
  "specialist",
  "elite",
];

const TIER_LABEL: Record<BadgeTier, string> = {
  contributor: "Contributor",
  quality: "Quality",
  specialist: "Specialist",
  elite: "Elite",
};

const TIER_BLURB: Record<BadgeTier, string> = {
  contributor: "Showing up, again and again.",
  quality: "Code that holds up under scrutiny.",
  specialist: "Mastery of one craft, lived in.",
  elite: "The rare air. Few entries, fewer keys.",
};

const TIER_RING: Record<BadgeTier, string> = {
  contributor: "ring-[#3679DD]/55",
  quality: "ring-[#1FA363]/55",
  specialist: "ring-[#E0A21C]/55",
  elite: "ring-[#E04E9A]/55",
};

const TIER_ACCENT: Record<BadgeTier, string> = {
  contributor: "text-[#5A9BFF]",
  quality: "text-[#76E0A4]",
  specialist: "text-[#FFCB6F]",
  elite: "text-[#FF8AB8]",
};

const RARITY_LABEL: Record<BadgeRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary",
};

const RARITY_BADGE_CLASS: Record<BadgeRarity, string> = {
  common: "bg-surface-2/60 text-fg-muted",
  uncommon: "bg-[#1FA363]/15 text-[#76E0A4]",
  rare: "bg-[#7757E0]/15 text-[#B49DFF]",
  legendary: "bg-[#E0A21C]/15 text-[#FFCB6F]",
};

const CATEGORY_LABEL: Record<BadgeCategory, string> = {
  activity: "Activity",
  code_quality: "Code Quality",
  security: "Security",
  testing: "Testing",
  documentation: "Documentation",
  performance: "Performance",
  streak: "Streak",
  platform: "Platform",
};

type AuthState = "guest" | "member";

export default function BadgesCatalogPage(): React.JSX.Element {
  const token = useAccessToken();
  const auth: AuthState = token !== null ? "member" : "guest";
  const [catalog, setCatalog] = useState<BadgeCatalogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    badgesApi
      .getCatalog(ctrl.signal)
      .then(setCatalog)
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(extractApiError(err, "Couldn't load the badge catalog."));
      });
    return () => ctrl.abort();
  }, []);

  const grouped = useMemo(() => {
    const buckets: Record<BadgeTier, BadgeCatalogEntry[]> = {
      contributor: [],
      quality: [],
      specialist: [],
      elite: [],
    };
    if (!catalog) return buckets;
    for (const entry of catalog) {
      if (!entry.isActive) continue;
      buckets[entry.tier].push(entry);
    }
    for (const tier of TIER_ORDER) {
      buckets[tier].sort((a, b) => a.slug.localeCompare(b.slug));
    }
    return buckets;
  }, [catalog]);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <PublicHeader auth={auth} />

      <main className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <header className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-accent shadow-inner backdrop-blur">
            <Sparkles className="h-3 w-3" aria-hidden />
            Badge catalog
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Earn the keys to <span className="text-accent">CodeLens.</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-fg-muted sm:text-base">
            Every badge marks a real habit, not a vanity metric. Browse the
            full catalog below — what each one means, the tier it belongs
            to, and what you have to do to earn it.
          </p>
        </header>

        {error ? (
          <p className="mt-8 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}

        {catalog === null && error === null ? (
          <CatalogSkeleton />
        ) : (
          <div className="mt-10 space-y-12 sm:mt-12 sm:space-y-16">
            {TIER_ORDER.map((tier) => {
              const entries = grouped[tier];
              if (entries.length === 0) return null;
              return (
                <section key={tier} aria-labelledby={`tier-${tier}`}>
                  <header className="flex flex-col gap-1 border-b border-border/60 pb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                    <div>
                      <h2
                        id={`tier-${tier}`}
                        className={`text-xl font-bold tracking-tight sm:text-2xl ${TIER_ACCENT[tier]}`}
                      >
                        {TIER_LABEL[tier]} tier
                      </h2>
                      <p className="mt-1 text-sm text-fg-muted">
                        {TIER_BLURB[tier]}
                      </p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                      {entries.length} badge{entries.length === 1 ? "" : "s"}
                    </span>
                  </header>

                  <ul
                    role="list"
                    className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
                  >
                    {entries.map((entry) => (
                      <li key={entry.slug}>
                        <CatalogCard entry={entry} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}

        <FooterCta auth={auth} />
      </main>

      <SiteFooter />
    </div>
  );
}

function CatalogCard({
  entry,
}: {
  entry: BadgeCatalogEntry;
}): React.JSX.Element {
  return (
    <article className="group h-full rounded-2xl border border-border bg-surface/40 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface/70 hover:shadow-lg hover:shadow-accent/5 sm:p-5">
      <div className="flex items-start gap-4">
        <div
          className={`inline-flex h-14 w-14 flex-none items-center justify-center rounded-2xl ring-2 sm:h-16 sm:w-16 ${TIER_RING[entry.tier]}`}
        >
          <BadgeIcon
            slug={entry.iconKey}
            className="h-12 w-12 sm:h-14 sm:w-14"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold tracking-tight sm:text-lg">
            {entry.name}
          </h3>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
            {entry.role}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${RARITY_BADGE_CLASS[entry.rarity]}`}
            >
              {RARITY_LABEL[entry.rarity]}
            </span>
            <span className="rounded-full border border-border bg-surface-2/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fg-muted">
              {CATEGORY_LABEL[entry.category]}
            </span>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
              {entry.xpReward} XP
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-fg-muted">
        {entry.description}
      </p>

      <div className="mt-4 rounded-xl border border-dashed border-border bg-surface-2/30 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">
          How to earn
        </p>
        <p className="mt-1 text-xs font-medium text-fg-muted">
          {howToEarn(entry)}
        </p>
      </div>
    </article>
  );
}

/**
 * Plain-language hint for the catalog card. The API doesn't expose the
 * raw `criteria` payload (intentional — it's a strict union owned by the
 * service), so we reuse `progressLabel` when it's a literal sentence and
 * fall back to a generic prompt for trackable badges that template
 * placeholders into the label (e.g. `{{current}} / 7 day streak`).
 */
function howToEarn(entry: BadgeCatalogEntry): string {
  const label = entry.progressLabel?.trim();
  if (!label) {
    return "Awarded automatically when CodeLens detects the moment.";
  }
  if (label.includes("{{")) {
    // Trackable progress copy is for the *user's* progress UI, not a
    // generic explanation. Keep the description as the explainer and
    // surface the raw target in plain prose.
    return `Tracks toward: ${label
      .replace(/\{\{current\}\}/g, "0")
      .replace(/\{\{[^}]+\}\}/g, "—")}`;
  }
  return label;
}

function CatalogSkeleton(): React.JSX.Element {
  return (
    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-2xl border border-border bg-surface/30"
        />
      ))}
    </div>
  );
}

function PublicHeader({ auth }: { auth: AuthState }): React.JSX.Element {
  return (
    <header className="border-b border-border/60 bg-bg/40 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <Logo href="/" ariaLabel="CodeLens home" />
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeDropdown align="right" />
          <HeaderCta auth={auth} />
        </div>
      </div>
    </header>
  );
}

function HeaderCta({ auth }: { auth: AuthState }): React.JSX.Element {
  if (auth === "member") {
    return (
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-fg shadow-sm transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-4 sm:text-sm"
      >
        Open dashboard
        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Link
        href="/login"
        className="hidden rounded-lg border border-transparent px-3 py-2 text-xs font-medium text-fg-muted transition hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:inline-flex sm:text-sm"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-fg shadow-sm transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-4 sm:text-sm"
      >
        Get the key
        <KeyRound className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Link>
    </div>
  );
}

function FooterCta({ auth }: { auth: AuthState }): React.JSX.Element {
  if (auth === "member") {
    return (
      <section className="mt-14 rounded-3xl border border-border bg-surface/40 p-6 text-center sm:mt-20 sm:p-10">
        <Award
          aria-hidden
          className="mx-auto h-7 w-7 text-accent"
          strokeWidth={2}
        />
        <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
          See which badges you&apos;ve already earned.
        </h2>
        <p className="mt-2 text-sm text-fg-muted">
          Your earned set lives on your profile.
        </p>
        <Link
          href="/dashboard/profile"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg shadow-sm transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Go to my profile
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-14 rounded-3xl border border-border bg-surface/40 p-6 text-center sm:mt-20 sm:p-10">
      <Award
        aria-hidden
        className="mx-auto h-7 w-7 text-accent"
        strokeWidth={2}
      />
      <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
        Start your collection.
      </h2>
      <p className="mt-2 text-sm text-fg-muted">
        Sign up and your first review starts the journey.
      </p>
      <div className="mt-5 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <Link
          href="/signup"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg shadow-sm transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Create your account
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface/60 px-5 py-2.5 text-sm font-semibold text-fg backdrop-blur transition hover:border-accent/50 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          I&apos;ve been here before
        </Link>
      </div>
    </section>
  );
}

function SiteFooter(): React.JSX.Element {
  return (
    <footer className="border-t border-border/60 bg-bg/40 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-4 py-6 text-xs text-fg-subtle sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} CodeLens. Read · Review · Remember.</p>
        <div className="flex items-center gap-4">
          <Link href="/" className="transition hover:text-fg">
            Home
          </Link>
          <Link href="/login" className="transition hover:text-fg">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
