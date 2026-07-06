import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-bitbucket-oauth2';
import { Provider } from '../../../prisma/generated/client';
import { EnvironmentVariables } from '../../config/env.validation';
import { OAuthUserResolver } from './oauth-user.resolver';
import { OAuthValidatedUser, OAuthVerifyDone } from './types';

@Injectable()
export class BitbucketStrategy extends PassportStrategy(Strategy, 'bitbucket') {
  constructor(
    config: ConfigService<EnvironmentVariables, true>,
    private readonly resolver: OAuthUserResolver,
  ) {
    super({
      clientID: config.getOrThrow('BITBUCKET_CLIENT_ID', { infer: true }),
      clientSecret: config.getOrThrow('BITBUCKET_CLIENT_SECRET', {
        infer: true,
      }),
      callbackURL: config.getOrThrow('BITBUCKET_CALLBACK_URL', { infer: true }),
      scope: ['account', 'email', 'repository'],
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
        Provider.bitbucket,
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
