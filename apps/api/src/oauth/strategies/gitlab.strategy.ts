import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-gitlab2';
import { Provider } from '../../../prisma/generated/client';
import { EnvironmentVariables } from '../../config/env.validation';
import { OAuthUserResolver } from './oauth-user.resolver';
import { OAuthValidatedUser, OAuthVerifyDone } from './types';

@Injectable()
export class GitLabStrategy extends PassportStrategy(Strategy, 'gitlab') {
  constructor(
    config: ConfigService<EnvironmentVariables, true>,
    private readonly resolver: OAuthUserResolver,
  ) {
    super({
      clientID: config.getOrThrow('GITLAB_CLIENT_ID', { infer: true }),
      clientSecret: config.getOrThrow('GITLAB_CLIENT_SECRET', { infer: true }),
      callbackURL: config.getOrThrow('GITLAB_CALLBACK_URL', { infer: true }),
      scope: ['read_user', 'read_api', 'read_repository'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string | undefined,
    profile: Profile,
    done: OAuthVerifyDone,
  ): Promise<void> {
    try {
      const user: OAuthValidatedUser = await this.resolver.resolve(
        Provider.gitlab,
        accessToken,
        refreshToken ?? null,
        profile,
      );
      done(null, user);
    } catch (err) {
      done(err as Error, false);
    }
  }
}
