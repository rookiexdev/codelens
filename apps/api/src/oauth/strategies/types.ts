import { Provider } from '../../../prisma/generated/client';

export interface OAuthProfileEmail {
  value: string;
  primary?: boolean;
  verified?: boolean;
}

export interface OAuthProfile {
  id: string;
  displayName?: string;
  username?: string;
  emails?: OAuthProfileEmail[];
  photos?: { value: string }[];
  provider?: string;
  _json?: unknown;
}

export interface OAuthValidatedUser {
  userId: string;
  provider: Provider;
  email: string;
  accessToken: string;
  refreshToken: string | null;
}

export type OAuthVerifyDone = (
  err: Error | null,
  user?: OAuthValidatedUser | false,
) => void;
