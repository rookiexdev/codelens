"use client";

import dynamic from "next/dynamic";
import { memo } from "react";
import { ContributionTotals } from "@/components/profile/contribution-totals";
import { ProfileBadges } from "@/components/profile/profile-badges";
import {
  ActivityFeedPlaceholder,
  ContributionGraphPlaceholder,
} from "@/components/profile/profile-section-placeholders";
import { LazyOnView } from "@/components/ui/lazy-on-view";
import type {
  BadgeView,
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
  badges: BadgeView[];
}

function ProfileMainImpl({
  username,
  totals,
  contributions,
  badges,
}: ProfileMainProps) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <ContributionTotals totals={totals} />

      <LazyOnView placeholder={<ContributionGraphPlaceholder />}>
        <ContributionGraph contributions={contributions} />
      </LazyOnView>

      <ProfileBadges earned={badges} />

      <LazyOnView placeholder={<ActivityFeedPlaceholder />}>
        <ActivityFeed key={username} username={username} />
      </LazyOnView>
    </div>
  );
}

export const ProfileMain = memo(ProfileMainImpl);
