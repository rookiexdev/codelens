import { Injectable } from '@nestjs/common';
import { USER_NOT_DELETED_FILTER } from '../../common/soft-delete/filters';
import type {
  BadgeCountSelfCriteria,
  MilestoneCriteria,
  ProfileCompleteCriteria,
  SignupRankCriteria,
} from '../types/criteria';
import type { BadgeStrategy, StrategyContext, StrategyResult } from './types';

@Injectable()
export class MilestoneStrategy implements BadgeStrategy<MilestoneCriteria> {
  readonly type = 'milestone' as const;

  async evaluate(
    criteria: MilestoneCriteria,
    ctx: StrategyContext,
  ): Promise<StrategyResult> {
    switch (criteria.event) {
      case 'first_pr_reviewed': {
        const count = await ctx.db.review.count({
          where: { userId: ctx.userId },
        });
        return {
          awarded: count >= 1,
          evidence: { trigger: ctx.trigger, measuredValue: count },
        };
      }
      case 'first_status_set': {
        const count = await ctx.db.activityLog.count({
          where: { userId: ctx.userId, type: 'status_updated' },
        });
        return {
          awarded: count >= 1,
          evidence: { trigger: ctx.trigger, measuredValue: count },
        };
      }
    }
  }
}

@Injectable()
export class ProfileCompleteStrategy implements BadgeStrategy<ProfileCompleteCriteria> {
  readonly type = 'profile_complete' as const;

  async evaluate(
    criteria: ProfileCompleteCriteria,
    ctx: StrategyContext,
  ): Promise<StrategyResult> {
    const user = await ctx.db.user.findFirst({
      where: { id: ctx.userId, ...USER_NOT_DELETED_FILTER },
      select: {
        avatarSeed: true,
        avatarUrl: true,
        description: true,
        company: true,
        location: true,
        techStack: true,
      },
    });
    if (!user) return { awarded: false, evidence: { trigger: ctx.trigger } };

    const missing: string[] = [];
    for (const req of criteria.require) {
      switch (req) {
        case 'avatar':
          if (!user.avatarSeed && !user.avatarUrl) missing.push(req);
          break;
        case 'description':
          if (!user.description?.trim()) missing.push(req);
          break;
        case 'company_or_location':
          if (!user.company?.trim() && !user.location?.trim())
            missing.push(req);
          break;
        case 'tech_stack_min_3':
          if ((user.techStack?.length ?? 0) < 3) missing.push(req);
          break;
      }
    }

    return {
      awarded: missing.length === 0,
      evidence: {
        trigger: ctx.trigger,
        notes:
          missing.length === 0
            ? 'all required fields present'
            : `missing: ${missing.join(', ')}`,
      },
    };
  }
}

@Injectable()
export class SignupRankStrategy implements BadgeStrategy<SignupRankCriteria> {
  readonly type = 'signup_rank' as const;

  async evaluate(
    criteria: SignupRankCriteria,
    ctx: StrategyContext,
  ): Promise<StrategyResult> {
    // Rank = 1 + count of users created strictly before this user.
    // Using `lt` keeps the comparison stable across same-millisecond
    // signups (the user being checked never counts themselves).
    const me = await ctx.db.user.findFirst({
      where: { id: ctx.userId, ...USER_NOT_DELETED_FILTER },
      select: { createdAt: true },
    });
    if (!me) return { awarded: false, evidence: { trigger: ctx.trigger } };

    const earlier = await ctx.db.user.count({
      where: { createdAt: { lt: me.createdAt }, ...USER_NOT_DELETED_FILTER },
    });
    const rank = earlier + 1;
    return {
      awarded: rank <= criteria.maxRank,
      evidence: {
        trigger: ctx.trigger,
        measuredValue: rank,
        notes: `signup rank #${rank} of cap ${criteria.maxRank}`,
      },
    };
  }
}

@Injectable()
export class BadgeCountSelfStrategy implements BadgeStrategy<BadgeCountSelfCriteria> {
  readonly type = 'badge_count_self' as const;

  async evaluate(
    criteria: BadgeCountSelfCriteria,
    ctx: StrategyContext,
  ): Promise<StrategyResult> {
    // Counts already-awarded badges. The meta-badge being evaluated
    // can't already be in this set (the registry skips owned badges
    // before strategies run), so we don't need to subtract self.
    const count = await ctx.db.userBadge.count({
      where: { userId: ctx.userId },
    });
    return {
      awarded: count >= criteria.minBadges,
      evidence: {
        trigger: ctx.trigger,
        measuredValue: count,
        notes: `${count} / ${criteria.minBadges} badges earned`,
      },
    };
  }
}
