import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Provider } from '../../prisma/generated/client';
import { OAuthService } from '../oauth/oauth.service';
import { SelectRepoDto } from './dto/select-repo.dto';
import { Repo, SelectRepoResponse } from './types';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
}

interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  visibility: 'private' | 'internal' | 'public';
  web_url: string;
  default_branch: string | null;
}

interface BitbucketRepo {
  uuid: string;
  name: string;
  full_name: string;
  is_private: boolean;
  links: { html?: { href?: string } };
  mainbranch?: { name?: string } | null;
}

interface BitbucketListResponse {
  values: BitbucketRepo[];
}

@Injectable()
export class ReposService {
  private readonly logger = new Logger(ReposService.name);

  constructor(private readonly oauth: OAuthService) {}

  async listRepos(userId: string, provider: Provider): Promise<Repo[]> {
    const conn = await this.oauth.getConnection(userId, provider);
    if (conn === null) {
      throw new BadRequestException(`${provider} is not connected`);
    }

    switch (provider) {
      case Provider.github:
        return this.fetchGithub(conn.accessToken);
      case Provider.gitlab:
        return this.fetchGitlab(conn.accessToken);
      case Provider.bitbucket:
        return this.fetchBitbucket(conn.accessToken);
    }
  }

  selectRepo(_userId: string, dto: SelectRepoDto): SelectRepoResponse {
    // Sessions aren't persisted yet — the review-submit endpoint (when built)
    // will take repo+provider directly. The opaque ID just gives the review
    // window a stable handle for now.
    return {
      sessionId: randomUUID(),
      provider: dto.provider,
      repoFullName: dto.repoFullName,
    };
  }

  private async fetchGithub(accessToken: string): Promise<Repo[]> {
    const url =
      'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member';
    const data = await this.callProvider<GitHubRepo[]>(
      Provider.github,
      url,
      accessToken,
      { Accept: 'application/vnd.github+json' },
    );
    return data.map((r) => ({
      id: String(r.id),
      name: r.name,
      fullName: r.full_name,
      private: r.private,
      url: r.html_url,
      defaultBranch: r.default_branch,
    }));
  }

  private async fetchGitlab(accessToken: string): Promise<Repo[]> {
    const url =
      'https://gitlab.com/api/v4/projects?membership=true&per_page=100&order_by=updated_at';
    const data = await this.callProvider<GitLabProject[]>(
      Provider.gitlab,
      url,
      accessToken,
    );
    return data.map((p) => ({
      id: String(p.id),
      name: p.name,
      fullName: p.path_with_namespace,
      private: p.visibility !== 'public',
      url: p.web_url,
      defaultBranch: p.default_branch ?? 'main',
    }));
  }

  private async fetchBitbucket(accessToken: string): Promise<Repo[]> {
    const url =
      'https://api.bitbucket.org/2.0/repositories?role=member&pagelen=100&sort=-updated_on';
    const data = await this.callProvider<BitbucketListResponse>(
      Provider.bitbucket,
      url,
      accessToken,
    );
    return data.values.map((r) => ({
      id: r.uuid,
      name: r.name,
      fullName: r.full_name,
      private: r.is_private,
      url: r.links.html?.href ?? '',
      defaultBranch: r.mainbranch?.name ?? 'main',
    }));
  }

  private async callProvider<T>(
    provider: Provider,
    url: string,
    accessToken: string,
    extraHeaders: Record<string, string> = {},
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'codelens-api',
          ...extraHeaders,
        },
      });
    } catch (err) {
      this.logger.error(`${provider} repos: network error`, err as Error);
      throw new BadGatewayException(`Couldn't reach ${provider}`);
    }

    if (response.status === 401 || response.status === 403) {
      throw new UnauthorizedException(
        `${provider} access denied — reconnect with repo access`,
      );
    }
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.error(
        `${provider} repos: ${response.status} ${response.statusText} — ${body.slice(0, 200)}`,
      );
      throw new BadGatewayException(`${provider} responded ${response.status}`);
    }

    return (await response.json()) as T;
  }
}
