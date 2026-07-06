export interface Repo {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  url: string;
  defaultBranch: string;
}

export interface SelectRepoResponse {
  sessionId: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
  repoFullName: string;
}
