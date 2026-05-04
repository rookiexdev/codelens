"use client";

import { UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
import { ProfileMain } from "@/components/profile/profile-main";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";
import { StatusDialog } from "@/components/profile/status-dialog";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProfilePageSkeleton } from "@/components/ui/skeleton";
import { extractApiError } from "@/lib/api";
import { useAbortableRequest } from "@/lib/use-abortable-request";
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
  const [profile, setProfile] = useState<PrivateUserProfile | null>(null);
  const [contributions, setContributions] = useState<ContributionDay[]>([]);
  const [totals, setTotals] = useState<Totals>(EMPTY_TOTALS);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [statusOpen, setStatusOpen] = useState<boolean>(false);

  // Reusable, cancel-on-supersede contributions fetcher. If the user saves
  // their profile twice in quick succession the first refresh is aborted
  // before the second begins — only the latest result wins.
  const { run: runContributions } = useAbortableRequest(
    useCallback(
      (signal: AbortSignal, username: string) =>
        usersApi.getContributions(username, undefined, signal),
      [],
    ),
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async (): Promise<void> => {
      try {
        const me = await usersApi.getMe(controller.signal);
        if (cancelled) return;
        setProfile(me);

        // Render the sidebar immediately by exiting the loading state — the
        // contribution graph + activity feed mount lazily and own their own
        // skeletons. Perceived speed > strict full-data loading.
        setLoading(false);

        const res = await runContributions(me.username);
        if (cancelled || !res) return;
        setContributions(res.days);
        setTotals(res.totals);
      } catch (err) {
        if (cancelled) return;
        if (controller.signal.aborted) return;
        setLoadError(extractApiError(err, "Couldn't load your profile."));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [runContributions]);

  const refreshContributions = async (username: string): Promise<void> => {
    const res = await runContributions(username);
    if (!res) return; // aborted or superseded
    setContributions(res.days);
    setTotals(res.totals);
  };

  const handleProfileSaved = (next: PrivateUserProfile): void => {
    setProfile(next);
    void refreshContributions(next.username);
  };

  const handleSocialLinksSaved = (links: SocialLinkView[]): void => {
    setProfile((prev) => (prev ? { ...prev, socialLinks: links } : prev));
  };

  const handleTechStackSaved = (techStack: string[]): void => {
    setProfile((prev) => (prev ? { ...prev, techStack } : prev));
  };

  const handleStatusSaved = (status: UserStatus | null): void => {
    setProfile((prev) => (prev ? { ...prev, status } : prev));
  };

  if (loading) return <ProfilePageSkeleton />;

  if (loadError || !profile) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-sm font-medium text-danger">
          {loadError ?? "Something went wrong loading your profile."}
        </div>
      </main>
    );
  }

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
        <ProfileSidebar
          profile={profile}
          onEdit={() => setEditOpen(true)}
          onStatusClick={() => setStatusOpen(true)}
        />
        <ProfileMain
          username={profile.username}
          totals={totals}
          contributions={contributions}
        />
      </div>

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
    </main>
  );
}
