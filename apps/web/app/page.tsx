"use client";

import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Eye,
  Footprints,
  KeyRound,
  Sparkles,
  Wind,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { ThemeDropdown } from "@/components/theme/theme-dropdown";
import { useAccessToken } from "@/lib/use-access-token";
import { useInView } from "@/lib/use-in-view";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  scale?: boolean;
}

function Reveal({
  children,
  delay = 0,
  className = "",
  scale = false,
}: RevealProps): ReactElement {
  const { ref, inView } = useInView<HTMLDivElement>({
    rootMargin: "0px 0px -8% 0px",
    threshold: 0.05,
  });
  const style = { "--reveal-delay": `${delay}ms` } as CSSProperties;
  return (
    <div
      ref={ref}
      style={style}
      className={`reveal ${scale ? "reveal-scale" : ""} ${inView ? "reveal--in" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

type AuthState = "guest" | "member";

export default function HomePage(): ReactElement {
  const token = useAccessToken();
  const auth: AuthState = token !== null ? "member" : "guest";

  return (
    <div className="relative min-h-dvh overflow-hidden bg-bg text-fg">
      <BackgroundGlow />

      <SiteHeader auth={auth} />

      <main className="relative z-10">
        <Hero auth={auth} />
        <FeatureGrid />
        <Teaser />
        <FinalCta auth={auth} />
      </main>

      <SiteFooter />
    </div>
  );
}

function BackgroundGlow(): ReactElement {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="glow-drift-a absolute -top-32 -left-24 h-72 w-72 rounded-full bg-glow-1 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
      <div className="glow-drift-b absolute top-1/3 -right-32 h-72 w-72 rounded-full bg-glow-2 blur-3xl sm:h-[32rem] sm:w-[32rem]" />
      <div className="glow-drift-c absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-glow-1 opacity-50 blur-3xl sm:h-96 sm:w-96" />
    </div>
  );
}

function SiteHeader({ auth }: { auth: AuthState }): ReactElement {
  return (
    <header className="relative z-20 border-b border-border/60 bg-bg/40 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <Logo href="/" ariaLabel="CodeLens home" />
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeDropdown align="right" />
          <HeaderCta auth={auth} />
        </div>
      </div>
    </header>
  );
}

function HeaderCta({ auth }: { auth: AuthState }): ReactElement {
  if (auth === "member") {
    return (
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-fg shadow-sm transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-4 sm:text-sm"
      >
        Open dashboard
        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Link
        href="/login"
        className="hidden rounded-lg border border-transparent px-3 py-2 text-xs font-medium text-fg-muted transition hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:inline-flex sm:text-sm"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-fg shadow-sm transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-4 sm:text-sm"
      >
        Get the key
        <KeyRound className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Link>
    </div>
  );
}

function Hero({ auth }: { auth: AuthState }): ReactElement {
  return (
    <section className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-12 pb-16 text-center sm:px-6 sm:pt-20 sm:pb-24 lg:px-8 lg:pt-28 lg:pb-32">
      <span
        style={{ "--hero-delay": "60ms" } as CSSProperties}
        className="hero-rise inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-accent shadow-inner backdrop-blur"
      >
        <Sparkles className="h-3 w-3" aria-hidden />
        An invitation, not a product tour
      </span>

      <h1
        style={{ "--hero-delay": "160ms" } as CSSProperties}
        className="hero-rise mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-fg sm:mt-7 sm:text-5xl lg:text-6xl"
      >
        Your code is already <span className="text-accent">whispering.</span>
        <br className="hidden sm:block" />
        <span className="sm:ml-1">CodeLens helps you listen.</span>
      </h1>

      <p
        style={{ "--hero-delay": "280ms" } as CSSProperties}
        className="hero-rise mt-5 max-w-xl text-sm leading-relaxed text-fg-muted sm:mt-7 sm:text-base lg:text-lg"
      >
        A quieter place to read, mark, and remember the code that matters.
        We won&apos;t spoil what&apos;s inside — but the people who&apos;ve
        crossed the threshold tend not to leave.
      </p>

      <div
        style={{ "--hero-delay": "400ms" } as CSSProperties}
        className="hero-rise flex w-full justify-center"
      >
        <HeroCtas auth={auth} />
      </div>

      <p
        style={{ "--hero-delay": "520ms" } as CSSProperties}
        className="hero-rise mt-5 text-xs text-fg-subtle sm:mt-6"
      >
        No credit card. No streaks. No notifications shouting at you.
      </p>
    </section>
  );
}

function HeroCtas({ auth }: { auth: AuthState }): ReactElement {
  if (auth === "member") {
    return (
      <div className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-center">
        <Link
          href="/dashboard"
          className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-fg shadow-md transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-base"
        >
          Step back inside
          <ArrowRight className="arrow-nudge h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-center">
      <Link
        href="/signup"
        className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-fg shadow-md transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-base"
      >
        Open the door
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </Link>
      <Link
        href="/login"
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface/60 px-5 py-3 text-sm font-semibold text-fg shadow-sm backdrop-blur transition hover:border-accent/50 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-base"
      >
        I&apos;ve been here before
      </Link>
    </div>
  );
}

interface Feature {
  icon: typeof BookOpen;
  eyebrow: string;
  title: string;
  body: string;
}

const FEATURES: ReadonlyArray<Feature> = [
  {
    icon: BookOpen,
    eyebrow: "Read",
    title: "Slow-mode for code",
    body: "Built for the kind of review you'll still remember on Friday — not the kind you nod through on Monday.",
  },
  {
    icon: Eye,
    eyebrow: "See",
    title: "Borrow another reader's eyes",
    body: "Look at a file through someone else's lens. What they paused on. What they missed. What they almost said.",
  },
  {
    icon: Bookmark,
    eyebrow: "Remember",
    title: "A second memory",
    body: "Every snippet, every note, every quiet 'why' — kept somewhere you'll actually find it next month.",
  },
  {
    icon: Wind,
    eyebrow: "Quiet",
    title: "No streaks. No badges.",
    body: "We're not trying to make you addicted. We're trying to make you better. There's a difference, and you can feel it.",
  },
];

function FeatureGrid(): ReactElement {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          What CodeLens does
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
          Four small shifts. One very different review.
        </h2>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:gap-6">
        {FEATURES.map((feature, i) => (
          <Reveal key={feature.title} delay={80 + i * 90} scale>
            <FeatureCard feature={feature} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: Feature }): ReactElement {
  const Icon = feature.icon;
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-surface/40 p-5 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface/70 hover:shadow-lg hover:shadow-accent/5 sm:p-6 lg:p-7">
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-glow-1 opacity-0 blur-3xl transition group-hover:opacity-100" />
      <div className="relative flex items-start gap-4">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-border bg-surface-2/80 text-accent shadow-inner sm:h-11 sm:w-11">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-subtle">
            {feature.eyebrow}
          </p>
          <h3 className="mt-1 text-base font-semibold tracking-tight text-fg sm:text-lg">
            {feature.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            {feature.body}
          </p>
        </div>
      </div>
    </div>
  );
}

function Teaser(): ReactElement {
  const hints = [
    {
      index: "01",
      title: "The way diffs breathe",
      hint: "A reading mode that doesn't fight you.",
    },
    {
      index: "02",
      title: "A small daily ritual",
      hint: "Two minutes. Quietly addictive. You'll see.",
    },
    {
      index: "03",
      title: "Your first lens",
      hint: "It picks you, not the other way around.",
    },
  ];

  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <Reveal scale>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/40 p-6 backdrop-blur sm:p-10 lg:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-glow-2 blur-3xl glow-drift-c"
          />

          <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-10">
            <div className="lg:col-span-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
                Behind the door
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                We could tell you. <br className="hidden sm:block" />
                <span className="text-fg-muted">But it&apos;s better if you find it.</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-fg-muted sm:text-base">
                A handful of small rituals you won&apos;t see anywhere else.
                Most members notice the first one in their opening minute.
                The second one takes a week. The third — well.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:col-span-3 lg:grid-cols-3 lg:gap-4">
              {hints.map((h, i) => (
                <Reveal key={h.index} delay={120 + i * 110}>
                  <TeaserHint index={h.index} title={h.title} hint={h.hint} />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function TeaserHint({
  index,
  title,
  hint,
}: {
  index: string;
  title: string;
  hint: string;
}): ReactElement {
  return (
    <div className="group relative h-full rounded-2xl border border-border bg-surface-2/60 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-2/90 hover:shadow-md hover:shadow-accent/5">
      <span className="font-mono text-[11px] tracking-widest text-fg-subtle">
        {index}
      </span>
      <h3 className="mt-2 text-base font-semibold tracking-tight text-fg">
        {title}
      </h3>
      <p className="mt-1.5 text-sm text-fg-muted">{hint}</p>
      <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent opacity-0 transition group-hover:opacity-100">
        <Footprints className="h-3.5 w-3.5" aria-hidden />
        Sign in to see it
      </div>
    </div>
  );
}

function FinalCta({ auth }: { auth: AuthState }): ReactElement {
  if (auth === "member") {
    return (
      <section className="relative mx-auto w-full max-w-3xl px-4 pb-20 text-center sm:px-6 sm:pb-28 lg:pb-32">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            The room is still warm.
          </h2>
          <p className="mt-3 text-sm text-fg-muted sm:text-base">
            Pick up exactly where you left it.
          </p>
        </Reveal>
        <Reveal delay={140}>
          <Link
            href="/dashboard"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-fg shadow-md transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-base"
          >
            Go to dashboard
            <ArrowRight className="arrow-nudge h-4 w-4" />
          </Link>
        </Reveal>
      </section>
    );
  }

  return (
    <section className="relative mx-auto w-full max-w-3xl px-4 pb-20 text-center sm:px-6 sm:pb-28 lg:pb-32">
      <Reveal>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
          Step in. The first room is free.
        </h2>
        <p className="mt-3 text-sm text-fg-muted sm:text-base">
          We won&apos;t ask you to commit to anything you haven&apos;t seen.
          Just open the door.
        </p>
      </Reveal>
      <Reveal delay={140} className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <Link
          href="/signup"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-fg shadow-md transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-base"
        >
          Create your account
          <ArrowRight className="arrow-nudge h-4 w-4" />
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface/60 px-6 py-3 text-sm font-semibold text-fg backdrop-blur transition hover:border-accent/50 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-base"
        >
          Sign in
        </Link>
      </Reveal>
    </section>
  );
}

function SiteFooter(): ReactElement {
  return (
    <footer className="relative z-10 border-t border-border/60 bg-bg/40 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-4 py-6 text-xs text-fg-subtle sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} CodeLens. Read · Review · Remember.</p>
        <div className="flex items-center gap-4">
          <Link href="/login" className="transition hover:text-fg">
            Sign in
          </Link>
          <Link href="/signup" className="transition hover:text-fg">
            Create account
          </Link>
        </div>
      </div>
    </footer>
  );
}
