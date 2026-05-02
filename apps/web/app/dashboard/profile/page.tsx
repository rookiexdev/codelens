"use client";

import {
  Award,
  Building2,
  CalendarDays,
  ExternalLink,
  Layers,
  Link2,
  LogOut,
  MapPin,
  Mail,
  Palette,
  Pencil,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActivityFeed } from "@/components/profile/activity-feed";
import { Avatar } from "@/components/profile/avatar";
import { ContributionGraph } from "@/components/profile/contribution-graph";
import { ContributionTotals } from "@/components/profile/contribution-totals";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
import { StatusDialog } from "@/components/profile/status-dialog";
import { getUserDisplayName } from "@/components/profile/user-context";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { extractApiError } from "@/lib/api";
import { clearAccessToken } from "@/lib/auth-storage";
import { SOCIAL_PROVIDER_META } from "@/lib/social-providers";
import {
  usersApi,
  type ContributionDay,
  type ContributionTotals as Totals,
  type PrivateUserProfile,
  type SocialLinkView,
  type UserStatus,
} from "@/lib/users-api";

const EMPTY_TOTALS: Totals = { week: 0, month: 0, year: 0, allTime: 0 };

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<PrivateUserProfile | null>(null);
  const [contributions, setContributions] = useState<ContributionDay[]>([]);
  const [totals, setTotals] = useState<Totals>(EMPTY_TOTALS);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [statusOpen, setStatusOpen] = useState<boolean>(false);
  const [signOutOpen, setSignOutOpen] = useState<boolean>(false);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    usersApi
      .getMe()
      .then(async (me) => {
        if (cancelled) return;
        setProfile(me);
        const res = await usersApi.getContributions(me.username);
        if (cancelled) return;
        setContributions(res.days);
        setTotals(res.totals);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(extractApiError(err, "Couldn't load your profile."));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshContributions = async (username: string): Promise<void> => {
    try {
      const res = await usersApi.getContributions(username);
      setContributions(res.days);
      setTotals(res.totals);
    } catch {
      // Silent — heatmap stays as-is.
    }
  };

  const handleProfileSaved = (next: PrivateUserProfile): void => {
    setProfile(next);
    void refreshContributions(next.username);
  };

  const handleSocialLinksSaved = (links: SocialLinkView[]): void => {
    setProfile((prev) =>
      prev ? { ...prev, socialLinks: links } : prev,
    );
  };

  const handleTechStackSaved = (techStack: string[]): void => {
    setProfile((prev) => (prev ? { ...prev, techStack } : prev));
  };

  const handleStatusSaved = (status: UserStatus | null): void => {
    setProfile((prev) => (prev ? { ...prev, status } : prev));
  };

  const handleSignOut = (): void => {
    clearAccessToken();
    toast({
      variant: "success",
      title: "Signed out",
      description: "You've been logged out of your workspace.",
    });
    router.replace("/login");
  };

  const handleDelete = async (): Promise<void> => {
    setDeleting(true);
    try {
      await usersApi.deleteAccount();
      clearAccessToken();
      toast({
        variant: "success",
        title: "Account deleted",
        description: "We've removed your profile. You can re-register anytime.",
      });
      router.replace("/login");
    } catch (err) {
      toast({
        variant: "error",
        title: "Couldn't delete your account",
        description: extractApiError(err, "Please try again."),
      });
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (loadError || !profile) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-sm font-medium text-danger">
          {loadError ?? "Something went wrong loading your profile."}
        </div>
      </main>
    );
  }

  const displayName = getUserDisplayName(profile);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <Breadcrumb
        className="mb-4 sm:mb-6"
        homeHref="/dashboard"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Profile", icon: UserRound },
        ]}
      />

      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        {/* ────────────────────────  LEFT SIDEBAR  ──────────────────────── */}
        <aside className="space-y-5 sm:space-y-6">
          <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-glow-1 blur-3xl"
            />
            <div className="relative">
              <Avatar
                user={profile}
                size="xl"
                status={profile.status}
                onStatusClick={() => setStatusOpen(true)}
              />

              <h1 className="mt-4 truncate text-xl font-bold tracking-tight sm:text-2xl">
                {displayName}
              </h1>
              <p className="mt-0.5 truncate text-sm font-medium text-fg-muted">
                @{profile.username}
              </p>

              {profile.status?.text || profile.status?.busy ? (
                <p className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-surface-2/60 px-3 py-1 text-xs font-semibold text-fg sm:text-sm">
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
                  icon={Mail}
                  text={profile.email}
                  label="Email"
                  mono
                />
                <SidebarRow
                  icon={CalendarDays}
                  text={`Joined ${new Date(profile.createdAt).toLocaleDateString(
                    undefined,
                    { month: "short", year: "numeric" },
                  )}`}
                  label="Joined"
                />
              </dl>

              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-[0.95rem]"
              >
                <Pencil aria-hidden className="h-4 w-4" strokeWidth={2.25} />
                Edit profile
              </button>
            </div>
          </section>

          {/* Tech stack */}
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
                No tech listed yet — open Edit profile to add some.
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

          {/* Social links */}
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
                No links yet — share where you live online from Edit profile.
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
                        {link.label || SOCIAL_PROVIDER_META[link.provider].label}
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

        {/* ────────────────────────  RIGHT MAIN  ──────────────────────── */}
        <div className="space-y-5 sm:space-y-6">
          <ContributionTotals totals={totals} />
          <ContributionGraph contributions={contributions} />

          {/* Badges placeholder */}
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
              <span className="rounded-full border border-border bg-surface-2/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-fg-subtle">
                Coming soon
              </span>
            </header>
            <p className="mt-3 rounded-xl border border-dashed border-border bg-surface-2/30 p-6 text-center text-sm font-medium text-fg-muted">
              Earn badges by reviewing code, sharing reads, and showing up.
              The system is on its way.
            </p>
          </section>

          <ActivityFeed key={profile.username} username={profile.username} />

          {/* Appearance + danger zone collapse to the right column on lg+ */}
          <section className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div>
                <h2 className="inline-flex items-center gap-2 text-base font-bold tracking-tight sm:text-lg">
                  <Palette
                    aria-hidden
                    className="h-4 w-4 text-accent"
                    strokeWidth={2.25}
                  />
                  Appearance
                </h2>
                <p className="mt-1 text-sm font-medium text-fg-muted">
                  Pick a color theme for your workspace.
                </p>
              </div>
              <ThemeToggle />
            </div>
          </section>

          <section className="rounded-2xl border border-danger/30 bg-danger/5 p-5 sm:p-6">
            <h2 className="inline-flex items-center gap-2 text-base font-bold tracking-tight sm:text-lg">
              <Trash2
                aria-hidden
                className="h-4 w-4 text-danger"
                strokeWidth={2.25}
              />
              Danger zone
            </h2>
            <p className="mt-1 text-sm font-medium text-fg-muted">
              Irreversible actions live here. Tread carefully.
            </p>
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-border bg-surface/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold tracking-tight text-fg sm:text-[0.95rem]">
                  Sign out
                </p>
                <p className="mt-0.5 text-xs font-medium text-fg-muted sm:text-sm">
                  You&apos;ll need to sign back in to access your workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSignOutOpen(true)}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg transition hover:border-fg-subtle sm:text-[0.95rem]"
              >
                <LogOut
                  aria-hidden
                  className="h-4 w-4"
                  strokeWidth={2.25}
                />
                Sign out
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold tracking-tight text-danger sm:text-[0.95rem]">
                  Delete account
                </p>
                <p className="mt-0.5 text-xs font-medium text-fg-muted sm:text-sm">
                  Soft-deletes your profile. Your username + email are freed
                  for re-registration.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger sm:text-[0.95rem]"
              >
                <Trash2
                  aria-hidden
                  className="h-4 w-4"
                  strokeWidth={2.25}
                />
                Delete account
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Modals */}
      <EditProfileDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
        onProfileSaved={handleProfileSaved}
        onSocialLinksSaved={handleSocialLinksSaved}
        onTechStackSaved={handleTechStackSaved}
      />
      <StatusDialog
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        current={profile.status}
        onSaved={handleStatusSaved}
      />
      <ConfirmDialog
        open={signOutOpen}
        title="Sign out of CodeLens?"
        description="You'll need to sign back in to access your workspace. Any unsaved drafts will stay where they are."
        confirmLabel="Yes, sign out"
        cancelLabel="Stay signed in"
        tone="danger"
        onConfirm={handleSignOut}
        onCancel={() => setSignOutOpen(false)}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="Delete your CodeLens account?"
        description={`This soft-deletes @${profile.username}. Your reviews, social links, and activity log are kept but hidden. You can re-register with ${profile.email} later.`}
        confirmLabel="Yes, delete my account"
        cancelLabel="Keep my account"
        tone="danger"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </main>
  );
}

function SidebarRow({
  icon: Icon,
  text,
  label,
  mono = false,
}: {
  icon: LucideIcon;
  text: string;
  label: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon
        aria-hidden
        className="h-3.5 w-3.5 shrink-0 text-fg-subtle"
        strokeWidth={2.25}
      />
      <span className="sr-only">{label}: </span>
      <span className={`min-w-0 truncate ${mono ? "font-mono text-xs" : ""}`}>
        {text}
      </span>
    </div>
  );
}
