"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { useTheme } from "./theme-provider";
import { THEMES, type ThemeMeta } from "@/lib/theme";
import { Tooltip } from "@/components/ui/tooltip";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

interface SizeTokens {
  orb: string;
  chipPad: string;
  containerPad: string;
  gap: string;
}

const SIZE: Record<"sm" | "md", SizeTokens> = {
  sm: { orb: "h-4 w-4", chipPad: "p-1", containerPad: "p-1", gap: "gap-1" },
  md: {
    orb: "h-5 w-5",
    chipPad: "p-1.5",
    containerPad: "p-1.5",
    gap: "gap-1.5",
  },
};

interface IndicatorBox {
  left: number;
  width: number;
  height: number;
  ready: boolean;
}

function orbGradient(t: ThemeMeta): string {
  return `radial-gradient(circle at 30% 25%, ${t.ring} 0%, ${t.swatch} 60%, ${t.swatch} 100%)`;
}

export function ThemeToggle({
  className = "",
  size = "md",
}: ThemeToggleProps): ReactElement {
  const { theme, setTheme } = useTheme();
  const s = SIZE[size];

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [box, setBox] = useState<IndicatorBox>({
    left: 0,
    width: 0,
    height: 0,
    ready: false,
  });
  // increments on every click — used as a key to re-mount the ripple/pulse
  // elements so their CSS animations replay each time
  const [tick, setTick] = useState(0);

  const measure = (): void => {
    const idx = THEMES.findIndex((t) => t.id === theme);
    const el = itemRefs.current[idx];
    const container = containerRef.current;
    if (!el || !container) return;
    const eb = el.getBoundingClientRect();
    const cb = container.getBoundingClientRect();
    setBox({
      left: eb.left - cb.left,
      width: eb.width,
      height: eb.height,
      ready: true,
    });
  };

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  useEffect(() => {
    const onResize = (): void => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  const activeMeta = THEMES.find((t) => t.id === theme);

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label="Color theme"
      className={`relative inline-flex items-center ${s.gap} ${s.containerPad} rounded-full border border-border/70 bg-gradient-to-b from-surface/70 to-surface-2/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_14px_rgba(0,0,0,0.18)] backdrop-blur-md ${className}`}
    >
      {/* sliding selection indicator — animates between positions */}
      {box.ready && activeMeta ? (
        <span
          aria-hidden
          className="theme-indicator-in pointer-events-none absolute top-1/2 rounded-full transition-[left,width] duration-[420ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            left: box.left,
            width: box.width,
            height: box.height,
            background: `radial-gradient(circle at 50% 50%, ${activeMeta.swatch}40 0%, transparent 75%)`,
            boxShadow: `inset 0 0 0 1px ${activeMeta.ring}80, 0 0 16px ${activeMeta.swatch}55`,
          }}
        />
      ) : null}

      {THEMES.map((t, i) => {
        const active = t.id === theme;
        return (
          <Tooltip
            key={t.id}
            content={
              <span className="flex flex-col leading-tight">
                <span className="font-semibold">{t.label}</span>
                <span className="text-fg-muted">{t.hint}</span>
              </span>
            }
            side="bottom"
            delayMs={80}
          >
            <button
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${t.label} theme — ${t.hint}`}
              onClick={() => {
                setTick((n) => n + 1);
                setTheme(t.id);
              }}
              className={`group relative inline-flex cursor-pointer items-center justify-center rounded-full ${s.chipPad} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
            >
              {/* expanding ring ripple — replays whenever `tick` changes for the active orb */}
              {active ? (
                <span
                  key={`ripple-${tick}`}
                  aria-hidden
                  className="theme-orb-ripple pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    border: `2px solid ${t.ring}`,
                  }}
                />
              ) : null}

              {/* the orb — replays the pulse animation when the active theme changes */}
              <span
                key={active ? `pulse-${tick}-${t.id}` : `idle-${t.id}`}
                className={`block ${s.orb} rounded-full ${
                  active
                    ? "theme-orb-pulse"
                    : "transition-transform duration-200 group-hover:scale-110"
                }`}
                style={{
                  background: orbGradient(t),
                  boxShadow:
                    "inset 0 1px 1px rgba(255,255,255,0.32), inset 0 -1px 1px rgba(0,0,0,0.18)",
                }}
              />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
