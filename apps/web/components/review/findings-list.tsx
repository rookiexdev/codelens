"use client";

import type { Finding, Severity } from "@/lib/review-types";

interface FindingsListProps {
  findings: Finding[];
  emptyLabel: string;
}

const SEVERITY_DOT: Record<Severity, string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
};

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};

export function FindingsList({ findings, emptyLabel }: FindingsListProps) {
  if (findings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface/30 px-4 py-8 text-center text-sm font-medium text-fg-muted">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {findings.map((f) => (
        <li
          key={f.id}
          className="rounded-xl border border-border bg-surface/40 p-4"
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[f.severity]}`}
              title={SEVERITY_LABEL[f.severity]}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold tracking-tight text-fg sm:text-[0.95rem]">
                {f.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-fg-muted sm:text-sm">
                {f.description}
              </p>
              <p className="mt-2 font-mono text-[0.7rem] text-fg-subtle sm:text-xs">
                {f.file}:{f.line}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
