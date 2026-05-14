import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Provider } from '../../prisma/generated/client';
import { EnvironmentVariables } from '../config/env.validation';
import { OAuthConnectionMetadata, OAuthService } from './oauth.service';
import { OAuthValidatedUser } from './strategies/types';

interface OAuthRequest extends Request {
  user?: OAuthValidatedUser;
}

@Controller('oauth')
export class OAuthController {
  constructor(
    private readonly oauth: OAuthService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubLogin(): void {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(
    @Req() req: OAuthRequest,
    @Res() res: Response,
  ): Promise<void> {
    await this.completeOAuth(req, res);
  }

  @Get('gitlab')
  @UseGuards(AuthGuard('gitlab'))
  gitlabLogin(): void {}

  @Get('gitlab/callback')
  @UseGuards(AuthGuard('gitlab'))
  async gitlabCallback(
    @Req() req: OAuthRequest,
    @Res() res: Response,
  ): Promise<void> {
    await this.completeOAuth(req, res);
  }

  @Get('bitbucket')
  @UseGuards(AuthGuard('bitbucket'))
  bitbucketLogin(): void {}

  @Get('bitbucket/callback')
  @UseGuards(AuthGuard('bitbucket'))
  async bitbucketCallback(
    @Req() req: OAuthRequest,
    @Res() res: Response,
  ): Promise<void> {
    await this.completeOAuth(req, res);
  }

  @Get('connections')
  @UseGuards(JwtAuthGuard)
  listConnections(
    @CurrentUser() user: AuthUser,
  ): Promise<OAuthConnectionMetadata[]> {
    return this.oauth.listConnections(user.id);
  }

  @Delete('connections/:provider')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConnection(
    @CurrentUser() user: AuthUser,
    @Param('provider', new ParseEnumPipe(Provider)) provider: Provider,
  ): Promise<void> {
    await this.oauth.deleteConnection(user.id, provider);
  }

  private async completeOAuth(req: OAuthRequest, res: Response): Promise<void> {
    const frontend = this.config.get('FRONTEND_URL', { infer: true });
    const user: OAuthValidatedUser | undefined = req.user;
    if (!user) {
      res.redirect(`${frontend}/oauth/error`);
      return;
    }

    const token = await this.oauth.handleOAuthCallback(
      user.userId,
      user.provider,
      user.accessToken,
      user.refreshToken,
      null,
    );

    res.redirect(`${frontend}/oauth/success?token=${token}`);
  }
}
