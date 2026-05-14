import { Logger, Module, type FactoryProvider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { EnvironmentVariables } from '../config/env.validation';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { BitbucketStrategy } from './strategies/bitbucket.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { GitLabStrategy } from './strategies/gitlab.strategy';
import { OAuthUserResolver } from './strategies/oauth-user.resolver';

type JwtExpiresIn = NonNullable<
  NonNullable<JwtModuleOptions['signOptions']>['expiresIn']
>;

const logger = new Logger('OAuthModule');

type StrategyCtor<T> = new (
  config: ConfigService<EnvironmentVariables, true>,
  resolver: OAuthUserResolver,
) => T;

function configuredProvider<T>(
  token: StrategyCtor<T>,
  providerLabel: string,
  envKeys: readonly [
    'GITHUB_CLIENT_ID' | 'GITLAB_CLIENT_ID' | 'BITBUCKET_CLIENT_ID',
    'GITHUB_CLIENT_SECRET' | 'GITLAB_CLIENT_SECRET' | 'BITBUCKET_CLIENT_SECRET',
    'GITHUB_CALLBACK_URL' | 'GITLAB_CALLBACK_URL' | 'BITBUCKET_CALLBACK_URL',
  ],
): FactoryProvider {
  return {
    provide: token,
    inject: [ConfigService, OAuthUserResolver],
    useFactory: (
      config: ConfigService<EnvironmentVariables, true>,
      resolver: OAuthUserResolver,
    ): T | null => {
      const missing = envKeys.filter((k) => !config.get(k, { infer: true }));
      if (missing.length > 0) {
        logger.warn(
          `${providerLabel} OAuth disabled (missing env: ${missing.join(', ')})`,
        );
        return null;
      }
      return new token(config, resolver);
    },
  };
}

@Module({
  imports: [
    PassportModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not set');
        }
        const expiresIn = (config.get<string>('JWT_EXPIRES_IN') ??
          '7d') as JwtExpiresIn;
        return { secret, signOptions: { expiresIn } };
      },
    }),
  ],
  controllers: [OAuthController],
  providers: [
    OAuthService,
    OAuthUserResolver,
    configuredProvider(GitHubStrategy, 'GitHub', [
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET',
      'GITHUB_CALLBACK_URL',
    ]),
    configuredProvider(GitLabStrategy, 'GitLab', [
      'GITLAB_CLIENT_ID',
      'GITLAB_CLIENT_SECRET',
      'GITLAB_CALLBACK_URL',
    ]),
    configuredProvider(BitbucketStrategy, 'Bitbucket', [
      'BITBUCKET_CLIENT_ID',
      'BITBUCKET_CLIENT_SECRET',
      'BITBUCKET_CALLBACK_URL',
    ]),
  ],
  exports: [OAuthService],
})
export class OAuthModule {}
