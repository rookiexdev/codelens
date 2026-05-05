"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

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

interface TooltipPosition {
  top: number;
  left: number;
  transform: string;
}

const GAP = 8;

function computePosition(
  rect: DOMRect,
  side: TooltipSide,
  align: TooltipAlign,
): TooltipPosition {
  if (side === "left") {
    return {
      top: rect.top + rect.height / 2,
      left: rect.left - GAP,
      transform: "translate(-100%, -50%)",
    };
  }
  if (side === "right") {
    return {
      top: rect.top + rect.height / 2,
      left: rect.right + GAP,
      transform: "translate(0, -50%)",
    };
  }

  const top = side === "top" ? rect.top - GAP : rect.bottom + GAP;
  const ty = side === "top" ? "-100%" : "0";

  let left: number;
  let tx: string;
  if (align === "start") {
    left = rect.left;
    tx = "0";
  } else if (align === "end") {
    left = rect.right;
    tx = "-100%";
  } else {
    left = rect.left + rect.width / 2;
    tx = "-50%";
  }

  return { top, left, transform: `translate(${tx}, ${ty})` };
}

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
  const [pos, setPos] = useState<TooltipPosition | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // createPortal must wait until the document is available; SSR has no body.
  useEffect(() => {
    setMounted(true);
  }, []);

  const clearTimer = (): void => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const updatePosition = (): void => {
    const el = triggerRef.current;
    if (!el) return;
    setPos(computePosition(el.getBoundingClientRect(), side, align));
  };

  const show = (): void => {
    if (disabled) return;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      updatePosition();
      setOpen(true);
    }, delayMs);
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
    // Reposition while open: scroll inside any ancestor (capture=true), or
    // window resize, can move the trigger relative to the viewport.
    const onReflow = (): void => updatePosition();
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open, side, align]);

  useEffect(() => () => clearTimer(), []);

  const showBubble = mounted && open && pos !== null && !disabled;

  return (
    <span
      ref={triggerRef}
      className={`inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={showBubble ? id : undefined}
    >
      {children}
      {showBubble
        ? createPortal(
            <span
              id={id}
              role="tooltip"
              className={`pointer-events-none fixed z-[60] whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-fg shadow-lg ${contentClassName}`}
              style={{
                top: pos.top,
                left: pos.left,
                transform: pos.transform,
              }}
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
