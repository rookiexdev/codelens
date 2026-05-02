"use client";

import { Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { COMMON_EMOJIS } from "@/lib/status-presets";

interface EmojiPopoverProps {
  value: string | null;
  onChange: (emoji: string) => void;
  /** Optional className applied to the trigger button. */
  className?: string;
  ariaLabel?: string;
}

/**
 * Compact emoji button + popover. Falls back to a smiley icon when no
 * value is set. Click the button to open a small grid of curated emojis,
 * or paste any emoji directly into the linked text field — both work.
 */
export function EmojiPopover({
  value,
  onChange,
  className = "",
  ariaLabel = "Choose emoji",
}: EmojiPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent): void => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface-2/60 text-xl transition hover:border-accent/40 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {value ? (
          <span aria-hidden>{value}</span>
        ) : (
          <Smile
            aria-hidden
            className="h-5 w-5 text-fg-subtle"
            strokeWidth={2}
          />
        )}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Emoji picker"
          className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-72 origin-top-left overflow-hidden rounded-xl border border-border bg-surface/95 p-2 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.5)] backdrop-blur-md"
        >
          <div className="grid grid-cols-8 gap-1">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-label={`Pick emoji ${emoji}`}
                onClick={() => {
                  onChange(emoji);
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-lg transition hover:bg-surface-2/80 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
