import { Smile } from "lucide-react";
import type { ReactNode } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import type { UserStatus } from "@/lib/users-api";

interface StatusBadgeProps {
  status: UserStatus | null;
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * When provided, the badge becomes a button that fires this callback.
   * Also acts as an always-on entry point — when no status is set we still
   * render a placeholder (smile icon) so the user can click to open the
   * status dialog.
   */
  onClick?: () => void;
  /** Override the tooltip content. Defaults to status text / "Set a status". */
  tooltip?: ReactNode;
}

const SIZE_CLASS: Record<NonNullable<StatusBadgeProps["size"]>, string> = {
  sm: "h-5 w-5 text-xs",
  md: "h-6 w-6 text-sm",
  lg: "h-7 w-7 text-base",
  xl: "h-8 w-8 text-lg",
};

const ICON_SIZE: Record<NonNullable<StatusBadgeProps["size"]>, string> = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
  xl: "h-4 w-4",
};

/**
 * Bubble pinned to the bottom-right of the avatar.
 *
 * Three modes:
 *   1) status set + onClick → button with emoji + tooltip showing the text
 *   2) no status + onClick → button with smile placeholder + "Set a status"
 *   3) no onClick → decorative span (only renders when there's an emoji)
 */
export function StatusBadge({
  status,
  size = "lg",
  onClick,
  tooltip,
}: StatusBadgeProps) {
  const hasEmoji = Boolean(status?.emoji);
  // Decorative read-only mode with no status to show.
  if (!onClick && !hasEmoji) return null;

  const tooltipContent =
    tooltip ?? defaultTooltip(status, Boolean(onClick));

  const wrapperClasses =
    "pointer-events-auto absolute bottom-0 right-0 z-[1] translate-x-1/6 translate-y-1/6";

  const bubbleClasses = `inline-flex items-center justify-center rounded-full border border-border bg-surface text-center leading-none shadow-[0_4px_12px_-4px_var(--glow-1)] ${SIZE_CLASS[size]}`;

  const inner = hasEmoji ? (
    <span className="select-none">{status?.emoji}</span>
  ) : (
    <Smile
      aria-hidden
      className={`text-fg-subtle ${ICON_SIZE[size]}`}
      strokeWidth={2.25}
    />
  );

  if (onClick) {
    return (
      <Tooltip
        content={tooltipContent}
        side="right"
        align="end"
        className={wrapperClasses}
      >
        <button
          type="button"
          aria-label={
            status?.text
              ? `Edit status: ${status.text}`
              : status?.busy
                ? "Edit status"
                : "Set status"
          }
          onClick={onClick}
          className={`${bubbleClasses} cursor-pointer transition hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
        >
          {inner}
        </button>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      content={tooltipContent}
      side="right"
      align="end"
      className={wrapperClasses}
    >
      <span aria-hidden className={bubbleClasses}>
        {inner}
      </span>
    </Tooltip>
  );
}

function defaultTooltip(
  status: UserStatus | null,
  isInteractive: boolean,
): string {
  if (status?.text && status?.busy) return `${status.text} • Busy`;
  if (status?.text) return status.text;
  if (status?.busy) return "Busy";
  return isInteractive ? "Set status" : "";
}
