"use client";

import { AlertTriangle, Eye, EyeOff, ShieldAlert, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { extractApiError } from "@/lib/api";
import { usersApi } from "@/lib/users-api";

interface DeleteAccountDialogProps {
  /**
   * Render the dialog conditionally from the parent (don't always mount it
   * with `open` toggling). Each open reuses a fresh component instance, so
   * all internal state starts clean — no reset effect needed.
   */
  onClose: () => void;
  username: string;
  email: string;
  onDeleted: () => void;
}

const FRICTION_DELAY_MS = 5_000;

type Step = "confirm-username" | "verify-password" | "final-cooldown";

export function DeleteAccountDialog({
  onClose,
  username,
  email,
  onDeleted,
}: DeleteAccountDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("confirm-username");
  const [usernameInput, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(FRICTION_DELAY_MS);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  // Drive the cooldown timer once we reach the final step.
  useEffect(() => {
    if (step !== "final-cooldown") return;
    const startedAt = Date.now();
    const tick = (): void => {
      const elapsed = Date.now() - startedAt;
      const left = Math.max(0, FRICTION_DELAY_MS - elapsed);
      setCooldownLeft(left);
      if (left === 0) window.clearInterval(handle);
    };
    const handle = window.setInterval(tick, 100);
    return () => window.clearInterval(handle);
  }, [step]);

  const usernameMatches = usernameInput.trim() === username;

  async function handleVerifyPassword(): Promise<void> {
    if (!password || verifying) return;
    setVerifying(true);
    try {
      await usersApi.verifyPassword(password);
      setStep("final-cooldown");
      setCooldownLeft(FRICTION_DELAY_MS);
    } catch (err) {
      toast({
        variant: "error",
        title: "Password didn't match",
        description: extractApiError(err, "Try again."),
      });
      setPassword("");
      passwordInputRef.current?.focus();
    } finally {
      setVerifying(false);
    }
  }

  async function handleFinalDelete(): Promise<void> {
    if (cooldownLeft > 0 || deleting) return;
    setDeleting(true);
    try {
      await usersApi.deleteAccount();
      onDeleted();
    } catch (err) {
      toast({
        variant: "error",
        title: "Couldn't delete your account",
        description: extractApiError(err, "Please try again."),
      });
      setDeleting(false);
    }
  }

  const busy = verifying || deleting;
  const cooldownSecs = Math.ceil(cooldownLeft / 1000);

  return (
    <Modal
      open
      onClose={onClose}
      title="Delete your CodeLens account"
      size="md"
      busy={busy}
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm font-medium leading-relaxed text-fg-muted">
          <AlertTriangle
            aria-hidden
            className="mt-0.5 h-4 w-4 shrink-0 text-danger"
            strokeWidth={2.25}
          />
          <p>
            This soft-deletes <span className="font-semibold text-fg">@{username}</span>.
            Your reviews, social links, and activity log are kept but hidden.
            You can re-register with{" "}
            <span className="font-mono text-xs text-fg">{email}</span> later.
          </p>
        </div>

        <ol className="space-y-4">
          <Stepper currentStep={step} />

          {step === "confirm-username" ? (
            <li>
              <label
                htmlFor="delete-confirm-username"
                className="block text-sm font-semibold text-fg"
              >
                1. Type{" "}
                <span className="font-mono text-xs text-danger">{username}</span>{" "}
                to confirm
              </label>
              <input
                id="delete-confirm-username"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder={username}
                className="mt-2 w-full rounded-lg border border-border bg-surface-2/40 px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-subtle focus-visible:border-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
              />
              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-border bg-surface-2/60 px-4 py-2 text-sm font-medium text-fg transition hover:border-fg-subtle hover:bg-surface-2 sm:text-[0.95rem]"
                >
                  Keep my account
                </button>
                <button
                  type="button"
                  disabled={!usernameMatches}
                  onClick={() => setStep("verify-password")}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-50 sm:text-[0.95rem]"
                >
                  Continue
                </button>
              </div>
            </li>
          ) : null}

          {step === "verify-password" ? (
            <li>
              <label
                htmlFor="delete-confirm-password"
                className="block text-sm font-semibold text-fg"
              >
                2. Re-enter your password
              </label>
              <p className="mt-1 text-xs font-medium text-fg-muted">
                We re-verify before any irreversible action.
              </p>
              <div className="relative mt-2">
                <input
                  id="delete-confirm-password"
                  ref={passwordInputRef}
                  autoFocus
                  autoComplete="current-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleVerifyPassword();
                    }
                  }}
                  className="w-full rounded-lg border border-border bg-surface-2/40 px-3 py-2 pr-10 text-sm text-fg placeholder:text-fg-subtle focus-visible:border-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
                />
                <button
                  type="button"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-muted transition hover:text-fg"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden className="h-4 w-4" strokeWidth={2.25} />
                  ) : (
                    <Eye aria-hidden className="h-4 w-4" strokeWidth={2.25} />
                  )}
                </button>
              </div>
              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStep("confirm-username")}
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-border bg-surface-2/60 px-4 py-2 text-sm font-medium text-fg transition hover:border-fg-subtle hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60 sm:text-[0.95rem]"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!password || verifying}
                  onClick={handleVerifyPassword}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-50 sm:text-[0.95rem]"
                >
                  {verifying ? (
                    <>
                      <Spinner size="sm" tone="onAccent" label="Verifying" />
                      Verifying…
                    </>
                  ) : (
                    "Verify password"
                  )}
                </button>
              </div>
            </li>
          ) : null}

          {step === "final-cooldown" ? (
            <li>
              <div className="flex items-start gap-3 rounded-xl border border-danger/40 bg-danger/10 p-4">
                <ShieldAlert
                  aria-hidden
                  className="mt-0.5 h-5 w-5 shrink-0 text-danger"
                  strokeWidth={2.25}
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-danger">
                    3. Final confirmation
                  </p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-fg-muted">
                    Pausing for{" "}
                    <span className="font-mono font-bold text-danger">
                      {Math.max(cooldownSecs, 0)}s
                    </span>{" "}
                    so you have a moment to back out. The delete button enables
                    after the countdown.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onClose}
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-border bg-surface-2/60 px-4 py-2 text-sm font-medium text-fg transition hover:border-fg-subtle hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60 sm:text-[0.95rem]"
                >
                  Keep my account
                </button>
                <button
                  type="button"
                  disabled={cooldownLeft > 0 || deleting}
                  onClick={handleFinalDelete}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:text-[0.95rem]"
                >
                  {deleting ? (
                    <>
                      <Spinner size="sm" tone="onAccent" label="Deleting" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2
                        aria-hidden
                        className="h-4 w-4"
                        strokeWidth={2.25}
                      />
                      {cooldownLeft > 0
                        ? `Wait ${cooldownSecs}s…`
                        : "Delete my account"}
                    </>
                  )}
                </button>
              </div>
            </li>
          ) : null}
        </ol>
      </div>
    </Modal>
  );
}

function Stepper({ currentStep }: { currentStep: Step }) {
  const order: Step[] = [
    "confirm-username",
    "verify-password",
    "final-cooldown",
  ];
  const idx = order.indexOf(currentStep);
  return (
    <li aria-hidden className="flex items-center gap-2">
      {order.map((s, i) => {
        const active = i === idx;
        const done = i < idx;
        return (
          <span
            key={s}
            className={`h-1.5 flex-1 rounded-full transition ${
              done
                ? "bg-danger/70"
                : active
                  ? "bg-danger"
                  : "bg-border"
            }`}
          />
        );
      })}
    </li>
  );
}
