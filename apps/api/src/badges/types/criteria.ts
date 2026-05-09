import type {
  BadgeCategory,
  BadgeRarity,
  BadgeTier,
  Prisma,
} from '../../../prisma/generated/client';

/**
 * Discriminated union persisted as JSON in `Badge.criteria`. The seed file
 * is the only writer; the evaluator parses it at award time. New criteria
 * shapes go here AND get a corresponding strategy in `strategies/`.
 */
export type BadgeCriteria =
  | MilestoneCriteria
  | LifetimeCountCriteria
  | RollingWindowCountCriteria
  | WeeklyCountCriteria
  | TimeBucketCountCriteria
  | StreakCriteria
  | LanguageMasteryCriteria
  | PolyglotCriteria
  | LifetimeAvgScoreCriteria
  | ProfileCompleteCriteria
  | SignupRankCriteria
  | BadgeCountSelfCriteria
  | DeferredCriteria;

export type CriteriaType = BadgeCriteria['type'];

/**
 * One-shot trigger fired by a domain event. Used for badges with no
 * progression (e.g. first PR, first status set).
 */
export interface MilestoneCriteria {
  type: 'milestone';
  event: 'first_pr_reviewed' | 'first_status_set';
}

/**
 * Lifetime count of reviews matching optional filters. Most "volume" and
 * "quality" badges use this shape.
 */
export interface LifetimeCountCriteria {
  type: 'count';
  metric: 'reviews';
  value: number;
  filters?: ReviewFilters;
}

/**
 * Count of reviews in any single ISO week (Mon-Sun). The badge unlocks
 * once *any* week clears the threshold — historic weeks count.
 */
export interface WeeklyCountCriteria {
  type: 'count_in_week';
  metric: 'reviews';
  value: number;
  filters?: ReviewFilters;
}

/**
 * Count of reviews inside a sliding window ending now (e.g. "25 PRs in
 * the last 30 days"). Recomputed on each evaluation, so a user who
 * stops shipping and drops below the threshold loses the *eligibility*
 * — but if they were already awarded the badge, the row stays (we don't
 * revoke). Most useful for gating cadence-style awards.
 */
export interface RollingWindowCountCriteria {
  type: 'count_in_rolling_window';
  metric: 'reviews';
  value: number;
  windowDays: number;
  filters?: ReviewFilters;
}

/**
 * Count of reviews whose `createdAt` falls inside a recurring time-of-day
 * bucket. Hours are evaluated in UTC for now (a future user-timezone
 * column would let us evaluate in user-local — flagged in follow-ups).
 */
export interface TimeBucketCountCriteria {
  type: 'count_in_time_bucket';
  metric: 'reviews';
  value: number;
  bucket: TimeBucket;
}

export interface TimeBucket {
  /** Inclusive start hour, 0-23. */
  startHour: number;
  /** Exclusive end hour, 0-24. May be <= startHour to wrap past midnight. */
  endHour: number;
}

/**
 * Longest run of consecutive UTC days with at least one
 * `user_contributions` row (i.e. at least one `review_created`).
 */
export interface StreakCriteria {
  type: 'streak';
  metric: 'active_days';
  value: number;
}

/**
 * Per-language mastery: must have ≥`minPrs` reviews in `language` *and*
 * an average score ≥`minAvgScore`. `minPrs` doubles as the sample-size
 * guard so a single 100-score PR cannot unlock a high-tier mastery badge.
 */
export interface LanguageMasteryCriteria {
  type: 'language_mastery';
  language: string;
  minPrs: number;
  minAvgScore: number;
}

/**
 * Distinct languages with at least `minPrsPerLanguage` reviews each,
 * optionally gated by a per-language average score (so "Hyperglot" can
 * require quality in every covered language, not just volume).
 */
export interface PolyglotCriteria {
  type: 'polyglot';
  minLanguages: number;
  minPrsPerLanguage: number;
  minAvgScorePerLanguage?: number;
}

/**
 * Lifetime average AI score across all reviews, with a sample-size
 * guard so a single 100-score PR cannot unlock the badge. Used by
 * "Immaculate Codebase"-style awards.
 */
