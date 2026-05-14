"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { clearAccessToken } from "@/lib/auth-storage";
import { useAccessToken } from "@/lib/use-access-token";

export interface UseAuthResult {
  isAuthenticated: boolean;
  token: string | null;
  logout: () => void;
}

export function useAuth(): UseAuthResult {
  const router = useRouter();
  const token = useAccessToken();

  const logout = useCallback((): void => {
    clearAccessToken();
    router.replace("/login");
  }, [router]);

  return {
    isAuthenticated: token !== null,
    token,
    logout,
  };
}
