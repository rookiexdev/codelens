"use client";

import { useSyncExternalStore } from "react";
import { getAccessToken } from "./auth-storage";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getServerSnapshot(): string | null {
  return null;
}

export function useAccessToken(): string | null {
  return useSyncExternalStore(subscribe, getAccessToken, getServerSnapshot);
}
