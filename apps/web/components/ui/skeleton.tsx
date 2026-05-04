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

export function ProfilePageSkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mb-4 flex items-center gap-2 sm:mb-6">
        <Skeleton className="h-3.5 w-3.5 rounded-sm" />
        <Skeleton className="h-3 w-16" />
        <span className="text-fg-subtle">/</span>
        <Skeleton className="h-3 w-14" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="space-y-5 sm:space-y-6">
          <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="mt-4 h-6 w-2/3" />
            <Skeleton className="mt-2 h-3.5 w-1/3" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <div className="mt-5 space-y-2">
              <SidebarRowSkeleton />
              <SidebarRowSkeleton />
              <SidebarRowSkeleton />
              <SidebarRowSkeleton />
            </div>
            <Skeleton className="mt-5 h-9 w-full rounded-lg" />
          </section>

          <section className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
            <Skeleton className="h-4 w-24" />
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
            <Skeleton className="h-4 w-24" />
            <div className="mt-3 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </section>
        </aside>

        <div className="space-y-5 sm:space-y-6">
          <section className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <ContributionTotalSkeleton />
              <ContributionTotalSkeleton />
              <ContributionTotalSkeleton />
              <ContributionTotalSkeleton />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="mt-4 h-32 w-full rounded-lg sm:h-36" />
          </section>

          <section className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-3 h-20 w-full rounded-xl" />
          </section>

          <section className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
            <Skeleton className="h-5 w-32" />
            <div className="mt-4 space-y-3">
              <ActivityRowSkeleton />
              <ActivityRowSkeleton />
              <ActivityRowSkeleton />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function SidebarRowSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-3.5 w-3.5 rounded-sm" />
      <Skeleton className="h-3.5 w-2/3" />
    </div>
  );
}

function ContributionTotalSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface-2/40 p-3 sm:p-4">
      <Skeleton className="h-3 w-12" />
      <Skeleton className="mt-2 h-6 w-10" />
    </div>
  );
}

function ActivityRowSkeleton() {
  return (
    <div className="flex items-start gap-3">
      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="mt-2 h-3 w-1/3" />
      </div>
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
