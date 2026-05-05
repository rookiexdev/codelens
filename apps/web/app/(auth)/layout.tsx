import type { ReactNode } from "react";
import { ThemeDropdown } from "@/components/theme/theme-dropdown";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh w-full items-stretch justify-center bg-bg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-glow-1 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-glow-2 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        <div className="absolute top-1/3 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-glow-1 opacity-50 blur-3xl" />
      </div>
      <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6">
        <ThemeDropdown align="right" />
      </div>
      <div className="relative z-10 flex w-full">{children}</div>
    </div>
  );
}
