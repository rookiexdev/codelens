import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { USER_NOT_DELETED_FILTER } from '../common/soft-delete/filters';
import { PrismaService } from '../prisma/prisma.service';
import { BadgesService } from './badges.service';

/**
 * Daily badge sweep. Re-evaluates badges for users that were active in
 * the recent window so streak / cadence / comeback predicates pick up
 * day-boundary changes the request-path triggers cannot catch (a user
 * who *stops* shipping won't fire a `review_created` to invoke lazy
 * eval, but the absence of activity matters for some criteria).
 *
 * Scope guard: cap users per run so the cron stays bounded. Anything
 * outside the active window is skipped — they have nothing to gain
 * from a re-eval and cron time is finite.
 */
@Injectable()
export class BadgesCronService {
  private readonly logger = new Logger(BadgesCronService.name);
  /** Re-eval users active within this window. 60d covers comeback_kid. */
  private static readonly ACTIVE_WINDOW_DAYS = 60;
  /** Hard upper bound per run; raise once we know typical batch size. */
  private static readonly MAX_USERS_PER_RUN = 1_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly badges: BadgesService,
  ) {}

  /**
   * Runs at 00:05 UTC daily — five minutes past midnight to clear any
   * day-boundary writes still in flight. The cron-name lets ops disable
   * it without touching code (`SchedulerRegistry`).
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM, { name: 'badges:daily-sweep' })
  async dailySweep(): Promise<void> {
    const userIds = await this.findActiveUserIds();
    this.logger.log(
      `[badges:cron] sweep starting — ${userIds.length} users in ${BadgesCronService.ACTIVE_WINDOW_DAYS}d window`,
    );

    let awarded = 0;
    let failed = 0;
    for (const userId of userIds) {
      try {
        const result = await this.badges.evaluateForUser({
          userId,
          trigger: 'backfill',
        });
        awarded += result.length;
      } catch (err) {
        failed += 1;
        this.logger.warn(
          `[badges:cron] eval failed for user ${userId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    this.logger.log(
      `[badges:cron] sweep done — users=${userIds.length} awarded=${awarded} failed=${failed}`,
    );
  }

  /**
   * Manual entry point for ops / debug. Same body as the scheduled run
   * so behaviour stays identical whether invoked by cron or operator.
   */
  async runOnce(): Promise<void> {
    return this.dailySweep();
  }

  private async findActiveUserIds(): Promise<string[]> {
    const cutoff = startOfUtcDay(
      addDaysUtc(new Date(), -BadgesCronService.ACTIVE_WINDOW_DAYS),
    );
    // Distinct userIds with at least one contribution row in the window.
    // user_contributions is small (one row per active day per user) so
    // this is cheaper than scanning reviews.
    const rows = await this.prisma.userContribution.findMany({
      where: {
        day: { gte: cutoff },
        user: USER_NOT_DELETED_FILTER,
      },
      select: { userId: true },
      distinct: ['userId'],
      take: BadgesCronService.MAX_USERS_PER_RUN,
    });
    return rows.map((r) => r.userId);
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
