import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModule,
  ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { ActivityModule } from './activity/activity.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BadgesModule } from './badges/badges.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import { SoftDeleteModule } from './common/soft-delete/soft-delete.module';
import { EnvironmentVariables, validateEnv } from './config/env.validation';
import { LoggerModule } from './logger/logger.module';
import { OAuthModule } from './oauth/oauth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReposModule } from './repos/repos.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
      ): ThrottlerModuleOptions => ({
        throttlers: [
          {
            name: 'default',
            ttl: config.get('THROTTLE_DEFAULT_TTL_MS', { infer: true }),
            limit: config.get('THROTTLE_DEFAULT_LIMIT', { infer: true }),
          },
          {
            name: 'auth',
            ttl: config.get('THROTTLE_AUTH_TTL_MS', { infer: true }),
            limit: config.get('THROTTLE_AUTH_LIMIT', { infer: true }),
          },
        ],
      }),
    }),
    LoggerModule,
    PrismaModule,
    EncryptionModule,
    SoftDeleteModule,
    ActivityModule,
    BadgesModule,
    UsersModule,
    AuthModule,
    OAuthModule,
    ReposModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
