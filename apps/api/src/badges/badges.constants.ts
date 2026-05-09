/**
 * Stable slugs. The slug is the contract between catalog, evaluator,
 * and frontend SVG asset path (`apps/web/public/badges/icons/<slug>.svg`).
 * Never reuse a slug for a different meaning. Renames are display-only
 * via `Badge.name` / `Badge.description`.
 */
export const BADGE_SLUGS = {
  // Contributor tier — Activity & Streaks
  FIRST_PR_LANDED: 'first_pr_landed',
  STREAK_STARTER: 'streak_starter',
  MONTHLY_GRINDER: 'monthly_grinder',
  ACTIVE_CONTRIBUTOR: 'active_contributor',
  COMEBACK_KID: 'comeback_kid',

  // Quality tier — Code Quality & Security
  CLEAN_REVIEW: 'clean_review',
  ZERO_ISSUE_AUTHOR: 'zero_issue_author',
  SECURITY_FIRST: 'security_first',
  VULNERABILITY_HUNTER: 'vulnerability_hunter',
  IMMACULATE_CODEBASE: 'immaculate_codebase',

  // Specialist tier — Testing, Docs, Performance
  TEST_FIRST_DEVELOPER: 'test_first_developer',
  COVERAGE_CHAMPION: 'coverage_champion',
  DOC_DEVOTEE: 'doc_devotee',
  PERFORMANCE_OPTIMIZER: 'performance_optimizer',
  REFACTOR_ARTISAN: 'refactor_artisan',

  // Elite tier — Platform-wide & Legendary
  PLATFORM_PIONEER: 'platform_pioneer',
  KILOCODER: 'kilocoder',
  FLAWLESS_YEAR: 'flawless_year',
  POLYGLOT_MASTER: 'polyglot_master',
  CODELENS_LEGEND: 'codelens_legend',
} as const;

export type BadgeSlug = (typeof BADGE_SLUGS)[keyof typeof BADGE_SLUGS];

/**
 * `iconKey` doubles as the SVG filename — the frontend resolves it as
 * `/badges/icons/<iconKey>.svg`. Keeping it equal to the slug means we
 * never need a separate lookup table.
 */
export const ICON_KEY_FOR = (slug: BadgeSlug): string => slug;
