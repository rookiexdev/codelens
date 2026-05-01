"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AuthUser } from "@/lib/api";

const UserContext = createContext<AuthUser | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: AuthUser;
  children: ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser(): AuthUser {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within UserProvider");
  }
  return ctx;
}

export function getUserDisplayName(user: AuthUser): string {
  return user.email.split("@")[0] ?? user.email;
}

export function getUserInitials(user: AuthUser): string {
  const local = user.email.split("@")[0] ?? user.email;
  const parts = local.split(/[._\-+]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}
