import { api } from "./api";

export type OAuthProvider = "github" | "gitlab" | "bitbucket";

export interface OAuthConnection {
  id: string;
  provider: OAuthProvider;
  scope: string | null;
  createdAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function listConnections(signal?: AbortSignal): Promise<OAuthConnection[]> {
  return api
    .get<OAuthConnection[]>("/oauth/connections", { signal })
    .then((res) => res.data);
}

export function disconnectProvider(provider: OAuthProvider): Promise<void> {
  return api
    .delete(`/oauth/connections/${provider}`)
    .then(() => undefined);
}

export function getProviderInitiationUrl(provider: OAuthProvider): string {
  return `${API_BASE}/oauth/${provider}`;
}
