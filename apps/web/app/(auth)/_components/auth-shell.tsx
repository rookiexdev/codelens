import Link from "next/link";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  brandTagline: string;
  brandHeadline: string;
  footerPrompt: string;
  footerLinkLabel: string;
  footerHref: string;
  children: ReactNode;
}

export function AuthShell({
  title,
  subtitle,
  brandTagline,
  brandHeadline,
  footerPrompt,
  footerLinkLabel,
  footerHref,
  children,
}: AuthShellProps) {
  return (
    <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden p-10 text-zinc-100 lg:flex xl:p-14">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/40 via-teal-700/30 to-zinc-900/0" />
        <div className="relative z-10 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/20 ring-1 ring-emerald-300/40">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-300" />
          </span>
          <span className="text-base font-semibold tracking-tight">
            CodeLens
          </span>
        </div>
        <div className="relative z-10 max-w-md space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">
            {brandTagline}
          </p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-zinc-50 xl:text-4xl">
            {brandHeadline}
          </h2>
          <p className="text-sm leading-relaxed text-zinc-300/80 xl:text-base">
            Sign in to review snippets, share notes with your team, and keep
            your reading list in one place.
          </p>
        </div>
        <div className="relative z-10 text-xs text-zinc-400/80">
          © {new Date().getFullYear()} CodeLens
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-14 lg:py-10 xl:px-16">
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/20 ring-1 ring-emerald-300/40">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-300" />
            </span>
            <span className="text-base font-semibold tracking-tight text-zinc-100">
              CodeLens
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
              {title}
            </h1>
            <p className="text-sm text-zinc-400 sm:text-base">{subtitle}</p>
          </div>

          <div className="mt-8">{children}</div>

          <p className="mt-8 text-center text-sm text-zinc-400">
            {footerPrompt}{" "}
            <Link
              href={footerHref}
              className="font-medium text-emerald-300 underline-offset-4 hover:underline"
            >
              {footerLinkLabel}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
