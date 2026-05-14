"use client";

import { Download, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  VERDICT_LABEL,
  type FindingCategory,
  type ReviewReport,
  type Verdict,
} from "@/lib/review-types";
import { FindingsList } from "./findings-list";

interface ResultsPanelProps {
  report: ReviewReport | null;
  isLoading: boolean;
  error: string | null;
}

const TABS: { id: FindingCategory; label: string }[] = [
  { id: "bugs", label: "Bugs" },
  { id: "security", label: "Security" },
  { id: "suggestions", label: "Suggestions" },
];

function scoreTone(score: number): BadgeTone {
  if (score >= 70) return "success";
  if (score >= 40) return "warning";
  return "danger";
}

function verdictTone(verdict: Verdict): BadgeTone {
  switch (verdict) {
    case "approved":
      return "success";
    case "needs_attention":
      return "warning";
    case "changes_required":
      return "danger";
  }
}

export function ResultsPanel({ report, isLoading, error }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<FindingCategory>("bugs");

  if (isLoading) {
    return (
      <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface/40 p-8 text-center">
        <Spinner size="lg" />
        <p className="text-sm font-semibold text-fg">Reviewing your PR…</p>
        <p className="text-xs text-fg-muted">
          This usually takes a few seconds.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-sm font-medium text-danger">
        {error}
      </div>
    );
  }

  if (!report) {
    return <EmptyState />;
  }

  const findings = report.findings[activeTab];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface/40 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <ScoreCircle score={report.score} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
              Verdict
            </p>
            <div className="mt-1">
              <Badge tone={verdictTone(report.verdict)}>
                {VERDICT_LABEL[report.verdict]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ActionButton
            variant="ghost"
            icon={<Download className="h-3.5 w-3.5" strokeWidth={2.25} />}
            onClick={() => console.log("Export PDF: placeholder")}
          >
            Export PDF
          </ActionButton>
          <ActionButton
            variant="solid"
            icon={<Send className="h-3.5 w-3.5" strokeWidth={2.25} />}
            onClick={() => console.log("Post to PR: placeholder")}
          >
            Post to PR
          </ActionButton>
        </div>

        <span className="sr-only" aria-live="polite">
          Score {report.score} out of 100
        </span>

        <span className="hidden">{scoreTone(report.score)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface/30 p-1">
        {TABS.map((t) => {
          const isActive = activeTab === t.id;
          const count = report.findings[t.id].length;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              aria-pressed={isActive}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                isActive
                  ? "bg-fg text-bg"
                  : "text-fg-muted hover:bg-surface-2/60 hover:text-fg"
              }`}
            >
              {t.label}
              <span
                className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.65rem] font-bold ${
                  isActive
                    ? "bg-bg/30 text-bg"
                    : "bg-surface-2 text-fg-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <FindingsList
        findings={findings}
        emptyLabel={`No ${TABS.find((t) => t.id === activeTab)?.label.toLowerCase()} findings.`}
      />
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const tone = scoreTone(score);
  const colorClass =
    tone === "success"
      ? "text-emerald-400 ring-emerald-500/30 bg-emerald-500/10"
      : tone === "warning"
        ? "text-amber-400 ring-amber-500/30 bg-amber-500/10"
        : "text-red-400 ring-red-500/30 bg-red-500/10";
  return (
    <span
      aria-label={`Score ${score} out of 100`}
      className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold tabular-nums ring-2 ${colorClass}`}
    >
      {score}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface/30 p-8 text-center">
      <span
        aria-hidden
        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/30"
      >
        <Sparkles className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <p className="text-sm font-bold tracking-tight text-fg sm:text-base">
        Your review will appear here
      </p>
      <p className="max-w-xs text-xs text-fg-muted sm:text-sm">
        Enter a PR number or URL and click <strong>Review with AI</strong>.
      </p>
    </div>
  );
}

interface ActionButtonProps {
  children: React.ReactNode;
  icon: React.ReactNode;
  variant: "solid" | "ghost";
  onClick: () => void;
}

function ActionButton({ children, icon, variant, onClick }: ActionButtonProps) {
  const base =
    "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-sm";
  const variantClass =
    variant === "solid"
      ? "bg-fg text-bg hover:opacity-90"
      : "border border-border bg-surface-2/40 text-fg hover:bg-surface-2";
  return (
    <button type="button" onClick={onClick} className={`${base} ${variantClass}`}>
      {icon}
      {children}
    </button>
  );
}
