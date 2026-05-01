const sizeMap = {
  xs: "h-3 w-3 border-2",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-[3px]",
  lg: "h-10 w-10 border-[3px]",
} as const;

const toneMap = {
  default: "border-border border-t-accent",
  onAccent: "border-accent-fg/25 border-t-accent-fg",
  muted: "border-border border-t-fg-muted",
} as const;

interface SpinnerProps {
  size?: keyof typeof sizeMap;
  tone?: keyof typeof toneMap;
  className?: string;
  label?: string;
}

export function Spinner({
  size = "md",
  tone = "default",
  className = "",
  label = "Loading",
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full ${sizeMap[size]} ${toneMap[tone]} ${className}`}
    />
  );
}
