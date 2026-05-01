import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh w-full items-stretch justify-center bg-zinc-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-teal-400/15 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        <div className="absolute top-1/3 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-amber-200/10 blur-3xl" />
      </div>
      <div className="relative z-10 flex w-full">{children}</div>
    </div>
  );
}
