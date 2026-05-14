"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

interface InputPanelProps {
  isLoading: boolean;
  onSubmit: (input: { pr: string; instructions: string }) => void;
}

interface QuickPrompt {
  label: string;
  text: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    label: "Security",
    text: "Focus on security vulnerabilities (SQL injection, XSS, secret exposure, auth bypasses).",
  },
  {
    label: "Performance",
    text: "Look for performance issues (N+1 queries, large allocations, blocking I/O, missing indexes).",
  },
  {
    label: "Code Style",
    text: "Flag code style, naming, and readability concerns.",
  },
  {
    label: "Bug Detection",
    text: "Identify potential bugs, edge cases, and missing error handling.",
  },
];

const ALL_PROMPT: QuickPrompt = {
  label: "All of the above",
  text: QUICK_PROMPTS.map((p) => p.text).join(" "),
};

function appendPrompt(current: string, addition: string): string {
  const trimmed = current.trim();
  if (!trimmed) return addition;
  return `${trimmed} ${addition}`;
}

export function InputPanel({ isLoading, onSubmit }: InputPanelProps) {
  const [pr, setPr] = useState("");
  const [instructions, setInstructions] = useState("");

  const canSubmit = pr.trim().length > 0 && !isLoading;

  const handleAppend = (addition: string): void => {
    setInstructions((cur) => appendPrompt(cur, addition));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({ pr: pr.trim(), instructions: instructions.trim() });
      }}
      className="space-y-6"
    >
      <fieldset className="space-y-2">
        <legend className="text-sm font-bold tracking-tight text-fg">
          Pull Request
        </legend>
        <label htmlFor="pr-input" className="sr-only">
          PR URL or PR number
        </label>
        <input
          id="pr-input"
          type="text"
          value={pr}
          onChange={(e) => setPr(e.target.value)}
          placeholder="e.g. #42 or paste full PR URL"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-xl border border-border bg-surface/40 px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-bold tracking-tight text-fg">
          Review Instructions
        </legend>
        <label htmlFor="instructions" className="sr-only">
          What should the AI focus on?
        </label>
        <textarea
          id="instructions"
          rows={5}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g. Focus on security vulnerabilities and performance issues"
          className="block w-full resize-y rounded-xl border border-border bg-surface/40 px-3 py-2.5 text-sm leading-relaxed text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        />
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((p) => (
            <PromptChip
              key={p.label}
              label={p.label}
              onClick={() => handleAppend(p.text)}
            />
          ))}
          <PromptChip
            label={ALL_PROMPT.label}
            tone="accent"
            onClick={() => handleAppend(ALL_PROMPT.text)}
          />
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-fg px-4 py-3 text-sm font-bold text-bg shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
      >
        {isLoading ? (
          <>
            <Spinner size="sm" tone="onAccent" label="Reviewing" />
            Reviewing…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            Review with AI
          </>
        )}
      </button>
    </form>
  );
}

interface PromptChipProps {
  label: string;
  tone?: "default" | "accent";
  onClick: () => void;
}

function PromptChip({ label, tone = "default", onClick }: PromptChipProps) {
  const cls =
    tone === "accent"
      ? "border-accent/40 bg-accent/10 text-accent hover:bg-accent/20"
      : "border-border bg-surface-2/40 text-fg-muted hover:border-fg-subtle hover:text-fg";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-xs ${cls}`}
    >
      {label}
    </button>
  );
}
