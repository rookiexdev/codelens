"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProviderButtons } from "@/components/dashboard/provider-buttons";
import { RepoSelector } from "@/components/dashboard/repo-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { extractApiError } from "@/lib/api";
import {
  listConnections,
  type OAuthConnection,
  type OAuthProvider,
} from "@/lib/oauth-api";

export default function DashboardPage() {
  const [connections, setConnections] = useState<OAuthConnection[] | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const repoSelectorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    listConnections(ctrl.signal)
      .then((rows) => {
        if (ctrl.signal.aborted) return;
        setConnections(rows);
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setLoadError(extractApiError(err, "Couldn't load connected providers"));
        setConnections([]);
      });
    return () => ctrl.abort();
  }, []);

  const connectedSet = new Set<OAuthProvider>(
    (connections ?? []).map((c) => c.provider),
  );
  const connectedProviders: OAuthProvider[] = ["github", "gitlab", "bitbucket"]
    .filter((p): p is OAuthProvider => connectedSet.has(p as OAuthProvider));
  const hasConnections = connectedProviders.length > 0;
  const isLoading = connections === null;

  const handleConnectedClick = useCallback((): void => {
    repoSelectorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <header className="mb-6 sm:mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {hasConnections ? "Workspace" : "Get started"}
        </p>
        <h1 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
          {hasConnections
            ? "Pick a repo to review"
            : "Connect your code repository"}
        </h1>
        <p className="mt-2 max-w-prose text-sm text-fg-muted sm:text-base">
          {hasConnections
            ? "Choose a connected provider and select a repository to start a review."
            : "Connect a Git provider to start reviewing pull requests with AI."}
        </p>
      </header>

      {isLoading ? (
        <ProviderButtonsSkeleton />
      ) : (
        <ProviderButtons
          connected={connectedSet}
          onConnectedClick={handleConnectedClick}
        />
      )}

      {loadError ? (
        <p className="mt-3 text-xs font-medium text-danger" role="alert">
          {loadError}
        </p>
      ) : null}

      {hasConnections ? (
        <div ref={repoSelectorRef} className="mt-10 sm:mt-12">
          <RepoSelector connectedProviders={connectedProviders} />
        </div>
      ) : null}
    </main>
  );
}

function ProviderButtonsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface/40 px-5 py-6 sm:py-8"
        >
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="w-full space-y-1.5">
            <Skeleton className="mx-auto h-4 w-20" />
            <Skeleton className="mx-auto h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
