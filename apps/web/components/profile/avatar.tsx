import type { UserStatus } from "@/lib/users-api";
import { StatusBadge } from "./status-badge";
import { getUserInitials } from "./user-context";

interface AvatarProps {
  user: {
    username: string;
    fullName?: string | null;
    email?: string;
    avatarSeed?: string | null;
    avatarUrl?: string | null;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** When supplied, an emoji bubble is overlaid on the bottom-right. */
  status?: UserStatus | null;
  /**
   * When provided, the status bubble becomes a button that opens the
   * status editor. The bubble is then always rendered (including a smile
   * placeholder when no status is set) so the entry point is consistent.
   */
  onStatusClick?: () => void;
}

const SIZES: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-9 w-9 text-[0.7rem]",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base sm:h-20 sm:w-20 sm:text-lg",
  xl: "h-20 w-20 text-lg sm:h-24 sm:w-24 sm:text-xl",
};

const BADGE_SIZE: Record<
  NonNullable<AvatarProps["size"]>,
  "sm" | "md" | "lg" | "xl"
> = {
  sm: "sm",
  md: "sm",
  lg: "md",
  xl: "lg",
};

export function Avatar({
  user,
  size = "lg",
  className = "",
  status = null,
  onStatusClick,
}: AvatarProps) {
  const initials = getUserInitials(user);
  const sizeClasses = SIZES[size];
  const badgeSize = BADGE_SIZE[size];

  if (user.avatarUrl) {
    return (
      <span
        className={`relative inline-flex shrink-0 overflow-visible rounded-full ${sizeClasses} ${className}`}
      >
        <span className="absolute inset-0 overflow-hidden rounded-full ring-2 ring-accent/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatarUrl}
            alt={`${initials} avatar`}
            className="h-full w-full object-cover"
          />
        </span>
        <StatusBadge
          status={status}
          size={badgeSize}
          onClick={onStatusClick}
        />
      </span>
    );
  }

  const hue = user.avatarSeed ? hueFromSeed(user.avatarSeed) : 0;
  return (
    <span
      className={`relative inline-flex shrink-0 select-none items-center justify-center rounded-full ${sizeClasses} ${className}`}
    >
      <span
        aria-hidden
        style={{ filter: hue ? `hue-rotate(${hue}deg)` : undefined }}
        className="absolute inset-0 inline-flex items-center justify-center rounded-full bg-accent font-bold uppercase tracking-wide text-accent-fg ring-2 ring-accent/40 shadow-[0_8px_24px_-12px_var(--glow-1)]"
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-gradient-to-br from-white/15 via-transparent to-black/10"
        />
        <span className="relative">{initials}</span>
      </span>
      <StatusBadge
        status={status}
        size={badgeSize}
        onClick={onStatusClick}
      />
    </span>
  );
}

function hueFromSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return ((hash >>> 0) % 121) - 60;
}
