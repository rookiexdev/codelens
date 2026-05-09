import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { BadgesService } from '../badges/badges.service';
import { SoftDeleteService } from '../common/soft-delete/soft-delete.service';
import { Prisma } from '../../prisma/generated/client';
import { USER_NOT_DELETED_FILTER } from '../common/soft-delete/filters';
import { SetStatusDto } from './dto/status.dto';
import { UpdateTechStackDto } from './dto/tech-stack.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ReplaceSocialLinksDto } from './dto/social-links.dto';
import { isReservedUsername } from './username';
import {
  PrivateUserProfile,
  PublicUserProfile,
  SocialLinkView,
  BadgeView,
  UserStatusView,
} from './interfaces/user-profile.interface';

const PUBLIC_PROFILE_SELECT = {
  id: true,
  username: true,
  fullName: true,
  description: true,
  company: true,
  location: true,
  avatarSeed: true,
  avatarUrl: true,
  techStack: true,
  statusEmoji: true,
  statusText: true,
  statusBusy: true,
  statusExpiresAt: true,
  statusUpdatedAt: true,
  createdAt: true,
  socialLinks: {
    select: {
      provider: true,
      url: true,
      label: true,
      position: true,
    },
    orderBy: { position: 'asc' as const },
  },
  badges: {
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
    orderBy: { awardedAt: 'desc' as const },
  },
} satisfies Prisma.UserSelect;

const PRIVATE_PROFILE_SELECT = {
  ...PUBLIC_PROFILE_SELECT,
  email: true,
} satisfies Prisma.UserSelect;

type PublicProfileRow = Prisma.UserGetPayload<{
  select: typeof PUBLIC_PROFILE_SELECT;
}>;
type PrivateProfileRow = Prisma.UserGetPayload<{
  select: typeof PRIVATE_PROFILE_SELECT;
}>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly badges: BadgesService,
    private readonly softDelete: SoftDeleteService,
  ) {}

  async getPrivateProfile(userId: string): Promise<PrivateUserProfile> {
    const row = await this.prisma.user.findFirst({
      where: { id: userId, ...USER_NOT_DELETED_FILTER },
      select: PRIVATE_PROFILE_SELECT,
    });
    if (!row) throw new NotFoundException('user not found');
    return mapPrivate(row);
  }

  async getPublicProfileByUsername(
    username: string,
  ): Promise<PublicUserProfile> {
    const row = await this.prisma.user.findFirst({
      where: { username, ...USER_NOT_DELETED_FILTER },
      select: PUBLIC_PROFILE_SELECT,
    });
    if (!row) throw new NotFoundException('user not found');
    return mapPublic(row);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<PrivateUserProfile> {
    if (dto.username && isReservedUsername(dto.username)) {
      throw new ConflictException('username is reserved');
    }

    const current = await this.prisma.user.findFirst({
      where: { id: userId, ...USER_NOT_DELETED_FILTER },
      select: { id: true, username: true },
    });
    if (!current) throw new NotFoundException('user not found');

    const usernameChanged =
      dto.username !== undefined && dto.username !== current.username;

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const row = await tx.user.update({
          where: { id: userId },
          data: {
            username: dto.username,
            fullName: dto.fullName,
            description: dto.description,
            company: dto.company,
            location: dto.location,
            avatarSeed: dto.avatarSeed,
          },
          select: PRIVATE_PROFILE_SELECT,
        });
        await this.activity.record({
          userId,
          type: 'profile_updated',
          metadata: { fields: Object.keys(dto) },
          tx,
        });
        if (usernameChanged) {
          await this.activity.record({
            userId,
            type: 'username_changed',
            metadata: { from: current.username, to: dto.username },
            tx,
          });
        }
        await this.badges.evaluateForUser({
          userId,
          trigger: 'profile_updated',
          tx,
        });
        return row;
      });
      return mapPrivate(updated);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('username already taken');
      }
      throw err;
    }
  }

  async replaceSocialLinks(
    userId: string,
    dto: ReplaceSocialLinksDto,
  ): Promise<SocialLinkView[]> {
    return this.prisma.$transaction(async (tx) => {
      await tx.userSocialLink.deleteMany({ where: { userId } });
      if (dto.links.length > 0) {
        await tx.userSocialLink.createMany({
          data: dto.links.map((link, index) => ({
            userId,
            provider: link.provider,
            url: link.url,
            label: link.label ?? null,
            position: index,
          })),
        });
      }
      const rows = await tx.userSocialLink.findMany({
        where: { userId },
        select: { provider: true, url: true, label: true, position: true },
        orderBy: { position: 'asc' },
      });
      await this.activity.record({
        userId,
        type: 'social_links_updated',
        metadata: { count: rows.length },
        tx,
      });
      return rows;
    });
  }

  async updateTechStack(
    userId: string,
    dto: UpdateTechStackDto,
  ): Promise<string[]> {
    // Trim, drop empties, dedupe (case-insensitive) while preserving order.
    const seen = new Set<string>();
    const cleaned: string[] = [];
    for (const raw of dto.techStack) {
      const value = raw.trim();
      const key = value.toLowerCase();
      if (!value || seen.has(key)) continue;
      seen.add(key);
      cleaned.push(value);
    }

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.user.update({
        where: { id: userId },
        data: { techStack: cleaned },
        select: { techStack: true },
      });
      await this.activity.record({
        userId,
        type: 'tech_stack_updated',
        metadata: { count: cleaned.length },
        tx,
      });
      await this.badges.evaluateForUser({
        userId,
        trigger: 'profile_updated',
        tx,
      });
      return row.techStack;
    });
  }

  async setStatus(
    userId: string,
    dto: SetStatusDto,
  ): Promise<UserStatusView | null> {
    const now = new Date();
    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          statusEmoji: dto.emoji ?? null,
          statusText: dto.text ?? null,
          statusBusy: dto.busy ?? false,
          statusExpiresAt: dto.expiresAt ?? null,
          statusUpdatedAt: now,
        },
        select: {
          statusEmoji: true,
          statusText: true,
          statusBusy: true,
          statusExpiresAt: true,
          statusUpdatedAt: true,
        },
      });
      await this.activity.record({
        userId,
        type: 'status_updated',
        metadata: {
          emoji: dto.emoji ?? null,
          hasText: Boolean(dto.text),
          busy: dto.busy ?? false,
          expiresAt: dto.expiresAt ?? null,
        },
        tx,
      });
      await this.badges.evaluateForUser({
        userId,
        trigger: 'status_updated',
        tx,
      });
      return updated;
    });
    return mapStatus(row);
  }

  async clearStatus(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          statusEmoji: null,
          statusText: null,
          statusBusy: false,
          statusExpiresAt: null,
          statusUpdatedAt: new Date(),
        },
      });
      await this.activity.record({
        userId,
        type: 'status_cleared',
        tx,
      });
    });
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.activity.record({ userId, type: 'account_deleted', tx });
      await this.softDelete.softDelete('user', userId, { tx });
    });
  }
}

