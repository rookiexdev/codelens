import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../prisma/generated/client';
import type {
  LifetimeCountCriteria,
  RollingWindowCountCriteria,
  StreakCriteria,
  TimeBucketCountCriteria,
  WeeklyCountCriteria,
} from '../types/criteria';
import type { BadgeStrategy, StrategyContext, StrategyResult } from './types';

function buildReviewWhere(
  userId: string,
  filters?: LifetimeCountCriteria['filters'],
): Prisma.ReviewWhereInput {
  const where: Prisma.ReviewWhereInput = { userId };
  if (filters?.language) where.language = filters.language;
  if (typeof filters?.minScore === 'number') {
    where.score = { gte: filters.minScore };
  }
  return where;
}

@Injectable()
export class LifetimeCountStrategy implements BadgeStrategy<LifetimeCountCriteria> {
  readonly type = 'count' as const;

  async evaluate(
    criteria: LifetimeCountCriteria,
    ctx: StrategyContext,
  ): Promise<StrategyResult> {
    const count = await ctx.db.review.count({
      where: buildReviewWhere(ctx.userId, criteria.filters),
    });
    return {
      awarded: count >= criteria.value,
      evidence: { trigger: ctx.trigger, measuredValue: count },
    };
  }
}

@Injectable()
export class RollingWindowCountStrategy implements BadgeStrategy<RollingWindowCountCriteria> {
  readonly type = 'count_in_rolling_window' as const;

  async evaluate(
    criteria: RollingWindowCountCriteria,
    ctx: StrategyContext,
  ): Promise<StrategyResult> {
    const since = new Date(Date.now() - criteria.windowDays * 86_400_000);
    const where = buildReviewWhere(ctx.userId, criteria.filters);
    where.createdAt = { gte: since };
    const count = await ctx.db.review.count({ where });
    return {
      awarded: count >= criteria.value,
      evidence: {
        trigger: ctx.trigger,
        measuredValue: count,
        notes: `${count} PRs in last ${criteria.windowDays}d`,
      },
    };
  }
}

@Injectable()
export class WeeklyCountStrategy implements BadgeStrategy<WeeklyCountCriteria> {
  readonly type = 'count_in_week' as const;

  async evaluate(
    criteria: WeeklyCountCriteria,
    ctx: StrategyContext,
  ): Promise<StrategyResult> {
    // Fetch the user's review createdAt timestamps in id order (cheap when
    // indexed by userId+createdAt). Bucket into ISO weeks; unlock if any
    // week clears the threshold.
    const rows = await ctx.db.review.findMany({
      where: buildReviewWhere(ctx.userId, criteria.filters),
      select: { createdAt: true },
    });
    const weekCounts = new Map<string, number>();
    let bestWeek: { key: string; count: number } | null = null;
    for (const row of rows) {
      const key = isoWeekKey(row.createdAt);
      const next = (weekCounts.get(key) ?? 0) + 1;
      weekCounts.set(key, next);
      if (!bestWeek || next > bestWeek.count) bestWeek = { key, count: next };
    }
    const awarded = (bestWeek?.count ?? 0) >= criteria.value;
    return {
      awarded,
      evidence: {
        trigger: ctx.trigger,
        measuredValue: bestWeek?.count ?? 0,
        windowStart: bestWeek?.key,
        notes: bestWeek ? `peak week ${bestWeek.key}` : 'no reviews yet',
      },
    };
  }
}

@Injectable()
export class TimeBucketCountStrategy implements BadgeStrategy<TimeBucketCountCriteria> {
  readonly type = 'count_in_time_bucket' as const;

  async evaluate(
    criteria: TimeBucketCountCriteria,
    ctx: StrategyContext,
  ): Promise<StrategyResult> {
    // No DB-side time-of-day filter on Mongo without aggregation; fetch
    // createdAt and bucket in code. Acceptable for now — typical user
    // review counts are small relative to a query latency budget.
    const rows = await ctx.db.review.findMany({
      where: { userId: ctx.userId },
      select: { createdAt: true },
    });
    const { startHour, endHour } = criteria.bucket;
    const wraps = endHour <= startHour;
    let count = 0;
    for (const row of rows) {
      const hour = row.createdAt.getUTCHours();
      const inBucket = wraps
        ? hour >= startHour || hour < endHour
        : hour >= startHour && hour < endHour;
      if (inBucket) count += 1;
    }
    return {
      awarded: count >= criteria.value,
      evidence: { trigger: ctx.trigger, measuredValue: count },
    };
  }
}

@Injectable()
export class StreakStrategy implements BadgeStrategy<StreakCriteria> {
  readonly type = 'streak' as const;

  async evaluate(
    criteria: StreakCriteria,
    ctx: StrategyContext,
  ): Promise<StrategyResult> {
    // user_contributions is one row per UTC day with at least one
    // review_created activity. Longest run of consecutive days = streak.
    const rows = await ctx.db.userContribution.findMany({
      where: { userId: ctx.userId },
      select: { day: true },
      orderBy: { day: 'asc' },
    });
    let best = 0;
    let current = 0;
    let prev: Date | null = null;
    for (const row of rows) {
      if (prev && isNextUtcDay(prev, row.day)) {
        current += 1;
      } else {
        current = 1;
      }
      if (current > best) best = current;
      prev = row.day;
    }
    return {
      awarded: best >= criteria.value,
      evidence: { trigger: ctx.trigger, streakLength: best },
    };
  }
}

/**
 * ISO 8601 week key: `YYYY-Www`. Ties together reviews that fall in the
 * same Mon–Sun window regardless of year boundary.
 */
function isoWeekKey(d: Date): string {
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  // Thursday in current week decides the year per ISO 8601.
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function isNextUtcDay(prev: Date, next: Date): boolean {
  const ms = 86_400_000;
  const a = Date.UTC(
    prev.getUTCFullYear(),
    prev.getUTCMonth(),
    prev.getUTCDate(),
  );
  const b = Date.UTC(
    next.getUTCFullYear(),
    next.getUTCMonth(),
    next.getUTCDate(),
  );
  return b - a === ms;
}
