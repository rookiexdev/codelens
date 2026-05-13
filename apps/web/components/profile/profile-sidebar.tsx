"use client";

import {
  Building2,
  CalendarDays,
  ExternalLink,
  Layers,
  Link2,
  Mail,
  MapPin,
  Pencil,
  type LucideIcon,
} from "lucide-react";
import { memo } from "react";
import { Avatar } from "@/components/profile/avatar";
import { ProfileBadges } from "@/components/profile/profile-badges";
import { getUserDisplayName } from "@/components/profile/user-context";
import { SOCIAL_PROVIDER_META } from "@/lib/social-providers";
import type { PrivateUserProfile } from "@/lib/users-api";

interface ProfileSidebarProps {
  profile: PrivateUserProfile;
  onEdit: () => void;
  onStatusClick: () => void;
}

function ProfileSidebarImpl({
  profile,
  onEdit,
  onStatusClick,
}: ProfileSidebarProps) {
  const displayName = getUserDisplayName(profile);

  return (
    <aside className="space-y-5 sm:space-y-6">
      <IdentityCard
        profile={profile}
        displayName={displayName}
        onEdit={onEdit}
        onStatusClick={onStatusClick}
      />
      <ProfileBadges earned={profile.badges} />
      <TechStackCard techStack={profile.techStack} />
      <SocialLinksCard socialLinks={profile.socialLinks} />
    </aside>
  );
}

export const ProfileSidebar = memo(ProfileSidebarImpl);

function IdentityCard({
  profile,
  displayName,
  onEdit,
  onStatusClick,
}: {
  profile: PrivateUserProfile;
  displayName: string;
  onEdit: () => void;
  onStatusClick: () => void;
}) {
  const status = profile.status;
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-glow-1 blur-3xl"
      />
      <div className="relative">
        <Avatar
          user={profile}
          size="xl"
          status={status}
          onStatusClick={onStatusClick}
        />

        <h1 className="mt-4 truncate text-xl font-bold tracking-tight sm:text-2xl">
          {displayName}
        </h1>
        <p className="mt-0.5 truncate text-sm font-medium text-fg-muted">
          @{profile.username}
        </p>

        {status?.text || status?.busy ? (
          <p className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-surface-2/60 px-3 py-1 text-xs font-semibold text-fg sm:text-sm">
            {status.emoji ? <span aria-hidden>{status.emoji}</span> : null}
            <span className="truncate">{status.text ?? "Busy"}</span>
            {status.busy && status.text ? (
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
          <SidebarRow icon={Mail} text={profile.email} label="Email" mono />
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
          onClick={onEdit}
          className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-[0.95rem]"
        >
          <Pencil aria-hidden className="h-4 w-4" strokeWidth={2.25} />
          Edit profile
        </button>
      </div>
    </section>
  );
}

function TechStackCard({ techStack }: { techStack: string[] }) {
  return (
    <section className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
      <h2 className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-fg">
        <Layers
          aria-hidden
          className="h-4 w-4 text-accent"
          strokeWidth={2.25}
        />
        Tech stack
      </h2>
      {techStack.length === 0 ? (
        <p className="mt-3 text-xs font-medium text-fg-subtle sm:text-sm">
          No tech listed yet — open Edit profile to add some.
        </p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {techStack.map((tech) => (
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
  );
}

function SocialLinksCard({
  socialLinks,
}: {
  socialLinks: PrivateUserProfile["socialLinks"];
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-6">
      <h2 className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-fg">
        <Link2 aria-hidden className="h-4 w-4 text-accent" strokeWidth={2.25} />
        Social Links
      </h2>
      {socialLinks.length === 0 ? (
        <p className="mt-3 text-xs font-medium text-fg-subtle sm:text-sm">
          No links yet — share where you live online from Edit profile.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {socialLinks.map((link) => (
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
