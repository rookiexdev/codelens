"use client";

import { useEffect, useRef } from "react";
import { Spinner } from "./spinner";

export type ConfirmTone = "default" | "danger";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = window.setTimeout(() => confirmBtnRef.current?.focus(), 0);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  const confirmBase =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:text-[0.95rem]";

  const confirmTone =
    tone === "danger"
      ? "bg-danger text-bg hover:opacity-90 focus-visible:outline-danger"
      : "bg-accent text-accent-fg hover:bg-accent-hover focus-visible:outline-accent";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={description ? "confirm-dialog-desc" : undefined}
      className="fixed inset-0 z-[70] flex items-end justify-center px-4 pb-6 pt-12 sm:items-center sm:p-6"
    >
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={() => {
          if (!busy) onCancel();
        }}
        className="absolute inset-0 cursor-default bg-bg/70 backdrop-blur-sm overlay-enter"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.55)] sm:p-6 dialog-enter">
        <h2
          id="confirm-dialog-title"
          className="text-base font-semibold tracking-tight text-fg sm:text-lg"
        >
          {title}
        </h2>
        {description ? (
          <p
            id="confirm-dialog-desc"
            className="mt-2 text-sm leading-relaxed text-fg-muted"
          >
            {description}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-border bg-surface-2/60 px-4 py-2 text-sm font-medium text-fg transition hover:border-fg-subtle hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 sm:text-[0.95rem]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmBtnRef}
            onClick={onConfirm}
            disabled={busy}
            className={`${confirmBase} ${confirmTone}`}
          >
            {busy ? (
              <>
                <Spinner size="sm" tone="onAccent" label="Working" />
                Working…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
