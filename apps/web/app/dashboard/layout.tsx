"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { ProfileMenu } from "@/components/profile/profile-menu";
import { UserProvider } from "@/components/profile/user-context";
import { DashboardSkeleton, SettingsPageSkeleton } from "@/components/ui/skeleton";
import { api, type AuthUser } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth-storage";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    api
      .get<AuthUser>("/auth/me")
      .then(({ data }) => {
        if (cancelled) return;
        setUser(data);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        clearAccessToken();
        router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status !== "ready" || !user) {
    if (pathname?.startsWith("/dashboard/settings")) {
      return <SettingsPageSkeleton />;
    }
    return <DashboardSkeleton />;
  }

  return (
    <UserProvider user={user}>
      <div className="min-h-dvh bg-bg text-fg">
        <header className="border-b border-border bg-bg/60 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
            <Logo href="/dashboard" />
            <ProfileMenu user={user} />
          </div>
        </header>
        {children}
      </div>
    </UserProvider>
  );
}
