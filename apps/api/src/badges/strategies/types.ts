import type { Prisma } from '../../../prisma/generated/client';
import type {
  BadgeCriteria,
  BadgeEvaluationTrigger,
  BadgeEvidence,
  CriteriaType,
} from '../types/criteria';

export type PrismaLike = Prisma.TransactionClient;

export interface StrategyContext {
  userId: string;
  /**
   * Either a `PrismaService` or an active `$transaction` client. Strategies
   * only invoke read methods that exist on both, so the structural type
   * `Prisma.TransactionClient` is enough to type-check.
   */
  db: PrismaLike;
  trigger: BadgeEvaluationTrigger;
}

export interface StrategyResult {
  awarded: boolean;
  evidence: Partial<BadgeEvidence>;
}

export interface BadgeStrategy<C extends BadgeCriteria = BadgeCriteria> {
  readonly type: CriteriaType;
  evaluate(criteria: C, ctx: StrategyContext): Promise<StrategyResult>;
}
