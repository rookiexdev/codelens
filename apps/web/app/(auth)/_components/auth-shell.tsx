import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

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
      <aside className="relative hidden flex-col justify-between overflow-hidden p-10 text-fg lg:flex xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-glow-1 via-glow-2 to-transparent"
        />
        <Logo
          href="/"
          ariaLabel="Go to home"
          className="relative z-10"
          iconClassName="h-8 w-8 text-accent"
          textClassName="text-base font-semibold tracking-tight text-fg"
        />
        <div className="relative z-10 max-w-md space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            {brandTagline}
          </p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-fg xl:text-4xl">
            {brandHeadline}
          </h2>
          <p className="text-sm leading-relaxed text-fg-muted xl:text-base">
            Sign in to review snippets, share notes with your team, and keep
            your reading list in one place.
          </p>
        </div>
        <div className="relative z-10 text-xs text-fg-subtle">
          © {new Date().getFullYear()} CodeLens
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-14 lg:py-10 xl:px-16">
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo href="/" ariaLabel="Go to home" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              {title}
            </h1>
            <p className="text-sm text-fg-muted sm:text-base">{subtitle}</p>
          </div>

          <div className="mt-8">{children}</div>

          <p className="mt-8 text-center text-sm text-fg-muted">
            {footerPrompt}{" "}
            <Link
              href={footerHref}
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              {footerLinkLabel}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
