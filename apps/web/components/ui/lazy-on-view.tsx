"use client";

import { type ReactNode } from "react";
import { useInView } from "@/lib/use-in-view";

interface LazyOnViewProps {
  /** Real content — only rendered after the placeholder enters the viewport. */
  children: ReactNode;
  /** What to render before mounting — usually a same-size skeleton block. */
  placeholder: ReactNode;
  /** Pass through IntersectionObserver rootMargin. */
  rootMargin?: string;
  className?: string;
}

/**
 * Defers mounting `children` until the placeholder scrolls into view. Use to
 * keep below-the-fold sections (graphs, activity feeds, danger zones) out of
 * the initial render — the placeholder reserves layout, the real component
 * mounts only when the user is about to see it.
 */
export function LazyOnView({
  children,
  placeholder,
  rootMargin,
  className,
}: LazyOnViewProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin });
  return (
    <div ref={ref} className={className}>
      {inView ? children : placeholder}
    </div>
  );
}
