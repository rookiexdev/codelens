"use client";

import { Palette, Settings as SettingsIcon, ShieldAlert, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteAccountDialog } from "@/components/profile/delete-account-dialog";
import { useUser } from "@/components/profile/user-context";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { clearAccessToken } from "@/lib/auth-storage";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const user = useUser();

  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleAccountDeleted = (): void => {
    clearAccessToken();
    toast({
      variant: "success",
      title: "Account deleted",
      description: "We've removed your profile. You can re-register anytime.",
    });
    router.replace("/login");
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <Breadcrumb
        className="mb-4 sm:mb-6"
        homeHref="/dashboard"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings", icon: SettingsIcon },
        ]}
      />

      <div className="space-y-6">
        <section>
          <header className="flex flex-col gap-1">
            <h3 className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-fg">
              <Palette
                aria-hidden
                className="h-4 w-4 text-accent"
                strokeWidth={2.25}
              />
              Appearance
            </h3>
            <p className="text-xs font-medium text-fg-muted sm:text-sm">
              Pick a color theme for your workspace.
            </p>
          </header>
          <div className="mt-3 flex justify-start">
            <ThemeToggle />
          </div>
        </section>

        <hr className="border-border" />

        <section>
          <header className="flex flex-col gap-1">
            <h3 className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-danger">
              <ShieldAlert
                aria-hidden
                className="h-4 w-4"
                strokeWidth={2.25}
              />
              Danger zone
            </h3>
            <p className="text-xs font-medium text-fg-muted sm:text-sm">
              Irreversible actions live here. Tread carefully.
            </p>
          </header>
          <div className="mt-3 flex flex-col gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-danger">
                Delete account
              </p>
              <p className="mt-0.5 text-xs font-medium text-fg-muted sm:text-sm">
                Username + password + a 5-second cooldown gate this. Your
                email is freed for re-registration.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger sm:text-[0.95rem]"
            >
              <Trash2 aria-hidden className="h-4 w-4" strokeWidth={2.25} />
              Delete account
            </button>
          </div>
        </section>
      </div>

      {deleteOpen ? (
        <DeleteAccountDialog
          onClose={() => setDeleteOpen(false)}
          username={user.username}
          email={user.email}
          onDeleted={handleAccountDeleted}
        />
      ) : null}
    </main>
  );
}
