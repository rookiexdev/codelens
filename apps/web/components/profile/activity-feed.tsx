"use client";

import {
  Award,
  CircleDot,
  CircleUser,
  Edit3,
  KeyRound,
  Layers,
  Link2,
  LogIn,
  Share2,
  Sparkles,
  Trash2,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { extractApiError } from "@/lib/api";
import {
  usersApi,
  type ActivityFeedItem,
  type ActivityType,
} from "@/lib/users-api";

interface ActivityFeedProps {
  username: string;
  pageSize?: number;
}

const ICONS: Record<ActivityType, LucideIcon> = {
  user_registered: UserPlus,
  user_logged_in: LogIn,
  profile_updated: Edit3,
  username_changed: CircleUser,
  social_links_updated: Link2,
  tech_stack_updated: Layers,
  status_updated: CircleDot,
  status_cleared: CircleDot,
  oauth_connected: KeyRound,
  oauth_disconnected: KeyRound,
  review_created: Sparkles,
  review_shared: Share2,
  badge_awarded: Award,
  account_deleted: Trash2,
  account_restored: UserPlus,
};

const LABELS: Record<ActivityType, string> = {
  user_registered: "Joined CodeLens",
  user_logged_in: "Signed in",
  profile_updated: "Updated profile",
  username_changed: "Changed username",
  social_links_updated: "Updated social links",
  tech_stack_updated: "Updated tech stack",
  status_updated: "Set a status",
  status_cleared: "Cleared status",
  oauth_connected: "Connected an OAuth provider",
  oauth_disconnected: "Disconnected an OAuth provider",
  review_created: "Created a review",
  review_shared: "Shared a review",
  badge_awarded: "Earned a badge",
  account_deleted: "Deleted account",
  account_restored: "Restored account",
};

export function ActivityFeed({ username, pageSize = 5 }: ActivityFeedProps) {
  // Parent must supply key={username} so this component remounts when the
  // viewed user changes — that keeps initial-state simple and avoids
  // cascading setStates inside the effect.
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    usersApi
      .getActivity(username, { limit: pageSize })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setCursor(res.nextCursor);
        setHasMore(Boolean(res.nextCursor));
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiError(err, "Couldn't load activity."));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username, pageSize]);

  const loadMore = async (): Promise<void> => {
    if (!cursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.getActivity(username, {
        limit: pageSize,
        cursor,
      });
      setItems((prev) => [...prev, ...res.items]);
      setCursor(res.nextCursor);
      setHasMore(Boolean(res.nextCursor));
    } catch (err) {
      setError(extractApiError(err, "Couldn't load more activity."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-4 sm:p-6">
      <h2 className="text-base font-bold tracking-tight sm:text-lg">
        Recent activity
      </h2>
      <p className="mt-0.5 text-xs font-medium text-fg-muted sm:text-sm">
        A timeline of what you&apos;ve been up to.
      </p>

      {items.length === 0 && !loading && !error ? (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-surface-2/40 p-4 text-center text-sm font-medium text-fg-muted">
          No activity yet — start a review to see it here.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm font-medium text-danger"
        >
          {error}
        </p>
      ) : null}

      <ol className="mt-4 space-y-2">
        {items.map((item) => {
          const Icon = ICONS[item.type] ?? Sparkles;
          return (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-surface-2/40 px-3 py-2.5 sm:px-4 sm:py-3"
            >
              <span
                aria-hidden
                className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold tracking-tight text-fg">
                  {LABELS[item.type] ?? item.type}
                </p>
                <p className="mt-0.5 text-xs font-medium text-fg-muted">
                  {formatActivityDate(item.occurredAt)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {hasMore ? (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="mt-4 inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-fg transition hover:border-accent/40 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      ) : null}
    </div>
  );
}

function formatActivityDate(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
