import { Injectable } from '@nestjs/common';
import type { BadgeCriteria, CriteriaType } from '../types/criteria';
import {
  LifetimeCountStrategy,
  RollingWindowCountStrategy,
  StreakStrategy,
  TimeBucketCountStrategy,
  WeeklyCountStrategy,
} from './activity-strategies';
import {
  LanguageMasteryStrategy,
  LifetimeAvgScoreStrategy,
  PolyglotStrategy,
} from './mastery-strategies';
import {
  BadgeCountSelfStrategy,
  MilestoneStrategy,
  ProfileCompleteStrategy,
  SignupRankStrategy,
} from './profile-strategies';
import type { BadgeStrategy, StrategyContext, StrategyResult } from './types';

/**
 * Maps each `criteria.type` to the strategy that knows how to evaluate
 * it. `deferred` is intentionally absent — those badges live in the
 * catalog but are awarded manually (or by a future strategy).
 */
@Injectable()
export class BadgeStrategyRegistry {
  private readonly registry: Map<CriteriaType, BadgeStrategy>;

  constructor(
    milestone: MilestoneStrategy,
    profileComplete: ProfileCompleteStrategy,
    signupRank: SignupRankStrategy,
    badgeCount: BadgeCountSelfStrategy,
    count: LifetimeCountStrategy,
    rolling: RollingWindowCountStrategy,
    weekly: WeeklyCountStrategy,
    timeBucket: TimeBucketCountStrategy,
    streak: StreakStrategy,
    languageMastery: LanguageMasteryStrategy,
    polyglot: PolyglotStrategy,
    lifetimeAvg: LifetimeAvgScoreStrategy,
  ) {
    const items: BadgeStrategy[] = [
      milestone,
      profileComplete,
      signupRank,
      badgeCount,
      count,
      rolling,
      weekly,
      timeBucket,
      streak,
      languageMastery,
      polyglot,
      lifetimeAvg,
    ];
    this.registry = new Map(items.map((s) => [s.type, s]));
  }

  evaluate(
    criteria: BadgeCriteria,
    ctx: StrategyContext,
  ): Promise<StrategyResult> | null {
    if (criteria.type === 'deferred') return null;
    const strategy = this.registry.get(criteria.type);
    if (!strategy) return null;
    // The registry guarantees the strategy matches the criteria tag, but
    // TS can't infer that from a Map lookup — narrow with an assertion.
    return strategy.evaluate(criteria as never, ctx);
  }
}

export const BADGE_STRATEGY_PROVIDERS = [
  MilestoneStrategy,
  ProfileCompleteStrategy,
  SignupRankStrategy,
  BadgeCountSelfStrategy,
  LifetimeCountStrategy,
  RollingWindowCountStrategy,
  WeeklyCountStrategy,
  TimeBucketCountStrategy,
  StreakStrategy,
  LanguageMasteryStrategy,
  PolyglotStrategy,
  LifetimeAvgScoreStrategy,
  BadgeStrategyRegistry,
];
