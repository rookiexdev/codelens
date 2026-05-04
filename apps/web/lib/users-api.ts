import { api } from "./api";
import type { SocialProvider } from "./social-providers";

export type ActivityType =
  | "user_registered"
  | "user_logged_in"
  | "profile_updated"
  | "username_changed"
  | "social_links_updated"
  | "tech_stack_updated"
  | "status_updated"
  | "status_cleared"
  | "oauth_connected"
  | "oauth_disconnected"
  | "review_created"
  | "review_shared"
  | "badge_awarded"
  | "account_deleted"
  | "account_restored";

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

export interface SocialLinkView {
  provider: SocialProvider;
  url: string;
  label: string | null;
  position: number;
}

export interface BadgeView {
  slug: string;
  name: string;
  description: string;
  iconKey: string;
  tier: BadgeTier | null;
  awardedAt: string;
}

export interface UserStatus {
  emoji: string | null;
  text: string | null;
  busy: boolean;
  expiresAt: string | null;
  updatedAt: string | null;
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
  status: UserStatus | null;
  createdAt: string;
  socialLinks: SocialLinkView[];
  badges: BadgeView[];
}

export interface PrivateUserProfile extends PublicUserProfile {
  email: string;
}

export interface UpdateProfileInput {
  username?: string;
  fullName?: string;
  description?: string;
  company?: string;
  location?: string;
  avatarSeed?: string;
}

export interface ReplaceSocialLinksInput {
  links: Array<{
    provider: SocialProvider;
    url: string;
    label?: string;
  }>;
}

export interface SetStatusInput {
  emoji?: string;
  text?: string;
  busy?: boolean;
  /** ISO string. Null/undefined → never expires. */
  expiresAt?: string | null;
}

export interface ContributionDay {
  day: string;
  count: number;
}

export interface ContributionTotals {
  week: number;
  month: number;
  year: number;
  allTime: number;
}

export interface ContributionsResponse {
  from: string;
  to: string;
  days: ContributionDay[];
  totals: ContributionTotals;
}

export interface ActivityFeedItem {
  id: string;
  type: ActivityType;
  metadata: unknown;
  occurredAt: string;
}

export interface ActivityFeedResponse {
  items: ActivityFeedItem[];
  nextCursor: string | null;
}

/**
 * Service layer for user-facing account endpoints (/users/* plus account-mgmt
 * /auth/* helpers). All calls go through the shared axios instance, which
 * injects the auth header and clears the token on 401.
 */
export const usersApi = {
  async getMe(signal?: AbortSignal): Promise<PrivateUserProfile> {
    const { data } = await api.get<PrivateUserProfile>("/users/me", { signal });
    return data;
  },

  async updateProfile(
    input: UpdateProfileInput,
  ): Promise<PrivateUserProfile> {
    const { data } = await api.patch<PrivateUserProfile>("/users/me", input);
    return data;
  },

  async deleteAccount(): Promise<void> {
    await api.delete("/users/me");
  },

  async verifyPassword(password: string): Promise<void> {
    await api.post("/auth/verify-password", { password });
  },

  async replaceSocialLinks(
    input: ReplaceSocialLinksInput,
  ): Promise<SocialLinkView[]> {
    const { data } = await api.put<SocialLinkView[]>(
      "/users/me/social-links",
      input,
    );
    return data;
  },

  async updateTechStack(techStack: string[]): Promise<string[]> {
    const { data } = await api.put<{ techStack: string[] }>(
      "/users/me/tech-stack",
      { techStack },
    );
    return data.techStack;
  },

  async setStatus(input: SetStatusInput): Promise<UserStatus | null> {
    const { data } = await api.patch<{ status: UserStatus | null }>(
      "/users/me/status",
      input,
    );
    return data.status;
  },

  async clearStatus(): Promise<void> {
    await api.delete("/users/me/status");
  },

  async getPublicProfile(username: string): Promise<PublicUserProfile> {
    const { data } = await api.get<PublicUserProfile>(
      `/users/${encodeURIComponent(username)}`,
    );
    return data;
  },

  async getContributions(
    username: string,
    range?: { from?: Date; to?: Date },
    signal?: AbortSignal,
  ): Promise<ContributionsResponse> {
    const params: Record<string, string> = {};
    if (range?.from) params.from = range.from.toISOString();
    if (range?.to) params.to = range.to.toISOString();
    const { data } = await api.get<ContributionsResponse>(
      `/users/${encodeURIComponent(username)}/contributions`,
      { params, signal },
    );
    return data;
  },

  async getActivity(
    username: string,
    options?: { limit?: number; cursor?: string },
    signal?: AbortSignal,
  ): Promise<ActivityFeedResponse> {
    const params: Record<string, string | number> = {};
    if (options?.limit) params.limit = options.limit;
    if (options?.cursor) params.cursor = options.cursor;
    const { data } = await api.get<ActivityFeedResponse>(
      `/users/${encodeURIComponent(username)}/activity`,
      { params, signal },
    );
    return data;
  },
};
