import type { SVGProps } from "react";

export function Logomark({
  className = "",
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="9"
        fill="currentColor"
        fillOpacity="0.14"
      />
      <rect
        x="2.75"
        y="2.75"
        width="26.5"
        height="26.5"
        rx="8.25"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="1"
      />
      <circle
        cx="13"
        cy="13"
        r="6.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="14.4" cy="11.6" r="2.4" fill="currentColor" />
      <circle cx="11" cy="10.5" r="0.9" fill="currentColor" fillOpacity="0.6" />
      <line
        x1="18"
        y1="18"
        x2="24"
        y2="24"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showWordmark?: boolean;
}

export function Logo({
  className = "",
  iconClassName = "h-8 w-8 text-accent",
  textClassName = "text-base font-semibold tracking-tight text-fg",
  showWordmark = true,
}: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Logomark className={iconClassName} />
      {showWordmark ? <span className={textClassName}>CodeLens</span> : null}
    </span>
  );
}
