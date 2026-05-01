"use client";

import { Check, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "success" | "error" | "info";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastRecord extends Required<Omit<ToastOptions, "description">> {
  id: number;
  description?: string;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;

const variantStyles: Record<ToastVariant, string> = {
  success:
    "border-accent/40 bg-surface/95 text-fg [--toast-bar:var(--accent)]",
  error:
    "border-danger/40 bg-surface/95 text-fg [--toast-bar:var(--danger)]",
  info:
    "border-border bg-surface/95 text-fg [--toast-bar:var(--fg-muted)]",
};

const variantIcon: Record<ToastVariant, ReactNode> = {
  success: <Check aria-hidden className="h-4 w-4" strokeWidth={2.5} />,
  error: <X aria-hidden className="h-4 w-4" strokeWidth={2.5} />,
  info: <Info aria-hidden className="h-4 w-4" strokeWidth={2.25} />,
};

const variantIconTone: Record<ToastVariant, string> = {
  success: "text-accent",
  error: "text-danger",
  info: "text-fg-muted",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismiss = useCallback((id: number): void => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (opts: ToastOptions): number => {
      idRef.current += 1;
      const id = idRef.current;
      const record: ToastRecord = {
        id,
        title: opts.title,
        description: opts.description,
        variant: opts.variant ?? "info",
        duration: opts.duration ?? DEFAULT_DURATION,
      };
      setToasts((prev) => [...prev, record]);

      if (record.duration > 0) {
        const timer = setTimeout(() => dismiss(id), record.duration);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ toast, dismiss }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

interface ToasterProps {
  toasts: ToastRecord[];
  onDismiss: (id: number) => void;
}

function Toaster({ toasts, onDismiss }: ToasterProps) {
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:top-auto sm:bottom-6 sm:right-6 sm:items-end"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      role="status"
      className={`pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border ${variantStyles[toast.variant]} shadow-[0_10px_32px_-12px_rgba(0,0,0,0.45)] backdrop-blur-md toast-enter`}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: "var(--toast-bar)" }}
      />
      <div className="flex items-start gap-3 px-4 py-3 pl-5">
        <span
          className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center ${variantIconTone[toast.variant]}`}
        >
          {variantIcon[toast.variant]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug tracking-tight text-fg">
            {toast.title}
          </p>
          {toast.description ? (
            <p className="mt-0.5 text-xs font-medium leading-snug text-fg-muted">
              {toast.description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => onDismiss(toast.id)}
          className="cursor-pointer rounded-md p-1 text-fg-subtle transition hover:bg-surface-2/80 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <X aria-hidden className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
