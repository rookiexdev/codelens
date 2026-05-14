"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  BitbucketLogo,
  GitHubLogo,
  GitLabLogo,
} from "@/components/oauth/provider-icons";
import { InputPanel } from "@/components/review/input-panel";
import { ResultsPanel } from "@/components/review/results-panel";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import type { OAuthProvider } from "@/lib/oauth-api";
import { fetchMockReview } from "@/lib/review-mock";
import type { ReviewReport } from "@/lib/review-types";

interface ReviewClientProps {
  sessionId: string | null;
  repo: string | null;
  provider: string | null;
}

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
};

const PROVIDER_ICON: Record<
  OAuthProvider,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  github: GitHubLogo,
  gitlab: GitLabLogo,
  bitbucket: BitbucketLogo,
};

function isOAuthProvider(value: string | null): value is OAuthProvider {
  return value === "github" || value === "gitlab" || value === "bitbucket";
}

export function ReviewClient({ sessionId, repo, provider }: ReviewClientProps) {
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provId: OAuthProvider | null = isOAuthProvider(provider)
    ? provider
    : null;

  const handleSubmit = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const r = await fetchMockReview();
      setReport(r);
    } catch {
      setError("Couldn't generate review. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!sessionId || !repo || !provId) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg px-6 py-12 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="text-lg font-bold tracking-tight text-fg sm:text-xl">
            Missing review session
          </h1>
          <p className="text-sm text-fg-muted">
            Open this page from the dashboard — it needs <code>sessionId</code>
            , <code>repo</code>, and <code>provider</code> query parameters to
            run a review.
          </p>
        </div>
      </main>
    );
  }

  const ProviderIcon = PROVIDER_ICON[provId];

  return (
    <ProtectedRoute>
      <div className="min-h-dvh bg-bg text-fg">
        <header className="border-b border-border bg-bg/60 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
            <Logo href="/dashboard" />
            <div className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2/80 ring-1 ring-border"
              >
                <ProviderIcon className="h-3.5 w-3.5 text-fg" />
              </span>
              <span className="truncate font-mono text-xs font-semibold text-fg sm:text-sm">
                {repo}
              </span>
              <Badge tone="muted" size="sm">
                {PROVIDER_LABEL[provId]}
              </Badge>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            <section className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
              <InputPanel
                isLoading={isLoading}
                onSubmit={() => void handleSubmit()}
              />
            </section>

            <section>
              <ResultsPanel
                report={report}
                isLoading={isLoading}
                error={error}
              />
            </section>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
