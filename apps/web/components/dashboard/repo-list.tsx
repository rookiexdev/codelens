"use client";

import { Globe, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { Repo } from "@/lib/repos-api";

interface RepoListProps {
  repos: Repo[];
  isLoading: boolean;
  error: string | null;
  selectingId: string | null;
  emptyMessage?: string;
  onSelect: (repo: Repo) => void;
}

export function RepoList({
  repos,
  isLoading,
  error,
  selectingId,
  emptyMessage = "No repositories found for this provider",
  onSelect,
}: RepoListProps) {
  if (isLoading) {
    return (
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface/40">
        {[0, 1, 2].map((i) => (
          <li key={i} className="px-4 py-3">
            <RepoRowSkeleton />
          </li>
        ))}
      </ul>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger"
      >
        {error}
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface/30 px-4 py-8 text-center text-sm font-medium text-fg-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-surface/40">
      {repos.map((repo) => (
        <li key={repo.id} className="px-4 py-3">
          <RepoRow
            repo={repo}
            busy={selectingId === repo.id}
            onSelect={() => onSelect(repo)}
          />
        </li>
      ))}
    </ul>
  );
}

interface RepoRowProps {
  repo: Repo;
  busy: boolean;
  onSelect: () => void;
}

function RepoRow({ repo, busy, onSelect }: RepoRowProps) {
  const Icon = repo.private ? Lock : Globe;
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-2/80 ring-1 ring-border"
        title={repo.private ? "Private repository" : "Public repository"}
      >
        <Icon className="h-3.5 w-3.5 text-fg-muted" strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm font-medium text-fg">
          {repo.fullName}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Badge tone="muted" size="sm">
            {repo.defaultBranch}
          </Badge>
        </div>
      </div>

      <button
        type="button"
        onClick={onSelect}
        disabled={busy}
        className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-fg px-3 py-1.5 text-xs font-semibold text-bg transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
      >
        {busy ? (
          <>
            <Spinner size="xs" tone="onAccent" label="Opening" />
            Opening…
          </>
        ) : (
          "Select"
        )}
      </button>
    </div>
  );
}

function RepoRowSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-7 w-7 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-16 rounded-full" />
      </div>
      <Skeleton className="h-8 w-16 rounded-lg" />
    </div>
  );
}