type StatusRow = {
  statusEmoji: string | null;
  statusText: string | null;
  statusBusy: boolean;
  statusExpiresAt: Date | null;
  statusUpdatedAt: Date | null;
};

/**
 * Build a status view from row columns. Returns null when no status is set
 * OR when the existing status has already expired — clients should treat
 * "no status" and "expired status" identically without needing to know the
 * difference.
 */
function mapStatus(row: StatusRow): UserStatusView | null {
  const hasContent =
    row.statusEmoji !== null || row.statusText !== null || row.statusBusy;
  if (!hasContent) return null;
  if (row.statusExpiresAt && row.statusExpiresAt.getTime() <= Date.now()) {
    return null;
  }
  return {
    emoji: row.statusEmoji,
    text: row.statusText,
    busy: row.statusBusy,
    expiresAt: row.statusExpiresAt,
    updatedAt: row.statusUpdatedAt,
  };
}

function mapPublic(row: PublicProfileRow): PublicUserProfile {
  return {
    id: row.id,
    username: row.username,
    fullName: row.fullName,
    description: row.description,
    company: row.company,
    location: row.location,
    avatarSeed: row.avatarSeed,
    avatarUrl: row.avatarUrl,
    techStack: row.techStack,
    status: mapStatus(row),
    createdAt: row.createdAt,
    socialLinks: row.socialLinks satisfies SocialLinkView[],
    badges: row.badges.map<BadgeView>((b) => ({
      slug: b.badge.slug,
      name: b.badge.name,
      role: b.badge.role,
      description: b.badge.description,
      iconKey: b.badge.iconKey,
      tier: b.badge.tier,
      category: b.badge.category,
      rarity: b.badge.rarity,
      colorTheme: b.badge.colorTheme,
      xpReward: b.badge.xpReward,
      awardedAt: b.awardedAt,
    })),
  };
}

function mapPrivate(row: PrivateProfileRow): PrivateUserProfile {
  return { ...mapPublic(row), email: row.email };
}
