"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

interface InViewOptions {
  /** CSS margin string, e.g. "200px 0px" to start loading 200px before visible. */
  rootMargin?: string;
  /** Stop observing once visible — true by default. */
  once?: boolean;
  /** Threshold passed straight to IntersectionObserver. */
  threshold?: number | number[];
}

/**
 * Returns a ref to attach to the element + a boolean that flips true the first
 * time it intersects the viewport. Defaults to "once" semantics so consumers
 * can safely use it as a lazy-mount gate.
 */
export function useInView<T extends Element>(
  options?: InViewOptions,
): { ref: RefObject<T | null>; inView: boolean } {
  const { rootMargin = "200px 0px", once = true, threshold = 0 } =
    options ?? {};
  const ref = useRef<T | null>(null);
  // Lazy initial state — if IntersectionObserver isn't available (server, old
  // browsers) we degrade to "render eagerly" without a setState-in-effect
  // round-trip.
  const [inView, setInView] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return typeof IntersectionObserver === "undefined";
  });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, once, threshold]);

  return { ref, inView };
}
