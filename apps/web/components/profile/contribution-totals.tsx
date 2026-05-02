import type { ContributionTotals as Totals } from "@/lib/users-api";

interface ContributionTotalsProps {
  totals: Totals;
}

const TILES: ReadonlyArray<{
  key: keyof Totals;
  label: string;
  hint: string;
}> = [
  { key: "week", label: "This week", hint: "Last 7 days" },
  { key: "month", label: "This month", hint: "Last 30 days" },
  { key: "year", label: "This year", hint: "Last 365 days" },
  { key: "allTime", label: "All time", hint: "Since you joined" },
];

export function ContributionTotals({ totals }: ContributionTotalsProps) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {TILES.map(({ key, label, hint }) => {
        const count = totals[key];
        return (
          <li
            key={key}
            className="rounded-xl border border-border bg-surface/40 p-3 sm:p-4"
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">
              {label}
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight text-fg sm:text-2xl">
              {count.toLocaleString()}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-fg-muted sm:text-xs">
              {hint}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
