"use client";

import { useTheme } from "./theme-provider";
import { THEMES } from "@/lib/theme";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export function ThemeToggle({
  className = "",
  size = "md",
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const swatch = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const padding = size === "sm" ? "p-1" : "p-1.5";
  const gap = size === "sm" ? "gap-0.5" : "gap-1";

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className={`inline-flex items-center ${gap} ${padding} rounded-full border border-border bg-surface/40 backdrop-blur ${className}`}
    >
      {THEMES.map((t) => {
        const active = t.id === theme;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${t.label} theme — ${t.hint}`}
            title={`${t.label} · ${t.hint}`}
            onClick={() => setTheme(t.id)}
            className={`relative inline-flex items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              active
                ? "ring-2 ring-offset-2 ring-offset-bg"
                : "ring-0 hover:scale-110"
            }`}
            style={
              active
                ? ({
                    // ring color uses the swatch itself
                    "--tw-ring-color": t.ring,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <span
              className={`block ${swatch} rounded-full`}
              style={{ backgroundColor: t.swatch }}
            />
          </button>
        );
      })}
    </div>
  );
}
