"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { extractApiError } from "@/lib/api";
import { usersApi } from "@/lib/users-api";

interface TechStackEditorProps {
  initial: string[];
  onSaved: (techStack: string[]) => void;
}

const MAX_ITEMS = 12;
const VALID = /^[A-Za-z0-9 .+#\-/]+$/;

/**
 * Chip-based tech-stack editor. Type a name + Enter to add, click ×
 * to remove. Order is preserved server-side, and dedupe is
 * case-insensitive.
 */
export function TechStackEditor({ initial, onSaved }: TechStackEditorProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<string[]>(initial);
  const [draft, setDraft] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  const isDirty =
    items.length !== initial.length ||
    items.some((v, i) => v !== initial[i]);

  const tryAdd = (raw: string): void => {
    const value = raw.trim();
    if (!value) return;
    if (!VALID.test(value)) {
      setError("Use letters, digits, spaces, or . + # - /");
      return;
    }
    if (value.length > 40) {
      setError("Each tech name is capped at 40 characters");
      return;
    }
    if (items.length >= MAX_ITEMS) {
      setError(`You can list up to ${MAX_ITEMS} items`);
      return;
    }
    if (items.some((v) => v.toLowerCase() === value.toLowerCase())) {
      setError("Already in your stack");
      return;
    }
    setError(null);
    setItems((prev) => [...prev, value]);
    setDraft("");
  };

  const remove = (index: number): void => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const saved = await usersApi.updateTechStack(items);
      onSaved(saved);
      setItems(saved);
      toast({
        variant: "success",
        title: "Tech stack saved",
        description: `${saved.length} ${saved.length === 1 ? "item" : "items"} on your profile`,
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Couldn't save tech stack",
        description: extractApiError(err, "Please try again."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-fg-muted sm:text-sm">
          Tools and languages you use day-to-day. Up to {MAX_ITEMS}.
        </p>
        <span className="rounded-full border border-border bg-surface-2/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-fg-subtle">
          {items.length}/{MAX_ITEMS}
        </span>
      </div>

      <ul className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-3 py-1 text-xs font-semibold text-fg sm:text-sm"
          >
            <span>{item}</span>
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() => remove(index)}
              className="inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-fg-subtle transition hover:bg-danger/15 hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-danger"
            >
              <X aria-hidden className="h-3 w-3" strokeWidth={2.5} />
            </button>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="text-xs font-medium text-fg-subtle sm:text-sm">
            No tech listed yet. Add the ones you live in.
          </li>
        ) : null}
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2/40 px-2 py-1 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/25">
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  tryAdd(draft);
                } else if (e.key === "Backspace" && !draft && items.length) {
                  remove(items.length - 1);
                }
              }}
              maxLength={40}
              placeholder="e.g. TypeScript, React, PostgreSQL"
              className="w-full bg-transparent px-2 py-1.5 text-sm font-medium text-fg placeholder:text-fg-subtle outline-none sm:text-[0.95rem]"
            />
            <button
              type="button"
              onClick={() => tryAdd(draft)}
              disabled={!draft.trim() || items.length >= MAX_ITEMS}
              aria-label="Add tech"
              className="inline-flex cursor-pointer items-center justify-center rounded-md p-1.5 text-fg-muted transition hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            >
              <Plus aria-hidden className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </div>
          {error ? (
            <p className="mt-1 text-xs font-medium text-danger">{error}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={!isDirty || submitting}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-[0.95rem]"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
