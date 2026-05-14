"use client";

import { Plug } from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type ComponentType,
  type SVGProps,
} from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { extractApiError } from "@/lib/api";
import {
  disconnectProvider,
  getProviderInitiationUrl,
  listConnections,
  type OAuthConnection,
  type OAuthProvider,
} from "@/lib/oauth-api";
import {
  BitbucketLogo,
  GitHubLogo,
  GitLabLogo,
} from "./provider-icons";

interface ProviderMeta {
  id: OAuthProvider;
  name: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const PROVIDERS: ProviderMeta[] = [
  { id: "github", name: "GitHub", Icon: GitHubLogo },
  { id: "gitlab", name: "GitLab", Icon: GitLabLogo },
  { id: "bitbucket", name: "Bitbucket", Icon: BitbucketLogo },
];

function formatConnectedDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ConnectedProviders() {
  const { toast } = useToast();
  const [connections, setConnections] = useState<OAuthConnection[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<OAuthProvider | null>(null);

  const refetch = useCallback((signal?: AbortSignal): Promise<void> => {
    return listConnections(signal)
      .then((rows) => {
        if (signal?.aborted) return;
        setConnections(rows);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (signal?.aborted) return;
        setLoadError(extractApiError(err, "Couldn't load connected providers"));
      });
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    void refetch(ctrl.signal);
    return () => ctrl.abort();
  }, [refetch]);

  const connectedMap = new Map<OAuthProvider, OAuthConnection>();
  for (const c of connections ?? []) connectedMap.set(c.provider, c);

  const handleConnect = (provider: OAuthProvider): void => {
    window.location.assign(getProviderInitiationUrl(provider));
  };

  const handleDisconnect = async (provider: OAuthProvider): Promise<void> => {
    if (!connections) return;
    const snapshot = connections;
    // Optimistic remove
    setConnections(snapshot.filter((c) => c.provider !== provider));
    setPending(provider);
    try {
      await disconnectProvider(provider);
      toast({
        variant: "success",
        title: "Disconnected",
        description: `${provider} access has been removed.`,
      });
      await refetch();
    } catch (err) {
      setConnections(snapshot);
      toast({
        variant: "error",
        title: "Couldn't disconnect",
        description: extractApiError(err, "Please try again."),
      });
    } finally {
      setPending(null);
      setConfirmTarget(null);
    }
  };

  const isLoading = connections === null && loadError === null;

  return (
    <section>
      <header className="flex flex-col gap-1">
        <h3 className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-fg">
          <Plug aria-hidden className="h-4 w-4 text-accent" strokeWidth={2.25} />
          Connected Git Providers
        </h3>
        <p className="text-xs font-medium text-fg-muted sm:text-sm">
          Link a Git host to import pull requests and run CodeLens reviews.
        </p>
      </header>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? PROVIDERS.map((p) => <ProviderCardSkeleton key={p.id} />)
          : PROVIDERS.map((p) => {
              const conn = connectedMap.get(p.id);
              return (
                <ProviderCard
                  key={p.id}
                  meta={p}
                  connection={conn ?? null}
                  busy={pending === p.id}
                  onConnect={() => handleConnect(p.id)}
                  onDisconnect={() => setConfirmTarget(p.id)}
                />
              );
            })}
      </div>

      {loadError ? (
        <p className="mt-3 text-xs font-medium text-danger" role="alert">
          {loadError}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Disconnect provider?"
        description={
          confirmTarget
            ? `Revoke CodeLens access to your ${confirmTarget} account. You can reconnect any time.`
            : undefined
        }
        confirmLabel="Disconnect"
        cancelLabel="Keep connected"
        tone="danger"
        busy={pending !== null}
        onConfirm={() => {
          if (confirmTarget) void handleDisconnect(confirmTarget);
        }}
        onCancel={() => setConfirmTarget(null)}
      />
    </section>
  );
}

interface ProviderCardProps {
  meta: ProviderMeta;
  connection: OAuthConnection | null;
  busy: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

function ProviderCard({
  meta,
  connection,
  busy,
  onConnect,
  onDisconnect,
}: ProviderCardProps) {
  const { Icon, name } = meta;
  const connected = connection !== null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2/80 ring-1 ring-border"
          >
            <Icon className="h-4 w-4 text-fg" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-fg">
              {name}
            </p>
            {connected ? (
              <p className="truncate text-xs text-fg-muted">
                Since {formatConnectedDate(connection.createdAt)}
              </p>
            ) : null}
          </div>
        </div>
        <StatusBadge connected={connected} />
      </div>

      {connected ? (
        <button
          type="button"
          onClick={onDisconnect}
          disabled={busy}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-xs font-semibold text-danger transition hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
        >
          {busy ? (
            <>
              <Spinner size="xs" tone="muted" label="Working" />
              Disconnecting…
            </>
          ) : (
            "Disconnect"
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onConnect}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-fg px-3 py-2 text-xs font-semibold text-bg transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-sm"
        >
          Connect
        </button>
      )}
    </div>
  );
}

function StatusBadge({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-400 ring-1 ring-emerald-500/30 sm:text-xs">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Connected
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-2/80 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-fg-muted ring-1 ring-border sm:text-xs">
      Not connected
    </span>
  );
}

function ProviderCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  );
}
