"use client";

import { useEffect, useState } from "react";
import { EmojiPopover } from "@/components/profile/emoji-popover";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { extractApiError } from "@/lib/api";
import {
  STATUS_EXPIRATION_OPTIONS,
  STATUS_PRESETS,
  classifyExpiration,
  resolveExpiration,
  type StatusExpiration,
  type StatusPreset,
} from "@/lib/status-presets";
import { usersApi, type UserStatus } from "@/lib/users-api";

interface StatusDialogProps {
  open: boolean;
  onClose: () => void;
  current: UserStatus | null;
  onSaved: (status: UserStatus | null) => void;
}

const TEXT_MAX = 80;

export function StatusDialog({
  open,
  onClose,
  current,
  onSaved,
}: StatusDialogProps) {
  const { toast } = useToast();
  const [emoji, setEmoji] = useState<string>(current?.emoji ?? "");
  const [text, setText] = useState<string>(current?.text ?? "");
  const [busy, setBusy] = useState<boolean>(current?.busy ?? false);
  const [expiration, setExpiration] = useState<StatusExpiration>(() =>
    classifyExpiration(current?.expiresAt ? new Date(current.expiresAt) : null),
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);

  // Re-prime form whenever the dialog reopens with a different "current".
  useEffect(() => {
    if (!open) return;
    setEmoji(current?.emoji ?? "");
    setText(current?.text ?? "");
    setBusy(current?.busy ?? false);
    setExpiration(
      classifyExpiration(
        current?.expiresAt ? new Date(current.expiresAt) : null,
      ),
    );
  }, [open, current]);

  const applyPreset = (preset: StatusPreset): void => {
    setEmoji(preset.emoji);
    setText(preset.text);
    setBusy(preset.busy ?? false);
    setExpiration(
      preset.expiresInMs === null
        ? "never"
        : classifyExpiration(new Date(Date.now() + preset.expiresInMs)),
    );
  };

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const expires = resolveExpiration(expiration);
      const saved = await usersApi.setStatus({
        emoji: emoji || undefined,
        text: text || undefined,
        busy,
        expiresAt: expires ? expires.toISOString() : null,
      });
      onSaved(saved);
      toast({
        variant: "success",
        title: "Status updated",
        description: saved?.text || "Your status is now visible on your profile.",
      });
      onClose();
    } catch (err) {
      toast({
        variant: "error",
        title: "Couldn't update status",
        description: extractApiError(err, "Please try again."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const clear = async (): Promise<void> => {
    setClearing(true);
    try {
      await usersApi.clearStatus();
      onSaved(null);
      toast({
        variant: "success",
        title: "Status cleared",
        description: "Your status has been removed.",
      });
      onClose();
    } catch (err) {
      toast({
        variant: "error",
        title: "Couldn't clear status",
        description: extractApiError(err, "Please try again."),
      });
    } finally {
      setClearing(false);
    }
  };

  const remaining = TEXT_MAX - text.length;
  const isWorking = submitting || clearing;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit status"
      size="md"
      busy={isWorking}
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <p className="text-sm font-bold tracking-tight text-fg">
            What&apos;s happening
          </p>
          <div className="mt-2 flex items-start gap-2">
            <EmojiPopover
              value={emoji || null}
              onChange={(e) => setEmoji(e)}
              ariaLabel="Pick status emoji"
            />
            <div className="min-w-0 flex-1">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, TEXT_MAX))}
                placeholder="What's on your mind?"
                className="w-full rounded-lg border border-border bg-surface-2/60 px-3 py-2.5 text-sm font-medium text-fg placeholder:text-fg-subtle outline-none transition focus:border-accent/60 focus:bg-surface focus:ring-2 focus:ring-accent/25 sm:text-base"
              />
              <p className="mt-1 text-xs font-medium text-fg-subtle">
                {remaining} characters remaining
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {STATUS_PRESETS.map((preset) => (
              <button
                key={preset.text}
                type="button"
                onClick={() => applyPreset(preset)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-3 py-1 text-xs font-semibold text-fg transition hover:border-accent/40 hover:bg-surface sm:text-sm"
              >
                <span aria-hidden>{preset.emoji}</span>
                {preset.text}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-2/40 p-3 sm:p-4">
          <input
            type="checkbox"
            checked={busy}
            onChange={(e) => setBusy(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <span>
            <span className="block text-sm font-bold tracking-tight text-fg">
              Busy
            </span>
            <span className="mt-0.5 block text-xs font-medium text-fg-muted sm:text-sm">
              When others mention you, assign you, or request your review,
              CodeLens will let them know you have limited availability.
            </span>
          </span>
        </label>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-fg-subtle">
            Expiration
          </label>
          <select
            value={expiration}
            onChange={(e) => setExpiration(e.target.value as StatusExpiration)}
            className="mt-1 w-full cursor-pointer rounded-lg border border-border bg-surface-2/60 px-3 py-2.5 text-sm font-medium text-fg outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/25 sm:text-base"
          >
            {STATUS_EXPIRATION_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs font-medium text-fg-subtle">
            Your status will be cleared after the selected time.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={clear}
            disabled={isWorking || (!current && !emoji && !text && !busy)}
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-border bg-surface-2/60 px-4 py-2 text-sm font-semibold text-fg transition hover:border-fg-subtle hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50 sm:text-[0.95rem]"
          >
            {clearing ? "Clearing…" : "Clear status"}
          </button>
          <button
            type="submit"
            disabled={isWorking || (!emoji && !text && !busy)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-[0.95rem]"
          >
            {submitting ? "Saving…" : "Set status"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
