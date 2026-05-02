"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Optional larger max width for content-heavy modals. */
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  /**
   * Optional footer area. If omitted, the consumer typically renders its
   * own action row inside `children`.
   */
  footer?: ReactNode;
  /** Disable clicking the overlay/Escape to close — used while saving. */
  busy?: boolean;
}

const SIZE_CLASS: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
};

/**
 * Theme-aware modal shell with focus-trap-light behaviour: locks body
 * scroll, closes on Escape / overlay click. Heavier focus management is
 * delegated to the consumer (auto-focus the relevant input).
 */
export function Modal({
  open,
  title,
  onClose,
  size = "md",
  children,
  footer,
  busy = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[70] flex items-end justify-center px-4 pb-6 pt-12 sm:items-center sm:p-6"
    >
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        disabled={busy}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-bg/70 backdrop-blur-sm overlay-enter disabled:cursor-not-allowed"
      />
      <div
        className={`relative flex w-full ${SIZE_CLASS[size]} max-h-[calc(100dvh-3rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_60px_-20px_rgba(0,0,0,0.55)] dialog-enter`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-base font-bold tracking-tight text-fg sm:text-lg">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            disabled={busy}
            onClick={onClose}
            className="inline-flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-fg-muted transition hover:bg-surface-2/80 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed"
          >
            <X aria-hidden className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          {children}
        </div>

        {footer ? (
          <footer className="flex items-center justify-end gap-2 border-t border-border bg-surface-2/40 px-5 py-3 sm:px-6">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
