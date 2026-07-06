import { api } from "./api";
import type { OAuthProvider } from "./oauth-api";

export interface Repo {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  url: string;
  defaultBranch: string;
}

export interface SelectRepoBody {
  provider: OAuthProvider;
  repoFullName: string;
  repoId: string;
}

export interface SelectRepoResponse {
  sessionId: string;
  provider: OAuthProvider;
  repoFullName: string;
}

export function listRepos(
  provider: OAuthProvider,
  signal?: AbortSignal,
): Promise<Repo[]> {
  return api
    .get<Repo[]>("/repos", { params: { provider }, signal })
    .then((res) => res.data);
}

export function selectRepo(body: SelectRepoBody): Promise<SelectRepoResponse> {
  return api.post<SelectRepoResponse>("/repos/select", body).then((res) => res.data);
}
