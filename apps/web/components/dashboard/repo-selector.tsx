"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { extractApiError } from "@/lib/api";
import type { OAuthProvider } from "@/lib/oauth-api";
import { listRepos, selectRepo, type Repo } from "@/lib/repos-api";
import { RepoList } from "./repo-list";

interface RepoSelectorProps {
  connectedProviders: readonly OAuthProvider[];
}

type ProviderStatus = "idle" | "loaded" | "error";

interface ProviderState {
  status: ProviderStatus;
  repos: Repo[];
  error: string | null;
}

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
};

function emptyState(): ProviderState {
  return { status: "idle", repos: [], error: null };
}

export function RepoSelector({ connectedProviders }: RepoSelectorProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<OAuthProvider>(
    connectedProviders[0]!,
  );
  const [byProvider, setByProvider] = useState<
    Record<OAuthProvider, ProviderState>
  >({
    github: emptyState(),
    gitlab: emptyState(),
    bitbucket: emptyState(),
  });
  const [query, setQuery] = useState("");
  const [selectingId, setSelectingId] = useState<string | null>(null);

  // Lazy-fetch: when active tab is still 'idle', kick off the request.
  // State mutations all happen in the async .then/.catch callbacks so the
  // effect body itself never calls setState synchronously.
  useEffect(() => {
    if (byProvider[activeTab].status !== "idle") return;
    const ctrl = new AbortController();
    listRepos(activeTab, ctrl.signal)
      .then((repos) => {
        if (ctrl.signal.aborted) return;
        setByProvider((prev) => ({
          ...prev,
          [activeTab]: { status: "loaded", repos, error: null },
        }));
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setByProvider((prev) => ({
          ...prev,
          [activeTab]: {
            status: "error",
            repos: [],
            error: extractApiError(err, "Couldn't load repositories"),
          },
        }));
      });
    return () => ctrl.abort();
  }, [activeTab, byProvider]);

  const current = byProvider[activeTab];
  const filteredRepos = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return current.repos;
    return current.repos.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q),
    );
  }, [current.repos, query]);

  const handleSelect = async (repo: Repo): Promise<void> => {
    setSelectingId(repo.id);
    try {
      const res = await selectRepo({
        provider: activeTab,
        repoFullName: repo.fullName,
        repoId: repo.id,
      });
      const url = `/review?sessionId=${encodeURIComponent(res.sessionId)}&repo=${encodeURIComponent(res.repoFullName)}&provider=${encodeURIComponent(res.provider)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast({
        variant: "error",
        title: "Couldn't open review",
        description: extractApiError(err, "Please try again."),
      });
    } finally {
      setSelectingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold tracking-tight text-fg sm:text-lg">
          Select a repository to review
        </h2>
        <p className="text-xs font-medium text-fg-muted sm:text-sm">
          Pick the repo whose pull requests you want CodeLens to audit.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface/30 p-1">
        {connectedProviders.map((p) => {
          const isActive = activeTab === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setActiveTab(p)}
              aria-pressed={isActive}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                isActive
                  ? "bg-fg text-bg"
                  : "text-fg-muted hover:bg-surface-2/60 hover:text-fg"
              }`}
            >
              {PROVIDER_LABEL[p]}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
          strokeWidth={2}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Filter ${PROVIDER_LABEL[activeTab]} repositories…`}
          aria-label="Filter repositories"
          className="w-full rounded-xl border border-border bg-surface/40 py-2.5 pl-10 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        />
      </div>

      <RepoList
        repos={filteredRepos}
        isLoading={current.status === "idle"}
        error={current.error}
        selectingId={selectingId}
        emptyMessage={
          query.trim().length > 0
            ? "No repositories match that filter"
            : "No repositories found for this provider"
        }
        onSelect={handleSelect}
      />
    </section>
  );
}
