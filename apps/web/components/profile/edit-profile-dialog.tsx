"use client";

import { Layers, Link2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { ProfileForm } from "@/components/profile/profile-form";
import { SocialLinksEditor } from "@/components/profile/social-links-editor";
import { TechStackEditor } from "@/components/profile/tech-stack-editor";
import { Modal } from "@/components/ui/modal";
import type {
  PrivateUserProfile,
  SocialLinkView,
} from "@/lib/users-api";

type Tab = "profile" | "social" | "tech";

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  profile: PrivateUserProfile;
  onProfileSaved: (profile: PrivateUserProfile) => void;
  onSocialLinksSaved: (links: SocialLinkView[]) => void;
  onTechStackSaved: (techStack: string[]) => void;
}

const TABS: ReadonlyArray<{ id: Tab; label: string; icon: typeof UserRound }> =
  [
    { id: "profile", label: "Profile", icon: UserRound },
    { id: "tech", label: "Tech stack", icon: Layers },
    { id: "social", label: "Social links", icon: Link2 },
  ];

export function EditProfileDialog({
  open,
  onClose,
  profile,
  onProfileSaved,
  onSocialLinksSaved,
  onTechStackSaved,
}: EditProfileDialogProps) {
  const [tab, setTab] = useState<Tab>("profile");

  // Reset to the Profile tab whenever the dialog reopens.
  useEffect(() => {
    if (open) setTab("profile");
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Edit profile" size="lg">
      <div className="-mt-1 mb-5 flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2/40 p-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-sm ${
                active
                  ? "bg-surface text-fg shadow-[0_4px_12px_-4px_var(--glow-1)]"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <Icon
                aria-hidden
                className={`h-4 w-4 ${active ? "text-accent" : "text-fg-subtle"}`}
                strokeWidth={2.25}
              />
              {label}
            </button>
          );
        })}
      </div>

      {tab === "profile" ? (
        <ProfileForm profile={profile} onSaved={onProfileSaved} />
      ) : null}

      {tab === "tech" ? (
        <TechStackEditor
          initial={profile.techStack}
          onSaved={onTechStackSaved}
        />
      ) : null}

      {tab === "social" ? (
        <SocialLinksEditor
          initialLinks={profile.socialLinks}
          onSaved={onSocialLinksSaved}
        />
      ) : null}
    </Modal>
  );
}
