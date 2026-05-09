import { api } from "./api";
import type { BadgeCategory, BadgeRarity, BadgeTier } from "./users-api";

export interface BadgeCatalogEntry {
  slug: string;
  name: string;
  role: string;
  description: string;
  iconKey: string;
  tier: BadgeTier;
  category: BadgeCategory;
  rarity: BadgeRarity;
  colorTheme: string;
  xpReward: number;
  visibleOnPrComment: boolean;
  progressTrackable: boolean;
  progressLabel: string | null;
  isActive: boolean;
}

export interface AwardedBadge {
  slug: string;
  name: string;
  role: string;
  description: string;
  iconKey: string;
  tier: BadgeTier;
  category: BadgeCategory;
  rarity: BadgeRarity;
  colorTheme: string;
  xpReward: number;
  awardedAt: string;
}

export const badgesApi = {
  async getCatalog(signal?: AbortSignal): Promise<BadgeCatalogEntry[]> {
    const { data } = await api.get<BadgeCatalogEntry[]>("/badges", { signal });
    return data;
  },

  async getMyBadges(signal?: AbortSignal): Promise<AwardedBadge[]> {
    const { data } = await api.get<AwardedBadge[]>("/badges/me", { signal });
    return data;
  },

  async evaluateMe(): Promise<{ awarded: AwardedBadge[] }> {
    const { data } = await api.post<{ awarded: AwardedBadge[] }>(
      "/badges/me/evaluate",
    );
    return data;
  },
};
