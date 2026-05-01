interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-surface/70 ${className}`}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="border-b border-border bg-bg/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/25">
              <span className="h-2.5 w-2.5 rounded-sm bg-accent/60" />
            </span>
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="rounded-2xl border border-border bg-surface/40 p-6 sm:p-8 lg:p-10">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-7 w-3/4 sm:h-9 sm:w-1/2" />
          <Skeleton className="mt-3 h-4 w-full max-w-prose" />
          <Skeleton className="mt-2 h-4 w-2/3 max-w-prose" />

          <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-2/60 p-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
            <div className="rounded-xl border border-border bg-surface-2/60 p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}

export function FullPageSpinnerSkeleton({ label }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg text-fg-muted">
      <span
        role="status"
        aria-label={label ?? "Loading"}
        className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-accent"
      />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}
