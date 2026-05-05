"use client";

import { Check, Palette } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { useTheme } from "./theme-provider";
import { THEMES, type ThemeId, type ThemeMeta } from "@/lib/theme";

interface ThemeDropdownProps {
  className?: string;
  /** Where the menu opens relative to the trigger. Defaults to "right". */
  align?: "left" | "right";
}

const DARK_THEMES = THEMES.filter((t) => t.mode === "dark");
const LIGHT_THEMES = THEMES.filter((t) => t.mode === "light");

function orbGradient(t: ThemeMeta): string {
  return `radial-gradient(circle at 30% 25%, ${t.ring} 0%, ${t.swatch} 60%, ${t.swatch} 100%)`;
}

export function ThemeDropdown({
  className = "",
  align = "right",
}: ThemeDropdownProps): ReactElement {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const active = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent): void => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handlePick = (id: ThemeId): void => {
    setTheme(id);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Color theme: ${active.label}`}
        title={`${active.label} — ${active.hint}`}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border/70 bg-gradient-to-b from-surface/80 to-surface-2/50 px-2.5 py-1.5 text-xs font-semibold text-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_14px_rgba(0,0,0,0.18)] backdrop-blur-md transition hover:border-accent/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-sm"
      >
        <Palette
          aria-hidden
          className="h-4 w-4 text-accent"
          strokeWidth={2.25}
        />
        <span
          aria-hidden
          className="block h-3.5 w-3.5 rounded-full ring-1 ring-border/60"
          style={{
            background: orbGradient(active),
            boxShadow:
              "inset 0 1px 1px rgba(255,255,255,0.32), inset 0 -1px 1px rgba(0,0,0,0.18)",
          }}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Color theme"
          className={`menu-enter absolute top-full z-50 mt-2 max-h-[min(80vh,28rem)] w-64 overflow-y-auto rounded-xl border border-border bg-surface/95 p-2 shadow-2xl backdrop-blur-md ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <Section
            label="Dark"
            themes={DARK_THEMES}
            active={theme}
            onPick={handlePick}
          />
          <hr className="my-1.5 border-border" />
          <Section
            label="Light"
            themes={LIGHT_THEMES}
            active={theme}
            onPick={handlePick}
          />
        </div>
      ) : null}
    </div>
  );
}

interface SectionProps {
  label: string;
  themes: ThemeMeta[];
  active: ThemeId;
  onPick: (id: ThemeId) => void;
}

function Section({
  label,
  themes,
  active,
  onPick,
}: SectionProps): ReactElement {
  return (
    <div>
      <div className="px-2 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">
        {label}
      </div>
      <ul className="space-y-0.5">
        {themes.map((t) => {
          const isActive = t.id === active;
          return (
            <li key={t.id}>
              <button
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => onPick(t.id)}
                className={`group flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition ${
                  isActive
                    ? "bg-accent/15"
                    : "hover:bg-surface-2"
                }`}
              >
                <span
                  aria-hidden
                  className="block h-4 w-4 shrink-0 rounded-full"
                  style={{
                    background: orbGradient(t),
                    boxShadow: `inset 0 1px 1px rgba(255,255,255,0.32), inset 0 -1px 1px rgba(0,0,0,0.18), 0 0 0 1px ${t.ring}40`,
                  }}
                />
                <span className="flex min-w-0 flex-col leading-tight">
                  <span
                    className={`truncate text-sm font-semibold ${
                      isActive ? "text-accent" : "text-fg"
                    }`}
                  >
                    {t.label}
                  </span>
                  <span className="truncate text-[11px] font-medium text-fg-muted">
                    {t.hint}
                  </span>
                </span>
                {isActive ? (
                  <Check
                    aria-hidden
                    className="ml-auto h-4 w-4 shrink-0 text-accent"
                    strokeWidth={2.5}
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
