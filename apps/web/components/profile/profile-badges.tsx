"use client";

import { Award, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeIcon } from "@/components/profile/badge-icon";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip";
import type {
  BadgeCategory,
  BadgeRarity,
  BadgeTier,
  BadgeView,
} from "@/lib/users-api";

interface ProfileBadgesProps {
  /**
   * Badges the user has earned. Comes from the public profile payload —
   * we don't refetch on the client so this stays in sync with the rest
   * of the profile view.
   */
  earned: BadgeView[];
}

const TIER_ORDER: Record<BadgeTier, number> = {
  contributor: 0,
  quality: 1,
  specialist: 2,
  elite: 3,
};

const RARITY_ORDER: Record<BadgeRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  legendary: 3,
};

const TIER_LABEL: Record<BadgeTier, string> = {
  contributor: "Contributor",
  quality: "Quality",
  specialist: "Specialist",
  elite: "Elite",
};

const RARITY_LABEL: Record<BadgeRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary",
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

const TIER_RING: Record<BadgeTier, string> = {
  contributor: "ring-[#3679DD]/55",
  quality: "ring-[#1FA363]/55",
  specialist: "ring-[#E0A21C]/55",
  elite: "ring-[#E04E9A]/55",
};

const RARITY_BADGE_CLASS: Record<BadgeRarity, string> = {
  common: "bg-surface-2/60 text-fg-muted",
  uncommon: "bg-[#1FA363]/15 text-[#76E0A4]",
  rare: "bg-[#7757E0]/15 text-[#B49DFF]",
  legendary: "bg-[#E0A21C]/15 text-[#FFCB6F]",
};

export function ProfileBadges({
  earned,
}: ProfileBadgesProps): React.JSX.Element {
  const [open, setOpen] = useState<BadgeView | null>(null);

  const sorted = useMemo<BadgeView[]>(() => {
    return [...earned].sort(compareBadges);
  }, [earned]);

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
          <span className="rounded-full border border-border bg-surface-2/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-fg-subtle">
            {sorted.length}
          </span>
        </h2>
        <Link
          href="/badges"
          className="inline-flex items-center gap-1 text-xs font-semibold text-accent transition hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Browse all
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </header>

      {sorted.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-surface-2/30 p-6 text-center text-sm font-medium text-fg-muted">
          No badges earned yet.{" "}
          <Link
            href="/badges"
            className="font-semibold text-accent hover:text-accent-hover"
          >
            See what&apos;s possible →
          </Link>
        </p>
      ) : (
        <ul
          className="mt-4 grid grid-cols-4 gap-3 px-2 sm:grid-cols-6 sm:px-4 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10"
          role="list"
        >
          {sorted.map((b) => (
            <li key={b.slug} className="flex justify-center">
              <BadgeTile badge={b} onOpen={() => setOpen(b)} />
            </li>
          ))}
        </ul>
      )}

      <BadgeDetailModal badge={open} onClose={() => setOpen(null)} />
    </section>
  );
}

interface BadgeTileProps {
  badge: BadgeView;
  onOpen: () => void;
}

function BadgeTile({ badge, onOpen }: BadgeTileProps): React.JSX.Element {
  return (
    <Tooltip content={badge.name} side="top">
      <button
        type="button"
        onClick={onOpen}
        aria-label={badge.name}
        className={`group relative inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl ring-2 transition hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:h-16 sm:w-16 ${TIER_RING[badge.tier]}`}
      >
        <BadgeIcon
          slug={badge.slug}
          className="h-12 w-12 sm:h-14 sm:w-14"
        />
      </button>
    </Tooltip>
  );
}

interface BadgeDetailModalProps {
  badge: BadgeView | null;
  onClose: () => void;
}

function BadgeDetailModal({
  badge,
  onClose,
}: BadgeDetailModalProps): React.JSX.Element {
  return (
    <Modal
      open={badge !== null}
      title={badge?.name ?? ""}
      onClose={onClose}
      size="sm"
    >
      {badge ? (
        <div className="flex flex-col items-center gap-4 text-center sm:gap-5">
          <div
            className={`inline-flex h-24 w-24 items-center justify-center rounded-2xl ring-2 ${TIER_RING[badge.tier]}`}
          >
            <BadgeIcon slug={badge.slug} className="h-20 w-20" />
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <h3 className="text-lg font-bold tracking-tight">{badge.name}</h3>
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
              {badge.role}
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
              <span className="rounded-full border border-border bg-surface-2/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fg-muted">
                {TIER_LABEL[badge.tier]}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${RARITY_BADGE_CLASS[badge.rarity]}`}
              >
                {RARITY_LABEL[badge.rarity]}
              </span>
              <span className="rounded-full border border-border bg-surface-2/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fg-muted">
                {CATEGORY_LABEL[badge.category]}
              </span>
              <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                {badge.xpReward} XP
              </span>
            </div>
          </div>

          <p className="max-w-md text-sm font-medium leading-relaxed text-fg-muted">
            {badge.description}
          </p>

          <p className="text-xs font-medium text-fg-subtle">
            Earned{" "}
            {new Date(badge.awardedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      ) : null}
    </Modal>
  );
}

/**
 * Sort by tier (elite > specialist > quality > contributor), then rarity
 * (legendary > rare > uncommon > common), then awarded-at desc, then slug.
 */
function compareBadges(a: BadgeView, b: BadgeView): number {
  const ta = TIER_ORDER[a.tier];
  const tb = TIER_ORDER[b.tier];
  if (ta !== tb) return tb - ta;
  const ra = RARITY_ORDER[a.rarity];
  const rb = RARITY_ORDER[b.rarity];
  if (ra !== rb) return rb - ra;
  const at = new Date(a.awardedAt).getTime();
  const bt = new Date(b.awardedAt).getTime();
  if (at !== bt) return bt - at;
  return a.slug.localeCompare(b.slug);
}
