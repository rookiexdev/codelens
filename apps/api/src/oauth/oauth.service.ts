import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EncryptionService } from '../common/encryption/encryption.service';
import { OAuthConnection, Provider } from '../../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { USER_NOT_DELETED_FILTER } from '../common/soft-delete/filters';

export interface OAuthConnectionMetadata {
  id: string;
  provider: Provider;
  scope: string | null;
  createdAt: Date;
}

@Injectable()
export class OAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly jwt: JwtService,
  ) {}

  async saveConnection(
    userId: string,
    provider: Provider,
    accessToken: string,
    refreshToken: string | null,
    scope: string | null,
  ): Promise<OAuthConnection> {
    const encryptedAccess = this.encryption.encrypt(accessToken);
    const encryptedRefresh =
      refreshToken === null ? null : this.encryption.encrypt(refreshToken);

    return this.prisma.oAuthConnection.upsert({
      where: { userId_provider: { userId, provider } },
      create: {
        userId,
        provider,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        scope,
      },
      update: {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        scope,
      },
    });
  }

  async getConnection(
    userId: string,
    provider: Provider,
  ): Promise<OAuthConnection | null> {
    const row = await this.prisma.oAuthConnection.findUnique({
      where: { userId_provider: { userId, provider } },
    });
    if (row === null) {
      return null;
    }
    return {
      ...row,
      accessToken: this.encryption.decrypt(row.accessToken),
      refreshToken:
        row.refreshToken === null
          ? null
          : this.encryption.decrypt(row.refreshToken),
    };
  }

  async deleteConnection(userId: string, provider: Provider): Promise<void> {
    await this.prisma.oAuthConnection.deleteMany({
      where: { userId, provider },
    });
  }

  listConnections(userId: string): Promise<OAuthConnectionMetadata[]> {
    return this.prisma.oAuthConnection.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        scope: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async handleOAuthCallback(
    userId: string,
    provider: Provider,
    accessToken: string,
    refreshToken: string | null,
    scope: string | null,
  ): Promise<string> {
    await this.saveConnection(
      userId,
      provider,
      accessToken,
      refreshToken,
      scope,
    );

    const user = await this.prisma.user.findFirst({
      where: { id: userId, ...USER_NOT_DELETED_FILTER },
      select: { id: true, email: true },
    });
    if (user === null) {
      throw new NotFoundException('User not found');
    }

    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwt.sign(payload);
  }
}
