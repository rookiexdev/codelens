"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

export type TooltipSide = "top" | "bottom" | "left" | "right";
export type TooltipAlign = "start" | "center" | "end";

interface TooltipProps {
  /** Text or node rendered inside the tooltip bubble. */
  content: ReactNode;
  /** The trigger element(s). Hover/focus on these reveals the tooltip. */
  children: ReactNode;
  /** Which side of the trigger the tooltip appears on. Defaults to "top". */
  side?: TooltipSide;
  /** Cross-axis alignment. Ignored for "left"/"right" (always center). */
  align?: TooltipAlign;
  /** Delay (ms) before showing on hover/focus. */
  delayMs?: number;
  /** When true, the tooltip never shows. */
  disabled?: boolean;
  /** Class applied to the wrapping span around the trigger. */
  className?: string;
  /** Class applied to the floating bubble (override styling). */
  contentClassName?: string;
}

const SIDE_CLASS: Record<TooltipSide, string> = {
  top: "bottom-full mb-2",
  bottom: "top-full mt-2",
  left: "right-full mr-2 top-1/2 -translate-y-1/2",
  right: "left-full ml-2 top-1/2 -translate-y-1/2",
};

const HORIZONTAL_ALIGN: Record<TooltipAlign, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delayMs = 120,
  disabled = false,
  className = "",
  contentClassName = "",
}: TooltipProps): ReactElement {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  const clearTimer = (): void => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const show = (): void => {
    if (disabled) return;
    clearTimer();
    timerRef.current = window.setTimeout(() => setOpen(true), delayMs);
  };

  const hide = (): void => {
    clearTimer();
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => clearTimer(), []);

  const isHorizontal = side === "left" || side === "right";
  const positionClass = `${SIDE_CLASS[side]} ${
    isHorizontal ? "" : HORIZONTAL_ALIGN[align]
  }`;

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={open && !disabled ? id : undefined}
    >
      {children}
      <span
        id={id}
        role="tooltip"
        aria-hidden={!open || disabled}
        className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-fg shadow-lg transition-opacity duration-150 ${positionClass} ${
          open && !disabled ? "opacity-100" : "opacity-0"
        } ${contentClassName}`}
      >
        {content}
      </span>
    </span>
  );
}
