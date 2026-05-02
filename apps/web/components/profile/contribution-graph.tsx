"use client";

import { useMemo, useState } from "react";
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
 * Weeks are rendered as 7-row columns. Weeks are bucketed by the calendar
 * month of their first day, and an additional horizontal gap is rendered
 * between buckets so months read visually distinct.
 *
 * Cell colours blend the theme accent into the surface, so the heatmap
 * follows whatever theme is active.
 */
export function ContributionGraph({
  to,
  days = 371,
  contributions,
}: ContributionGraphProps) {
  const { groups, total, range } = useMemo(
    () => buildGrid(to ?? new Date(), days, contributions),
    [to, days, contributions],
  );

  const [hover, setHover] = useState<DayCell | null>(null);

  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-4 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight sm:text-lg">
            Contribution activity
          </h2>
          <p className="mt-0.5 text-xs font-medium text-fg-muted sm:text-sm">
            {total} {total === 1 ? "review" : "reviews"} between{" "}
            {formatRange(range.from)} and {formatRange(range.to)}
          </p>
        </div>
        <Legend />
      </div>

      <div className="mt-4 -mx-4 overflow-x-auto px-4 sm:mt-5 sm:mx-0 sm:px-0">
        <div className="inline-block min-w-full">
          <div className="flex gap-1.5">
            <DayAxis />
            <div className="flex flex-col">
              <MonthAxis groups={groups} />
              <div
                role="grid"
                aria-label="Contribution heatmap"
                className="flex gap-3"
              >
                {groups.map((group) => (
                  <div
                    key={`${group.month}-${group.label}`}
                    className="flex gap-1.5"
                  >
                    {group.weeks.map((week, wi) => (
                      <div
                        key={wi}
                        role="row"
                        className="flex flex-col gap-1.5"
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
                              className="h-3 w-3 rounded-[3px] sm:h-3.5 sm:w-3.5"
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
        ) : null}
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
      className={`h-3 w-3 rounded-[3px] transition sm:h-3.5 sm:w-3.5 ${
        isHovered
          ? "ring-1 ring-accent ring-offset-1 ring-offset-surface"
          : ""
      }`}
    />
  );
}

function Legend() {
  return (
    <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-fg-muted sm:mt-0">
      <span>Less</span>
      {[0, 1, 2, 3, 4].map((level) => (
        <span
          key={level}
          aria-hidden
          style={cellStyle(level)}
          className="h-3 w-3 rounded-[3px] sm:h-3.5 sm:w-3.5"
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
    <div className="mb-1.5 flex gap-3 text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
      {groups.map((g) => (
        <span
          key={`${g.month}-${g.label}`}
          // Each week column is 0.875rem wide (h/w-3.5) with 0.375rem gap
          // (gap-1.5). Width = 0.875*n + 0.375*(n-1) when n > 0.
          style={{ width: weekColumnsWidth(g.weeks.length) }}
          className="overflow-visible whitespace-nowrap"
        >
          {g.weeks.length >= 2 ? g.label : ""}
        </span>
      ))}
    </div>
  );
}

function weekColumnsWidth(n: number): string {
  if (n <= 0) return "0";
  // 0.875rem cell + 0.375rem gap, only n-1 gaps.
  return `calc(${n} * 0.875rem + ${n - 1} * 0.375rem)`;
}

function DayAxis() {
  return (
    <div className="grid grid-rows-7 gap-1.5 pr-1 text-[10px] font-medium uppercase tracking-wide text-fg-subtle">
      <span className="h-3 sm:h-3.5"></span>
      <span className="h-3 leading-3 sm:h-3.5 sm:leading-[0.875rem]">M</span>
      <span className="h-3 sm:h-3.5"></span>
      <span className="h-3 leading-3 sm:h-3.5 sm:leading-[0.875rem]">W</span>
      <span className="h-3 sm:h-3.5"></span>
      <span className="h-3 leading-3 sm:h-3.5 sm:leading-[0.875rem]">F</span>
      <span className="h-3 sm:h-3.5"></span>
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
  const start = addDays(gridEnd, -(days - 1));

  const cols = Math.ceil(days / 7);
  let cursor = start;
  let total = 0;

  const groups: MonthGroup[] = [];
  let currentGroup: MonthGroup | null = null;

  for (let col = 0; col < cols; col++) {
    const week: Array<DayCell | null> = [];
    let weekFirstMonth = -1;
    for (let row = 0; row < 7; row++) {
      if (cursor > end) {
        week.push(null);
      } else {
        const iso = formatIsoDate(cursor);
        const count = counts.get(iso) ?? 0;
        total += count;
        week.push({ date: cursor, iso, count });
        if (row === 0) weekFirstMonth = cursor.getUTCMonth();
      }
      cursor = addDays(cursor, 1);
    }

    if (weekFirstMonth === -1 && currentGroup) {
      currentGroup.weeks.push(week);
      continue;
    }

    if (!currentGroup || currentGroup.month !== weekFirstMonth) {
      currentGroup = {
        month: weekFirstMonth,
        label: MONTH_LABELS[weekFirstMonth] ?? "",
        weeks: [week],
      };
      groups.push(currentGroup);
    } else {
      currentGroup.weeks.push(week);
    }
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
