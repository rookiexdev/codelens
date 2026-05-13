"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ContributionDay } from "@/lib/users-api";

interface ContributionGraphProps {
  /** Anchor for the displayed range. Defaults to "now". */
  to?: Date;
  /** Total days to render. GitHub renders 53 weeks ≈ 371 days. */
  days?: number;
  /** Sparse list of days that have activity. Gaps are rendered as zero. */
  contributions: ContributionDay[];
}

interface DayCell {
  date: Date;
  iso: string;
  count: number;
}

interface MonthGroup {
  /** Calendar month index (0–11) of the group's first week. */
  month: number;
  label: string;
  weeks: Array<Array<DayCell | null>>;
}

/**
 * GitHub-style daily contribution heatmap with explicit month grouping.
 *
 * Each calendar month is rendered as its own block of Sun-Sat columns; days
 * outside the month within a boundary week become blank cells, so months
 * read visually distinct.
 *
 * Cell colours blend the theme accent into the surface, so the heatmap
 * follows whatever theme is active.
 */
export function ContributionGraph({
  to,
  days = 371,
  contributions,
}: ContributionGraphProps) {
  const [selectedYear, setSelectedYear] = useState<string>("current");

  const yearOptions = useMemo<Array<{ value: string; label: string }>>(() => {
    const baseYear = (to ?? new Date()).getUTCFullYear();
    const opts: Array<{ value: string; label: string }> = [
      { value: "current", label: "Current" },
    ];
    for (let y = baseYear; y >= baseYear - 4; y--) {
      opts.push({ value: String(y), label: String(y) });
    }
    return opts;
  }, [to]);

  const { effectiveAnchor, effectiveDays } = useMemo<{
    effectiveAnchor: Date;
    effectiveDays: number;
  }>(() => {
    if (selectedYear === "current") {
      return { effectiveAnchor: to ?? new Date(), effectiveDays: days };
    }
    const y = parseInt(selectedYear, 10);
    const dec31 = new Date(Date.UTC(y, 11, 31));
    const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    return { effectiveAnchor: dec31, effectiveDays: isLeap ? 366 : 365 };
  }, [selectedYear, to, days]);

  const { groups, total, range } = useMemo(
    () => buildGrid(effectiveAnchor, effectiveDays, contributions),
    [effectiveAnchor, effectiveDays, contributions],
  );

  // Today's count, shown in the tooltip area when nothing is hovered.
  const todayCell = useMemo<DayCell>(() => {
    const today = startOfUtcDay(new Date());
    const iso = formatIsoDate(today);
    const found = contributions.find((c) => c.day.slice(0, 10) === iso);
    return { date: today, iso, count: found?.count ?? 0 };
  }, [contributions]);

  const [hover, setHover] = useState<DayCell | null>(null);

  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight sm:text-lg">
            Contribution activity
          </h2>
          <p className="mt-0.5 text-xs font-medium text-fg-muted sm:text-sm">
            {total} {total === 1 ? "review" : "reviews"} between{" "}
            {formatRange(range.from)} and {formatRange(range.to)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <YearDropdown
            value={selectedYear}
            options={yearOptions}
            onChange={setSelectedYear}
          />
          <Legend />
        </div>
      </div>

      <div className="mt-4 -mx-4 overflow-x-auto px-4 pb-2 sm:mt-5 sm:mx-0 sm:px-0">
        <div className="inline-block min-w-full">
          <div className="flex gap-1">
            <DayAxis />
            <div className="flex flex-col">
              <MonthAxis groups={groups} />
              <div
                role="grid"
                aria-label="Contribution heatmap"
                className="flex gap-2"
              >
                {groups.map((group, idx) => (
                  <div
                    key={`${group.month}-${group.label}-${idx}`}
                    className="flex gap-1"
                  >
                    {group.weeks.map((week, wi) => (
                      <div
                        key={wi}
                        role="row"
                        className="flex flex-col gap-1"
                      >
                        {week.map((cell, di) =>
                          cell ? (
                            <Cell
                              key={cell.iso}
                              cell={cell}
                              onHover={setHover}
                              isHovered={hover?.iso === cell.iso}
                            />
                          ) : (
                            <span
                              key={`${wi}-${di}`}
                              aria-hidden
                              className="h-2.5 w-2.5 rounded-[2px] sm:h-3 sm:w-3"
                            />
                          ),
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 h-5 text-xs font-medium text-fg-muted">
        {hover ? (
          <span>
            <strong className="text-fg">{hover.count}</strong>{" "}
            {hover.count === 1 ? "review" : "reviews"} on{" "}
            <span className="text-fg">{formatTooltip(hover.date)}</span>
          </span>
        ) : (
          <span>
            Today:{" "}
            <strong className="text-fg">{todayCell.count}</strong>{" "}
            {todayCell.count === 1 ? "review" : "reviews"}
          </span>
        )}
      </div>
    </div>
  );
}

function Cell({
  cell,
  onHover,
  isHovered,
}: {
  cell: DayCell;
  onHover: (c: DayCell | null) => void;
  isHovered: boolean;
}) {
  const level = levelFor(cell.count);
  return (
    <button
      type="button"
      role="gridcell"
      aria-label={`${cell.count} reviews on ${formatTooltip(cell.date)}`}
      onMouseEnter={() => onHover(cell)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(cell)}
      onBlur={() => onHover(null)}
      style={cellStyle(level)}
      className={`h-2.5 w-2.5 cursor-pointer rounded-[2px] transition sm:h-3 sm:w-3 ${
        isHovered
          ? "ring-1 ring-accent ring-offset-1 ring-offset-surface"
          : ""
      }`}
    />
  );
}

function YearDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const active = options.find((o) => o.value === value) ?? options[0];

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

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Range: ${active.label}`}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border/70 bg-surface/80 px-3 py-1 text-xs font-semibold text-fg transition hover:border-accent/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-sm"
      >
        {active.label}
        <ChevronDown
          aria-hidden
          className="h-3.5 w-3.5 text-fg-muted"
          strokeWidth={2.25}
        />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label="Year"
          className="absolute right-0 top-full z-50 mt-2 min-w-[8rem] overflow-y-auto rounded-xl border border-border bg-surface/95 p-1.5 shadow-2xl backdrop-blur-md"
        >
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
                    selected
                      ? "bg-accent/15 font-semibold text-accent"
                      : "text-fg hover:bg-surface-2"
                  }`}
                >
                  {o.label}
                  {selected ? (
                    <Check
                      aria-hidden
                      className="ml-auto h-4 w-4"
                      strokeWidth={2.5}
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-1 text-xs font-medium text-fg-muted">
      <span>Less</span>
      {[0, 1, 2, 3, 4].map((level) => (
        <span
          key={level}
          aria-hidden
          style={cellStyle(level)}
          className="h-2.5 w-2.5 rounded-[2px] sm:h-3 sm:w-3"
        />
      ))}
      <span>More</span>
    </div>
  );
}

/**
 * One label per month bucket, sized to the bucket's column-count so the
 * label always sits over its own weeks (and grows the gap between
 * buckets in lockstep with the cells below).
 */
function MonthAxis({ groups }: { groups: MonthGroup[] }) {
  return (
    <div className="mb-1.5 flex gap-2 text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
      {groups.map((g, idx) => (
        <span
          key={`${g.month}-${g.label}-${idx}`}
          // Each week column is 0.75rem wide at sm (h/w-3) with 0.25rem gap
          // (gap-1). Width = 0.75*n + 0.25*(n-1) when n > 0.
          style={{ width: weekColumnsWidth(g.weeks.length) }}
          className="overflow-visible whitespace-nowrap text-center"
        >
          {g.weeks.length >= 2 ? g.label : ""}
        </span>
      ))}
    </div>
  );
}

function weekColumnsWidth(n: number): string {
  if (n <= 0) return "0";
  // 0.75rem cell + 0.25rem gap, only n-1 gaps.
  return `calc(${n} * 0.75rem + ${n - 1} * 0.25rem)`;
}

function DayAxis() {
  const labels = ["", "Mon", "", "Wed", "", "Fri", ""];
  return (
    <div
      className="sticky left-0 z-10 flex flex-col pr-2 text-[10px] font-medium uppercase tracking-wide text-fg-subtle"
    >
      {/* Invisible MonthAxis-shaped spacer so the labels line up with row 0 of the grid. */}
      <div
        aria-hidden
        className="invisible mb-1.5 text-[11px] font-medium uppercase tracking-wide"
      >
        M
      </div>
      <div className="flex flex-col gap-1">
        {labels.map((label, i) => (
          <span
            key={i}
            aria-hidden={!label}
            className="flex h-2.5 items-center sm:h-3"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

const LEVEL_OPACITIES = [0, 0.28, 0.5, 0.72, 1] as const;

function levelFor(count: number): number {
  if (count <= 0) return 0;
  if (count >= 8) return 4;
  if (count >= 5) return 3;
  if (count >= 2) return 2;
  return 1;
}

function cellStyle(level: number): React.CSSProperties {
  if (level === 0) {
    return {
      backgroundColor: "var(--surface-2)",
      boxShadow: "inset 0 0 0 1px var(--border)",
    };
  }
  const pct = Math.round(LEVEL_OPACITIES[level] * 100);
  return {
    backgroundColor: `color-mix(in oklab, var(--accent) ${pct}%, var(--surface-2))`,
  };
}

function buildGrid(
  anchor: Date,
  days: number,
  contributions: ContributionDay[],
): {
  groups: MonthGroup[];
  total: number;
  range: { from: Date; to: Date };
} {
  const counts = new Map<string, number>();
  for (const c of contributions) {
    counts.set(c.day.slice(0, 10), c.count);
  }

  const end = startOfUtcDay(anchor);
  const endDow = end.getUTCDay();
  const endShift = 6 - endDow;
  const gridEnd = addDays(end, endShift);
  const rawStart = addDays(gridEnd, -(days - 1));
  // Snap to the 1st of the start month so the leftmost month block visually
  // begins on its real first day instead of mid-week. Without this, "Current"
  // makes May start on May 4 (Sun) and "2026" makes Jan start on Jan 3 (Sat).
  const start = new Date(
    Date.UTC(rawStart.getUTCFullYear(), rawStart.getUTCMonth(), 1),
  );

  let total = 0;
  const groups: MonthGroup[] = [];

  // Walk one calendar month at a time. Each month renders its own block of
  // Sun-Sat columns; days that fall outside the month within a boundary
  // week are pushed as null so the block visually breaks at month edges.
  let monthCursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1),
  );
  const endMonth = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1),
  );

  while (monthCursor <= endMonth) {
    const year = monthCursor.getUTCFullYear();
    const month = monthCursor.getUTCMonth();
    const monthFirst = new Date(Date.UTC(year, month, 1));
    const monthLast = new Date(Date.UTC(year, month + 1, 0));

    // Clamp the month's drawn span to the visible range.
    const effFirst = monthFirst < start ? start : monthFirst;
    const effLast = monthLast > end ? end : monthLast;

    // Sunday-aligned start, Saturday-aligned end so each column is a full week.
    const firstSun = addDays(effFirst, -effFirst.getUTCDay());
    const lastSat = addDays(effLast, 6 - effLast.getUTCDay());

    const weeks: Array<Array<DayCell | null>> = [];
    let cursor = firstSun;
    while (cursor <= lastSat) {
      const week: Array<DayCell | null> = [];
      for (let row = 0; row < 7; row++) {
        const inMonth =
          cursor.getUTCMonth() === month &&
          cursor.getUTCFullYear() === year;
        const inRange = cursor >= start && cursor <= end;
        if (inMonth && inRange) {
          const iso = formatIsoDate(cursor);
          const count = counts.get(iso) ?? 0;
          total += count;
          week.push({ date: cursor, iso, count });
        } else {
          week.push(null);
        }
        cursor = addDays(cursor, 1);
      }
      weeks.push(week);
    }

    groups.push({
      month,
      label: MONTH_LABELS[month] ?? "",
      weeks,
    });

    monthCursor = new Date(Date.UTC(year, month + 1, 1));
  }

  return { groups, total, range: { from: start, to: end } };
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function formatIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatTooltip(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRange(d: Date): string {
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
