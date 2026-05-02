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

interface DisplayableUser {
  username: string;
  fullName?: string | null;
  email?: string;
}

export function getUserDisplayName(user: DisplayableUser): string {
  const trimmed = user.fullName?.trim();
  if (trimmed && trimmed.length > 0) return trimmed;
  return user.username;
}

/**
 * Two-letter avatar initials. Prefers fullName ("Gopal Sasmal" → "GS").
 * Falls back to two characters of the username, then email local-part.
 */
export function getUserInitials(user: DisplayableUser): string {
  const trimmed = user.fullName?.trim();
  if (trimmed && trimmed.length > 0) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }
  const username = user.username.replace(/[-_]+/g, "");
  if (username.length >= 2) {
    return username.slice(0, 2).toUpperCase();
  }
  if (user.email) {
    const local = user.email.split("@")[0] ?? user.email;
    return local.slice(0, 2).toUpperCase();
  }
  return user.username.slice(0, 2).toUpperCase();
}
