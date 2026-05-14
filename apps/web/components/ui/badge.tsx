import type { ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "muted"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "accent";

export type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  size?: BadgeSize;
  className?: string;
}

const toneStyles: Record<BadgeTone, string> = {
  neutral:
    "bg-surface-2/80 text-fg ring-1 ring-border",
  muted:
    "bg-surface-2/60 text-fg-muted ring-1 ring-border",
  success:
    "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  warning:
    "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
  danger:
    "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
  info:
    "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30",
  accent:
    "bg-accent/15 text-accent ring-1 ring-accent/30",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-[0.65rem] px-1.5 py-0.5 tracking-wide",
  md: "text-xs px-2 py-0.5 tracking-wide",
};

export function Badge({
  children,
  tone = "neutral",
  size = "md",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold uppercase ${toneStyles[tone]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}
