import { Prisma, PrismaClient } from '../generated/client';
import { BADGE_CATALOG } from './badges';

/**
 * Idempotent seed: upserts the badge catalog by slug. Safe to run on
 * every deploy. Does NOT delete badges that are absent from the catalog
 * — flip `isActive` to false on the seed row instead, so existing awards
 * are preserved.
 */
async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    let created = 0;
    let updated = 0;
    for (const badge of BADGE_CATALOG) {
      const existing = await prisma.badge.findUnique({
        where: { slug: badge.slug },
        select: { id: true },
      });
      // BadgeCriteria is a strict discriminated union; Prisma's JSON
      // input expects a structurally-indexable type, so cast at the seam.
      const criteria = badge.criteria as unknown as Prisma.InputJsonValue;
      const data = {
        slug: badge.slug,
        name: badge.name,
        role: badge.role,
        description: badge.description,
        iconKey: badge.iconKey,
        tier: badge.tier,
        category: badge.category,
        rarity: badge.rarity,
        colorTheme: badge.colorTheme,
        xpReward: badge.xpReward,
        visibleOnPrComment: badge.visibleOnPrComment,
        progressTrackable: badge.progressTrackable,
        progressLabel: badge.progressLabel,
        criteria,
        isActive: true,
      };
      await prisma.badge.upsert({
        where: { slug: badge.slug },
        create: data,
        update: data,
      });
      if (existing) updated += 1;
      else created += 1;
    }

    console.log(
      `[badges:seed] created=${created} updated=${updated} total=${BADGE_CATALOG.length}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error('[badges:seed] failed', err);
  process.exit(1);
});