export interface LifetimeAvgScoreCriteria {
  type: 'lifetime_avg_score';
  minPrs: number;
  minAvgScore: number;
}

/**
 * Profile fields the user must have populated. A user "completes" their
 * profile when all required predicates are true at the same time.
 */
export interface ProfileCompleteCriteria {
  type: 'profile_complete';
  require: ProfileRequirement[];
}

export type ProfileRequirement =
  | 'avatar'
  | 'description'
  | 'company_or_location'
  | 'tech_stack_min_3';

/**
 * The user's rank by `createdAt` is at most `maxRank` (1-indexed).
 * Used by "Platform Pioneer"-style early-adopter awards. Computed by
 * counting users created at-or-before this user's createdAt.
 */
export interface SignupRankCriteria {
  type: 'signup_rank';
  maxRank: number;
}

/**
 * The number of distinct badges this user has *already earned* meets
 * the threshold. Self-referential meta-badge (e.g. "Codelens Legend"
 * for collecting 15+ badges). The evaluator excludes the badge being
 * evaluated itself so it can't no-op the threshold.
 */
export interface BadgeCountSelfCriteria {
  type: 'badge_count_self';
  minBadges: number;
}

/**
 * Placeholder for badges whose evaluator hasn't been implemented yet
 * (e.g. waiting on a stable shape for `Review.feedback`). Seeded so the
 * catalog renders, but no strategy will award them automatically.
 */
export interface DeferredCriteria {
  type: 'deferred';
  reason: string;
}

export interface ReviewFilters {
  language?: string;
  /** Only count reviews with `score >= minScore`. */
  minScore?: number;
}

/**
 * Shape for catalog seeding. `criteria` is typed here so the seed file
 * gets compile-time errors if a slug's criteria drifts.
 */
export interface BadgeSeed {
  slug: string;
  name: string;
  role: string;
  description: string;
  iconKey: string;
  tier: BadgeTier;
  category: BadgeCategory;
  rarity: BadgeRarity;
  colorTheme: string;
  xpReward: number;
  visibleOnPrComment: boolean;
  progressTrackable: boolean;
  progressLabel: string | null;
  criteria: BadgeCriteria;
}

/**
 * Evidence written to `UserBadge.metadata` so awards are explainable.
 * Strategies fill in whichever fields are relevant to them.
 */
export interface BadgeEvidence {
  trigger: BadgeEvaluationTrigger;
  measuredValue?: number;
  language?: string;
  streakLength?: number;
  windowStart?: string;
  windowEnd?: string;
  notes?: string;
}

/**
 * Why an evaluation was kicked off. Surfaces in `UserBadge.metadata` and
 * keeps logs readable when debugging unexpected awards.
 */
export type BadgeEvaluationTrigger =
  | 'review_created'
  | 'profile_updated'
  | 'status_updated'
  | 'manual_admin'
  | 'backfill';

/**
 * Narrows an unknown JSON value to a `BadgeCriteria`. Throws on any
 * shape the evaluator does not know how to handle — better to fail
 * loudly at startup than silently award nothing.
 */
export function parseCriteria(raw: Prisma.JsonValue): BadgeCriteria {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(
      `Invalid badge criteria: expected object, got ${typeof raw}`,
    );
  }
  const obj = raw as Record<string, unknown>;
  const type = obj.type;
  if (typeof type !== 'string') {
    throw new Error('Invalid badge criteria: missing type');
  }
  switch (type) {
    case 'milestone':
    case 'count':
    case 'count_in_rolling_window':
    case 'count_in_week':
    case 'count_in_time_bucket':
    case 'streak':
    case 'language_mastery':
    case 'polyglot':
    case 'lifetime_avg_score':
    case 'profile_complete':
    case 'signup_rank':
    case 'badge_count_self':
    case 'deferred':
      // The strategies do per-field validation; we only verify the tag here.
      return obj as unknown as BadgeCriteria;
    default:
      throw new Error(`Unknown badge criteria type: ${String(type)}`);
  }
}
