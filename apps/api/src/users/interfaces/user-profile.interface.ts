import {
  ActivityType,
  BadgeCategory,
  BadgeRarity,
  BadgeTier,
  SocialProvider,
} from '../../../prisma/generated/client';

export interface SocialLinkView {
  provider: SocialProvider;
  url: string;
  label: string | null;
  position: number;
}

export interface BadgeView {
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
  awardedAt: Date;
}

export interface UserStatusView {
  emoji: string | null;
  text: string | null;
  busy: boolean;
  expiresAt: Date | null;
  updatedAt: Date | null;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  fullName: string | null;
  description: string | null;
  company: string | null;
  location: string | null;
  avatarSeed: string | null;
  avatarUrl: string | null;
  techStack: string[];
  status: UserStatusView | null;
  createdAt: Date;
  socialLinks: SocialLinkView[];
  badges: BadgeView[];
}

export interface PrivateUserProfile extends PublicUserProfile {
  email: string;
}

export interface ActivityFeedItem {
  id: string;
  type: ActivityType;
  metadata: unknown;
  occurredAt: Date;
}
