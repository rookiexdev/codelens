"use client";

import { Award } from "lucide-react";
import dynamic from "next/dynamic";
import { memo } from "react";
import { ContributionTotals } from "@/components/profile/contribution-totals";
import {
  ActivityFeedPlaceholder,
  ContributionGraphPlaceholder,
} from "@/components/profile/profile-section-placeholders";
import { LazyOnView } from "@/components/ui/lazy-on-view";
import type {
  ContributionDay,
  ContributionTotals as Totals,
} from "@/lib/users-api";

// Code-split the heavier modules so they don't ship with the initial bundle.
// `ssr: false` is fine here — this is a client-only authenticated page and
// the chunks are only needed once the user scrolls near them.
const ContributionGraph = dynamic(
  () =>
    import("@/components/profile/contribution-graph").then(
      (m) => m.ContributionGraph,
    ),
  { ssr: false, loading: () => <ContributionGraphPlaceholder /> },
);

const ActivityFeed = dynamic(
  () =>
    import("@/components/profile/activity-feed").then((m) => m.ActivityFeed),
  { ssr: false, loading: () => <ActivityFeedPlaceholder /> },
);

interface ProfileMainProps {
  username: string;
  totals: Totals;
  contributions: ContributionDay[];
}

function ProfileMainImpl({
  username,
  totals,
  contributions,
}: ProfileMainProps) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <ContributionTotals totals={totals} />

      <LazyOnView placeholder={<ContributionGraphPlaceholder />}>
        <ContributionGraph contributions={contributions} />
      </LazyOnView>

      <BadgesPlaceholderSection />

      <LazyOnView placeholder={<ActivityFeedPlaceholder />}>
        <ActivityFeed key={username} username={username} />
      </LazyOnView>
    </div>
  );
}

export const ProfileMain = memo(ProfileMainImpl);

function BadgesPlaceholderSection() {
  return (
    <section className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
      <header className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-base font-bold tracking-tight sm:text-lg">
          <Award
            aria-hidden
            className="h-4 w-4 text-accent"
            strokeWidth={2.25}
          />
          Badges
        </h2>
        <span className="rounded-full border border-border bg-surface-2/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-fg-subtle">
          Coming soon
        </span>
      </header>
      <p className="mt-3 rounded-xl border border-dashed border-border bg-surface-2/30 p-6 text-center text-sm font-medium text-fg-muted">
        Earn badges by reviewing code, sharing reads, and showing up. The system
        is on its way.
      </p>
    </section>
  );
}
