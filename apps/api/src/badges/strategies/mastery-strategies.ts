import { Injectable } from '@nestjs/common';
import type {
  LanguageMasteryCriteria,
  LifetimeAvgScoreCriteria,
  PolyglotCriteria,
} from '../types/criteria';
import type { BadgeStrategy, StrategyContext, StrategyResult } from './types';

@Injectable()
export class LanguageMasteryStrategy implements BadgeStrategy<LanguageMasteryCriteria> {
  readonly type = 'language_mastery' as const;

  async evaluate(
    criteria: LanguageMasteryCriteria,
    ctx: StrategyContext,
  ): Promise<StrategyResult> {
    const agg = await ctx.db.review.aggregate({
      where: { userId: ctx.userId, language: criteria.language },
      _count: { _all: true },
      _avg: { score: true },
    });
    const count = agg._count._all;
    const avg = agg._avg.score ?? 0;
    const awarded = count >= criteria.minPrs && avg >= criteria.minAvgScore;
    return {
      awarded,
      evidence: {
        trigger: ctx.trigger,
        language: criteria.language,
        measuredValue: count,
        notes: `avg score ${avg.toFixed(1)} over ${count} ${criteria.language} PRs`,
      },
    };
  }
}

@Injectable()
export class PolyglotStrategy implements BadgeStrategy<PolyglotCriteria> {
  readonly type = 'polyglot' as const;

  async evaluate(
    criteria: PolyglotCriteria,
    ctx: StrategyContext,
  ): Promise<StrategyResult> {
    // groupBy language, count + avg per group, then count groups meeting
    // the per-language threshold (and optional avg-score gate).
    const rows = await ctx.db.review.groupBy({
      by: ['language'],
      where: { userId: ctx.userId, language: { not: null } },
      _count: { _all: true },
      _avg: { score: true },
    });
    const minAvg = criteria.minAvgScorePerLanguage;
    const qualifying = rows.filter((r) => {
      if (r._count._all < criteria.minPrsPerLanguage) return false;
      if (typeof minAvg !== 'number') return true;
      return (r._avg.score ?? 0) >= minAvg;
    });
    return {
      awarded: qualifying.length >= criteria.minLanguages,
      evidence: {
        trigger: ctx.trigger,
        measuredValue: qualifying.length,
        notes: qualifying
          .map((r) => `${r.language}:${r._count._all}`)
          .join(', '),
      },
    };
  }
}

@Injectable()
export class LifetimeAvgScoreStrategy implements BadgeStrategy<LifetimeAvgScoreCriteria> {
  readonly type = 'lifetime_avg_score' as const;

  async evaluate(
    criteria: LifetimeAvgScoreCriteria,
    ctx: StrategyContext,
  ): Promise<StrategyResult> {
    const agg = await ctx.db.review.aggregate({
      where: { userId: ctx.userId },
      _count: { _all: true },
      _avg: { score: true },
    });
    const count = agg._count._all;
    const avg = agg._avg.score ?? 0;
    return {
      awarded: count >= criteria.minPrs && avg >= criteria.minAvgScore,
      evidence: {
        trigger: ctx.trigger,
        measuredValue: count,
        notes: `avg score ${avg.toFixed(1)} over ${count} PRs`,
      },
    };
  }
}
