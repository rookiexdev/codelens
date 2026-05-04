"use client";

import axios, { type AxiosRequestConfig } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";

export interface AbortableRequestState<T> {
  data: T | null;
  loading: boolean;
  error: unknown;
}

export interface AbortableRequestApi<TArgs extends unknown[], T> {
  data: T | null;
  loading: boolean;
  error: unknown;
  /**
   * Trigger the request. If a previous in-flight call is still pending, it is
   * aborted before this one starts — only the most recent call resolves into
   * state. Resolves to the data the call produced, or `null` if it was
   * superseded / aborted.
   */
  run: (...args: TArgs) => Promise<T | null>;
  /** Cancel any in-flight request without starting a new one. */
  cancel: () => void;
  /** Reset state back to its initial empty shape. */
  reset: () => void;
}

export type AbortableFetcher<TArgs extends unknown[], T> = (
  signal: AbortSignal,
  ...args: TArgs
) => Promise<T>;

/**
 * Hook for managing a request that should cancel its predecessor whenever a
 * new call fires. Designed to be reused for any "fire on each keystroke /
 * filter change" style request, plus simpler one-shot loads.
 *
 * Pass a fetcher that accepts an AbortSignal — typically wired into axios via
 * `{ signal }` or fetch's native option. The hook handles the wiring.
 */
export function useAbortableRequest<TArgs extends unknown[], T>(
  fetcher: AbortableFetcher<TArgs, T>,
): AbortableRequestApi<TArgs, T> {
  const [state, setState] = useState<AbortableRequestState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);

  // Keep the latest fetcher in a ref so `run` stays stable but always calls
  // the most recently-passed function. Doing this in an effect (rather than
  // mutating during render) keeps it strict-mode-safe.
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  const cancel = useCallback((): void => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const reset = useCallback((): void => {
    cancel();
    if (mountedRef.current) {
      setState({ data: null, loading: false, error: null });
    }
  }, [cancel]);

  const run = useCallback(
    async (...args: TArgs): Promise<T | null> => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      if (mountedRef.current) {
        setState((prev) => ({ ...prev, loading: true, error: null }));
      }

      try {
        const result = await fetcherRef.current(controller.signal, ...args);
        if (controllerRef.current !== controller || !mountedRef.current) {
          return null;
        }
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        if (isAbortError(err)) return null;
        if (controllerRef.current !== controller || !mountedRef.current) {
          return null;
        }
        setState({ data: null, loading: false, error: err });
        return null;
      }
    },
    [],
  );

  return { ...state, run, cancel, reset };
}

/**
 * Standalone helper for callers that don't need the React lifecycle wrapper.
 * Returns a function that, when called, supersedes any prior in-flight call
 * and resolves to either the result or `null` if aborted.
 */
export function createSupersedingCaller<TArgs extends unknown[], T>(
  fetcher: AbortableFetcher<TArgs, T>,
): (...args: TArgs) => Promise<T | null> {
  let controller: AbortController | null = null;
  return async (...args: TArgs): Promise<T | null> => {
    controller?.abort();
    const local = new AbortController();
    controller = local;
    try {
      const result = await fetcher(local.signal, ...args);
      if (controller !== local) return null;
      return result;
    } catch (err) {
      if (isAbortError(err)) return null;
      throw err;
    }
  };
}

/**
 * Sugar for callers using axios — wraps an axios call with an AbortSignal.
 * Lets you write `axiosWithSignal(signal, (cfg) => api.get('/foo', cfg))`.
 */
export async function axiosWithSignal<T>(
  signal: AbortSignal,
  call: (config: AxiosRequestConfig) => Promise<{ data: T }>,
): Promise<T> {
  const { data } = await call({ signal });
  return data;
}

function isAbortError(err: unknown): boolean {
  if (axios.isCancel(err)) return true;
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name?: unknown }).name === "CanceledError"
  ) {
    return true;
  }
  return false;
}
