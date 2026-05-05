"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { useTheme } from "./theme-provider";
import { THEMES, type ThemeMeta, type ThemeMode } from "@/lib/theme";
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

const DARK_THEMES = THEMES.filter((t) => t.mode === "dark");
const LIGHT_THEMES = THEMES.filter((t) => t.mode === "light");

const ROW_VARIANT: Record<
  ThemeMode,
  { container: string; ariaLabel: string }
> = {
  dark: {
    container:
      "border-zinc-700/50 bg-gradient-to-b from-zinc-900/85 to-zinc-950/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_14px_rgba(0,0,0,0.25)]",
    ariaLabel: "Dark color themes",
  },
  light: {
    container:
      "border-zinc-300/70 bg-gradient-to-b from-white/95 to-zinc-100/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_4px_14px_rgba(0,0,0,0.08)]",
    ariaLabel: "Light color themes",
  },
};

export function ThemeToggle({
  className = "",
  size = "md",
}: ThemeToggleProps): ReactElement {
  return (
    <div className={`flex flex-col items-end gap-2 sm:items-start ${className}`}>
      <ThemeRow themes={DARK_THEMES} variant="dark" size={size} />
      <ThemeRow themes={LIGHT_THEMES} variant="light" size={size} />
    </div>
  );
}

interface ThemeRowProps {
  themes: ThemeMeta[];
  variant: ThemeMode;
  size: "sm" | "md";
}

function ThemeRow({
  themes,
  variant,
  size,
}: ThemeRowProps): ReactElement {
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
  // Increments on every click — used as a key to re-mount the ripple/pulse
  // elements so their CSS animations replay each time.
  const [tick, setTick] = useState(0);

  const activeIdx = themes.findIndex((t) => t.id === theme);
  const activeMeta = activeIdx >= 0 ? themes[activeIdx] : null;

  const measure = (): void => {
    if (activeIdx < 0) {
      setBox((b) => (b.ready ? { ...b, ready: false } : b));
      return;
    }
    const el = itemRefs.current[activeIdx];
    const container = containerRef.current;
    if (!el || !container) return;
    // Each chip is wrapped in a Tooltip <span> that is itself `relative`,
    // so the button's offsetParent isn't the container — `offsetLeft` would
    // give the inset within the tooltip wrapper (always tiny, identical for
    // every chip). Use viewport rects instead, then add scrollLeft so the
    // value stays correct when the pill is horizontally scrolled.
    const eb = el.getBoundingClientRect();
    const cb = container.getBoundingClientRect();
    setBox({
      left: eb.left - cb.left + container.scrollLeft,
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

  const cfg = ROW_VARIANT[variant];

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={cfg.ariaLabel}
      data-mode={variant}
      className={`relative inline-flex max-w-full items-center overflow-x-auto rounded-full border backdrop-blur-md ${s.gap} ${s.containerPad} ${cfg.container}`}
      style={{ maxWidth: "min(100%, calc(100vw - 2rem))" }}
    >
      {/* sliding selection indicator — only renders for the row that owns the active theme */}
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

      {themes.map((t, i) => {
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
              className={`group relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full ${s.chipPad} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
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
