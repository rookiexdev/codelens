import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityType, Prisma } from '../../prisma/generated/client';

type Tx = Prisma.TransactionClient;

export interface ActivityContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface RecordActivityArgs {
  userId: string;
  type: ActivityType;
  metadata?: Prisma.InputJsonValue;
  context?: ActivityContext;
  /** Pass an active transaction client to participate in a larger write. */
  tx?: Tx;
}

/**
 * Activity types that count toward the contribution graph (rendered like
 * GitHub's daily heatmap). Per product spec: only review_created.
 */
const CONTRIBUTION_TYPES: ReadonlySet<ActivityType> = new Set<ActivityType>([
  'review_created',
]);

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Append an activity row and, when applicable, increment the user's
   * daily contribution counter. Activity recording must never break the
   * caller's primary path: failures are logged and swallowed unless the
   * caller passed a `tx` (in which case the transaction must abort
   * coherently).
   */
  async record(args: RecordActivityArgs): Promise<void> {
    const { userId, type, metadata, context, tx } = args;
    const data: Prisma.ActivityLogCreateInput = {
      user: { connect: { id: userId } },
      type,
      metadata: metadata ?? {},
      ipAddress: context?.ipAddress ?? null,
      userAgent: context?.userAgent ?? null,
    };

    if (tx) {
      await tx.activityLog.create({ data });
      if (CONTRIBUTION_TYPES.has(type)) {
        await this.bumpContribution(userId, tx);
      }
      return;
    }

    try {
      await this.prisma.$transaction(async (innerTx) => {
        await innerTx.activityLog.create({ data });
        if (CONTRIBUTION_TYPES.has(type)) {
          await this.bumpContribution(userId, innerTx);
        }
      });
    } catch (err) {
      this.logger.error(
        `Failed to record activity ${type} for user ${userId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  /**
   * Upsert today's contribution counter for the user. Day key is the UTC
   * date — clients render in viewer-local tz, which matches GitHub's
   * approach and avoids per-user tz storage.
   */
  private async bumpContribution(userId: string, tx: Tx): Promise<void> {
    const day = startOfUtcDay(new Date());
    await tx.userContribution.upsert({
      where: { userId_day: { userId, day } },
      create: { userId, day, count: 1 },
      update: { count: { increment: 1 } },
    });
  }

  /**
   * Aggregated contributions for a date range, used by the heatmap.
   * Returns one row per day that has activity (zero days are inferred
   * client-side to keep the payload small).
   */
  async getContributions(
    userId: string,
    range: { from: Date; to: Date },
  ): Promise<Array<{ day: Date; count: number }>> {
    return this.prisma.userContribution.findMany({
      where: {
        userId,
        day: { gte: startOfUtcDay(range.from), lte: startOfUtcDay(range.to) },
      },
      select: { day: true, count: true },
      orderBy: { day: 'asc' },
    });
  }

  /**
   * Pre-computed contribution totals for the standard windows the profile
   * page renders (last 7d / 30d / 365d / all-time). The window/year/month/
   * week values are derived from the same dataset so they reconcile; allTime
   * is a separate aggregate so we don't have to fetch every row to total it.
   */
  async getContributionTotals(
    userId: string,
  ): Promise<{ week: number; month: number; year: number; allTime: number }> {
    const today = startOfUtcDay(new Date());
    const yearStart = addDaysUtc(today, -364);
    const monthStart = addDaysUtc(today, -29);
    const weekStart = addDaysUtc(today, -6);

    const [windowRows, allTimeAgg] = await Promise.all([
      this.prisma.userContribution.findMany({
        where: { userId, day: { gte: yearStart, lte: today } },
        select: { day: true, count: true },
      }),
      this.prisma.userContribution.aggregate({
        where: { userId },
        _sum: { count: true },
      }),
    ]);

    let week = 0;
    let month = 0;
    let year = 0;
    for (const row of windowRows) {
      year += row.count;
      if (row.day >= monthStart) month += row.count;
      if (row.day >= weekStart) week += row.count;
    }
    return {
      week,
      month,
      year,
      allTime: allTimeAgg._sum.count ?? 0,
    };
  }

  /**
   * Paginated activity feed (most recent first). Cursor is the activity
   * row id; pageSize is clamped to a sane upper bound by the caller.
   */
  async getActivity(
    userId: string,
    options: { limit: number; cursor?: string },
  ): Promise<{
    items: Array<{
      id: string;
      type: ActivityType;
      metadata: Prisma.JsonValue;
      occurredAt: Date;
    }>;
    nextCursor: string | null;
  }> {
    const items = await this.prisma.activityLog.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        metadata: true,
        occurredAt: true,
      },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: options.limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    });
    const hasMore = items.length > options.limit;
    const trimmed = hasMore ? items.slice(0, options.limit) : items;
    return {
      items: trimmed,
      nextCursor: hasMore ? (trimmed.at(-1)?.id ?? null) : null,
    };
  }
}

function startOfUtcDay(input: Date): Date {
  const d = new Date(input);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addDaysUtc(input: Date, days: number): Date {
  const d = new Date(input);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
