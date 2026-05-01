"use client";

import { ChevronDown, UserRound } from "lucide-react";
import Link from "next/link";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { AuthUser } from "@/lib/api";
import { getUserDisplayName, getUserInitials } from "./user-context";

interface ProfileMenuProps {
  user: AuthUser;
}

function ProfileMenuImpl({ user }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback((): void => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onClick = (e: MouseEvent): void => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Open menu for ${displayName}`}
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-surface/60 p-1 pr-3 text-fg transition hover:border-fg-subtle hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span
          aria-hidden
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[0.7rem] font-bold uppercase tracking-wide text-accent-fg"
        >
          {initials}
        </span>
        <span className="hidden max-w-[10rem] truncate text-sm font-semibold tracking-tight sm:inline">
          {displayName}
        </span>
        <ChevronDown
          aria-hidden
          className={`h-3.5 w-3.5 text-fg-subtle transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2.25}
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Profile menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 origin-top-right overflow-hidden rounded-xl border border-border bg-surface/95 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.5)] backdrop-blur-md menu-enter"
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <span
              aria-hidden
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-bold uppercase tracking-wide text-accent-fg"
            >
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-fg">
                {displayName}
              </p>
              <p className="truncate text-xs font-medium text-fg-muted">
                {user.email}
              </p>
            </div>
          </div>
          <ul className="py-1.5">
            <li>
              <Link
                role="menuitem"
                href="/dashboard/profile"
                onClick={close}
                className="flex cursor-pointer items-center gap-2.5 px-4 py-2 text-sm font-semibold text-fg transition hover:bg-surface-2/80 focus-visible:bg-surface-2/80 focus-visible:outline-none"
              >
                <UserRound
                  aria-hidden
                  className="h-4 w-4 text-fg-muted"
                  strokeWidth={2}
                />
                View profile
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export const ProfileMenu = memo(ProfileMenuImpl);
