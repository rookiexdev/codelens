/**
 * Mirror of the backend SocialProvider enum + display metadata.
 * Keep ordered by the on-screen group the user expects to find a provider in.
 */
export const SOCIAL_PROVIDERS = [
  // Git hosting
  "github",
  "gitlab",
  "bitbucket",
  // Competitive / coding
  "leetcode",
  "codeforces",
  "hackerrank",
  "codechef",
  "kaggle",
  "codepen",
  // Writing / Q&A
  "stackoverflow",
  "devto",
  "medium",
  "hashnode",
  "substack",
  // Social
  "x",
  "linkedin",
  "threads",
  "mastodon",
  "bluesky",
  "instagram",
  "facebook",
  "reddit",
  "youtube",
  "twitch",
  "telegram",
  "discord",
  // Design portfolios
  "dribbble",
  "behance",
  // Generic
  "website",
  "other",
] as const;

export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

interface SocialProviderMeta {
  label: string;
  /** Compact category label rendered in the dropdown. */
  group: string;
  /** Domain hint shown as a placeholder in the URL input. */
  hint: string;
}

export const SOCIAL_PROVIDER_META: Record<SocialProvider, SocialProviderMeta> = {
  github: { label: "GitHub", group: "Code", hint: "github.com/username" },
  gitlab: { label: "GitLab", group: "Code", hint: "gitlab.com/username" },
  bitbucket: { label: "Bitbucket", group: "Code", hint: "bitbucket.org/username" },
  leetcode: { label: "LeetCode", group: "Practice", hint: "leetcode.com/u/username" },
  codeforces: { label: "Codeforces", group: "Practice", hint: "codeforces.com/profile/username" },
  hackerrank: { label: "HackerRank", group: "Practice", hint: "hackerrank.com/username" },
  codechef: { label: "CodeChef", group: "Practice", hint: "codechef.com/users/username" },
  kaggle: { label: "Kaggle", group: "Practice", hint: "kaggle.com/username" },
  codepen: { label: "CodePen", group: "Practice", hint: "codepen.io/username" },
  stackoverflow: { label: "Stack Overflow", group: "Writing", hint: "stackoverflow.com/users/..." },
  devto: { label: "Dev.to", group: "Writing", hint: "dev.to/username" },
  medium: { label: "Medium", group: "Writing", hint: "medium.com/@username" },
  hashnode: { label: "Hashnode", group: "Writing", hint: "username.hashnode.dev" },
  substack: { label: "Substack", group: "Writing", hint: "username.substack.com" },
  x: { label: "X", group: "Social", hint: "x.com/username" },
  linkedin: { label: "LinkedIn", group: "Social", hint: "linkedin.com/in/username" },
  threads: { label: "Threads", group: "Social", hint: "threads.net/@username" },
  mastodon: { label: "Mastodon", group: "Social", hint: "mastodon.social/@username" },
  bluesky: { label: "Bluesky", group: "Social", hint: "bsky.app/profile/username" },
  instagram: { label: "Instagram", group: "Social", hint: "instagram.com/username" },
  facebook: { label: "Facebook", group: "Social", hint: "facebook.com/username" },
  reddit: { label: "Reddit", group: "Social", hint: "reddit.com/user/username" },
  youtube: { label: "YouTube", group: "Social", hint: "youtube.com/@channel" },
  twitch: { label: "Twitch", group: "Social", hint: "twitch.tv/username" },
  telegram: { label: "Telegram", group: "Social", hint: "t.me/username" },
  discord: { label: "Discord", group: "Social", hint: "discord.com/users/id" },
  dribbble: { label: "Dribbble", group: "Design", hint: "dribbble.com/username" },
  behance: { label: "Behance", group: "Design", hint: "behance.net/username" },
  website: { label: "Website", group: "Other", hint: "yourdomain.com" },
  other: { label: "Other", group: "Other", hint: "https://…" },
};

export const SOCIAL_PROVIDER_GROUPS: ReadonlyArray<{
  group: string;
  providers: SocialProvider[];
}> = (() => {
  const buckets = new Map<string, SocialProvider[]>();
  for (const id of SOCIAL_PROVIDERS) {
    const meta = SOCIAL_PROVIDER_META[id];
    const list = buckets.get(meta.group) ?? [];
    list.push(id);
    buckets.set(meta.group, list);
  }
  return Array.from(buckets.entries()).map(([group, providers]) => ({
    group,
    providers,
  }));
})();
