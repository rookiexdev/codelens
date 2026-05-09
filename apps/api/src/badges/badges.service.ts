/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ActivityService } from '../activity/activity.service';
import { Prisma } from '../../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeStrategyRegistry } from './strategies';
import type { StrategyContext } from './strategies/types';
import {
  BadgeEvaluationTrigger,
  BadgeEvidence,
  parseCriteria,
} from './types/criteria';

type Tx = Prisma.TransactionClient;

interface EvaluateArgs {
  userId: string;
  trigger: BadgeEvaluationTrigger;
  /** Active transaction client. If absent, the service starts its own. */
  tx?: Tx;
}

export interface AwardedBadgeView {
  slug: string;
  name: string;
  role: string;
  description: string;
  iconKey: string;
  tier: string;
  category: string;
  rarity: string;
  colorTheme: string;
  xpReward: number;
  awardedAt: Date;
}

export interface BadgeCatalogEntry {
  slug: string;
  name: string;
  role: string;
  description: string;
  iconKey: string;
  tier: string;
  category: string;
  rarity: string;
  colorTheme: string;
  xpReward: number;
  visibleOnPrComment: boolean;
  progressTrackable: boolean;
  progressLabel: string | null;
  isActive: boolean;
}

const CATALOG_SELECT = {
  id: true,
  slug: true,
  name: true,
  role: true,
  description: true,
  iconKey: true,
  tier: true,
  category: true,
  rarity: true,
  colorTheme: true,
  xpReward: true,
  visibleOnPrComment: true,
  progressTrackable: true,
  progressLabel: true,
  criteria: true,
  isActive: true,
} satisfies Prisma.BadgeSelect;

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly strategies: BadgeStrategyRegistry,
  ) {}

  /**
   * Run every active strategy-backed badge against this user's data.
   * Returns the badges awarded *during this call* — not the user's full
   * earned set. Idempotent: the unique `(userId, badgeId)` constraint
   * means re-running is harmless.
   *
   * Caller responsibilities:
   * - Pass `tx` if you want the awards to participate in the same
   *   transaction as the triggering write (recommended for review_created).
   * - The activity row `badge_awarded` is recorded automatically here.
   */
  async evaluateForUser(args: EvaluateArgs): Promise<AwardedBadgeView[]> {
    if (args.tx) {
      return this.runEvaluation(args.userId, args.trigger, args.tx);
    }
    return this.prisma.$transaction((tx) =>
      this.runEvaluation(args.userId, args.trigger, tx),
    );
  }

  async listCatalog(): Promise<BadgeCatalogEntry[]> {
    const rows = await this.prisma.badge.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        name: true,
        role: true,
        description: true,
        iconKey: true,
        tier: true,
        category: true,
        rarity: true,
        colorTheme: true,
        xpReward: true,
        visibleOnPrComment: true,
        progressTrackable: true,
        progressLabel: true,
        isActive: true,
      },
      orderBy: [{ tier: 'asc' }, { rarity: 'asc' }, { slug: 'asc' }],
    });
    return rows;
  }

  async listForUser(userId: string): Promise<AwardedBadgeView[]> {
    const rows = await this.prisma.userBadge.findMany({
      where: { userId },
      select: {
        awardedAt: true,
        badge: {
          select: {
            slug: true,
            name: true,
            role: true,
            description: true,
            iconKey: true,
            tier: true,
            category: true,
            rarity: true,
            colorTheme: true,
            xpReward: true,
          },
        },
      },
      orderBy: { awardedAt: 'desc' },
    });
    return rows.map((r) => ({
      slug: r.badge.slug,
      name: r.badge.name,
      role: r.badge.role,
      description: r.badge.description,
      iconKey: r.badge.iconKey,
      tier: r.badge.tier,
      category: r.badge.category,
      rarity: r.badge.rarity,
      colorTheme: r.badge.colorTheme,
      xpReward: r.badge.xpReward,
      awardedAt: r.awardedAt,
    }));
  }

  /**
   * Manually award a badge by slug (admin/debug use). Throws if the
   * slug is unknown. Silently no-ops if the user already has it.
   */
  async awardBySlug(args: {
    userId: string;
    slug: string;
    trigger: BadgeEvaluationTrigger;
    evidence?: Partial<BadgeEvidence>;
    tx?: Tx;
  }): Promise<AwardedBadgeView | null> {
    const run = async (tx: Tx): Promise<AwardedBadgeView | null> => {
      const badge = await tx.badge.findUnique({
        where: { slug: args.slug },
        select: CATALOG_SELECT,
      });
      if (!badge) {
        throw new NotFoundException(`badge not found: ${args.slug}`);
      }
      return this.persistAward({
        tx,
        userId: args.userId,
        badge,
        trigger: args.trigger,
        evidence: args.evidence ?? { trigger: args.trigger },
      });
    };
    if (args.tx) return run(args.tx);
    return this.prisma.$transaction(run);
  }

  private async runEvaluation(
    userId: string,
    trigger: BadgeEvaluationTrigger,
    tx: Tx,
  ): Promise<AwardedBadgeView[]> {
    const [badges, owned] = await Promise.all([
      tx.badge.findMany({
        where: { isActive: true },
        select: CATALOG_SELECT,
      }),
      tx.userBadge.findMany({
        where: { userId },
        select: { badgeId: true },
      }),
    ]);
    const ownedIds = new Set(owned.map((o) => o.badgeId));
    const ctx: StrategyContext = { userId, db: tx, trigger };
    const awarded: AwardedBadgeView[] = [];

    for (const badge of badges) {
      if (ownedIds.has(badge.id)) continue;
      let parsed: ReturnType<typeof parseCriteria>;
      try {
        parsed = parseCriteria(badge.criteria);
      } catch (err) {
        this.logger.error(
          `Skipping badge ${badge.slug}: invalid criteria — ${err instanceof Error ? err.message : String(err)}`,
        );
        continue;
      }
      const promise = this.strategies.evaluate(parsed, ctx);
      if (!promise) continue; // deferred or unhandled
      const result = await promise;
      if (!result.awarded) continue;
      const view = await this.persistAward({
        tx,
        userId,
        badge,
        trigger,
        evidence: result.evidence,
      });
      if (view) awarded.push(view);
    }
    return awarded;
  }

  private async persistAward(args: {
    tx: Tx;
    userId: string;
    badge: Prisma.BadgeGetPayload<{ select: typeof CATALOG_SELECT }>;
    trigger: BadgeEvaluationTrigger;
    evidence: Partial<BadgeEvidence>;
  }): Promise<AwardedBadgeView | null> {
    try {
      const created = await args.tx.userBadge.create({
        data: {
          userId: args.userId,
          badgeId: args.badge.id,
          metadata: args.evidence as Prisma.InputJsonValue,
        },
        select: { awardedAt: true },
      });
      await this.activity.record({
        userId: args.userId,
        type: 'badge_awarded',
        metadata: { slug: args.badge.slug, trigger: args.trigger },
        tx: args.tx,
      });
      return {
        slug: args.badge.slug,
        name: args.badge.name,
        role: args.badge.role,
        description: args.badge.description,
        iconKey: args.badge.iconKey,
        tier: args.badge.tier,
        category: args.badge.category,
        rarity: args.badge.rarity,
        colorTheme: args.badge.colorTheme,
        xpReward: args.badge.xpReward,
        awardedAt: created.awardedAt,
      };
    } catch (err) {
      // P2002 = race: another evaluation already awarded this badge for
      // the user. Treat as success-noop so caller logic stays simple.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return null;
      }
      throw err;
    }
  }
}
