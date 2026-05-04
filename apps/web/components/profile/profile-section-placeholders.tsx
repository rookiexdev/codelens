"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Small placeholder shells used by `LazyOnView` to reserve layout for
 * below-the-fold profile sections before the real component mounts. Mirrors
 * the dimensions of the eventual content so there's no visible jump.
 */

export function ContributionGraphPlaceholder() {
  return (
    <section className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="mt-4 h-32 w-full rounded-lg sm:h-36" />
    </section>
  );
}

export function ActivityFeedPlaceholder() {
  return (
    <section className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
      <Skeleton className="h-5 w-32" />
      <div className="mt-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
