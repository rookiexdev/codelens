import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Provider } from '../../../prisma/generated/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UsernameGenerator } from '../../users/username';
import { OAuthProfile, OAuthValidatedUser } from './types';

@Injectable()
export class OAuthUserResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly username: UsernameGenerator,
  ) {}

  async resolve(
    provider: Provider,
    accessToken: string,
    refreshToken: string | null,
    profile: OAuthProfile,
  ): Promise<OAuthValidatedUser> {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (!email) {
      throw new UnauthorizedException(
        `${provider} account did not return an email`,
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, deletedAt: true },
    });

    let userId: string;
    if (existing === null) {
      const username = await this.username.fromEmail(email);
      const created = await this.prisma.user.create({
        data: {
          email,
          username,
          passwordHash: null,
          avatarUrl: profile.photos?.[0]?.value ?? null,
          fullName: profile.displayName ?? null,
        },
        select: { id: true },
      });
      userId = created.id;
    } else {
      if (existing.deletedAt !== null) {
        throw new UnauthorizedException('Account is disabled');
      }
      userId = existing.id;
    }

    return { userId, provider, email, accessToken, refreshToken };
  }
}
