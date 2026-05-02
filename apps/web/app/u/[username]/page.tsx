"use client";

import {
  Award,
  Building2,
  CalendarDays,
  ExternalLink,
  Layers,
  Link2,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ActivityFeed } from "@/components/profile/activity-feed";
import { Avatar } from "@/components/profile/avatar";
import { ContributionGraph } from "@/components/profile/contribution-graph";
import { ContributionTotals } from "@/components/profile/contribution-totals";
import { getUserDisplayName } from "@/components/profile/user-context";
import { Logo } from "@/components/brand/logo";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { extractApiError } from "@/lib/api";
import { SOCIAL_PROVIDER_META } from "@/lib/social-providers";
import {
  usersApi,
  type ContributionDay,
  type ContributionTotals as Totals,
  type PublicUserProfile,
} from "@/lib/users-api";

const EMPTY_TOTALS: Totals = { week: 0, month: 0, year: 0, allTime: 0 };

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username);

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [contributions, setContributions] = useState<ContributionDay[]>([]);
  const [totals, setTotals] = useState<Totals>(EMPTY_TOTALS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      usersApi.getPublicProfile(username),
      usersApi.getContributions(username),
    ])
      .then(([p, c]) => {
        if (cancelled) return;
        setProfile(p);
        setContributions(c.days);
        setTotals(c.totals);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiError(err, "Couldn't load this profile."));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) return <DashboardSkeleton />;

  if (error || !profile) {
    return (
      <div className="min-h-dvh bg-bg text-fg">
        <PublicHeader />
        <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-sm font-medium text-danger">
            {error ?? `No user found at @${username}.`}
          </div>
        </main>
      </div>
    );
  }

  const displayName = getUserDisplayName(profile);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <PublicHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          {/* Left sidebar */}
          <aside className="space-y-5 sm:space-y-6">
            <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-glow-1 blur-3xl"
              />
              <div className="relative">
                <Avatar user={profile} size="xl" status={profile.status} />

                <h1 className="mt-4 truncate text-xl font-bold tracking-tight sm:text-2xl">
                  {displayName}
                </h1>
                <p className="mt-0.5 truncate text-sm font-medium text-fg-muted">
                  @{profile.username}
                </p>

                {profile.status?.text || profile.status?.busy ? (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/60 px-3 py-1 text-xs font-semibold text-fg sm:text-sm">
                    {profile.status.emoji ? (
                      <span aria-hidden>{profile.status.emoji}</span>
                    ) : null}
                    <span className="truncate">
                      {profile.status.text ?? "Busy"}
                    </span>
                    {profile.status.busy && profile.status.text ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-danger">
                        Busy
                      </span>
                    ) : null}
                  </p>
                ) : null}

                {profile.description ? (
                  <p className="mt-4 text-sm font-medium leading-relaxed text-fg-muted">
                    {profile.description}
                  </p>
                ) : null}

                <dl className="mt-5 space-y-2 text-sm font-medium text-fg-muted">
                  {profile.company ? (
                    <SidebarRow
                      icon={Building2}
                      text={profile.company}
                      label="Company"
                    />
                  ) : null}
                  {profile.location ? (
                    <SidebarRow
                      icon={MapPin}
                      text={profile.location}
                      label="Location"
                    />
                  ) : null}
                  <SidebarRow
                    icon={CalendarDays}
                    text={`Joined ${new Date(profile.createdAt).toLocaleDateString(
                      undefined,
                      { month: "short", year: "numeric" },
                    )}`}
                    label="Joined"
                  />
                </dl>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
              <h2 className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-fg">
                <Layers
                  aria-hidden
                  className="h-4 w-4 text-accent"
                  strokeWidth={2.25}
                />
                Tech stack
              </h2>
              {profile.techStack.length === 0 ? (
                <p className="mt-3 text-xs font-medium text-fg-subtle sm:text-sm">
                  Not listed.
                </p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {profile.techStack.map((tech) => (
                    <li
                      key={tech}
                      className="inline-flex items-center rounded-full border border-border bg-surface-2/60 px-2.5 py-0.5 text-xs font-semibold text-fg"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
              <h2 className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-fg">
                <Link2
                  aria-hidden
                  className="h-4 w-4 text-accent"
                  strokeWidth={2.25}
                />
                Social Links
              </h2>
              {profile.socialLinks.length === 0 ? (
                <p className="mt-3 text-xs font-medium text-fg-subtle sm:text-sm">
                  Not listed.
                </p>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {profile.socialLinks.map((link) => (
                    <li key={`${link.provider}-${link.position}`}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 truncate text-sm font-medium text-fg-muted transition hover:text-fg"
                      >
                        <Link2
                          aria-hidden
                          className="h-3.5 w-3.5 shrink-0 text-fg-subtle group-hover:text-accent"
                          strokeWidth={2.25}
                        />
                        <span className="truncate">
                          {link.label ||
                            SOCIAL_PROVIDER_META[link.provider].label}
                        </span>
                        <ExternalLink
                          aria-hidden
                          className="h-3 w-3 shrink-0 text-fg-subtle"
                          strokeWidth={2.25}
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>

          {/* Right main */}
          <div className="space-y-5 sm:space-y-6">
            <ContributionTotals totals={totals} />
            <ContributionGraph contributions={contributions} />

            <section className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
              <header className="flex items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-2 text-base font-bold tracking-tight sm:text-lg">
                  <Award
                    aria-hidden
                    className="h-4 w-4 text-accent"
                    strokeWidth={2.25}
                  />
                  Badges
                </h2>
                {profile.badges.length === 0 ? (
                  <span className="rounded-full border border-border bg-surface-2/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-fg-subtle">
                    Coming soon
                  </span>
                ) : null}
              </header>
              {profile.badges.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-border bg-surface-2/30 p-6 text-center text-sm font-medium text-fg-muted">
                  No badges yet — they&apos;re landing soon.
                </p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {profile.badges.map((badge) => (
                    <li
                      key={badge.slug}
                      title={badge.description}
                      className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
                    >
                      {badge.name}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <ActivityFeed key={profile.username} username={profile.username} />
          </div>
        </div>
      </main>
    </div>
  );
}

function PublicHeader() {
  return (
    <header className="border-b border-border bg-bg/60 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <Logo href="/" />
      </div>
    </header>
  );
}

function SidebarRow({
  icon: Icon,
  text,
  label,
}: {
  icon: LucideIcon;
  text: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon
        aria-hidden
        className="h-3.5 w-3.5 shrink-0 text-fg-subtle"
        strokeWidth={2.25}
      />
      <span className="sr-only">{label}: </span>
      <span className="min-w-0 truncate">{text}</span>
    </div>
  );
}
