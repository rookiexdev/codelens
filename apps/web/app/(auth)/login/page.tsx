"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthShell } from "../_components/auth-shell";
import { Spinner } from "@/components/ui/spinner";
import { setAccessToken } from "@/lib/auth-storage";
import { api, extractApiError, type AuthResponse } from "@/lib/api";
import { loginSchema, type LoginInput } from "@/lib/schemas";

export default function LoginPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginInput): Promise<void> => {
    setFormError(null);
    try {
      const { data } = await api.post<AuthResponse>("/auth/login", values);
      setAccessToken(data.accessToken);
      router.push("/dashboard");
    } catch (err) {
      setFormError(extractApiError(err, "Could not sign you in. Try again."));
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your workspace."
      brandTagline="Read · Review · Remember"
      brandHeadline="Quiet, focused code reviews."
      footerPrompt="New here?"
      footerLinkLabel="Create an account"
      footerHref="/signup"
    >
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-200"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={errors.email ? "true" : "false"}
            {...register("email")}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 shadow-inner outline-none transition focus:border-emerald-400/60 focus:bg-zinc-900 focus:ring-2 focus:ring-emerald-400/20 sm:text-base"
          />
          {errors.email ? (
            <p className="text-xs text-rose-300">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-200"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={errors.password ? "true" : "false"}
            {...register("password")}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 shadow-inner outline-none transition focus:border-emerald-400/60 focus:bg-zinc-900 focus:ring-2 focus:ring-emerald-400/20 sm:text-base"
          />
          {errors.password ? (
            <p className="text-xs text-rose-300">{errors.password.message}</p>
          ) : null}
        </div>

        {formError ? (
          <div
            role="alert"
            className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
          >
            {formError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" tone="onAccent" label="Signing in" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </AuthShell>
  );
}
