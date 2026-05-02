"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/toast";
import { extractApiError } from "@/lib/api";
import { profileSchema, type ProfileFormInput } from "@/lib/schemas";
import { usersApi, type PrivateUserProfile } from "@/lib/users-api";

interface ProfileFormProps {
  profile: PrivateUserProfile;
  onSaved: (profile: PrivateUserProfile) => void;
}

const fieldClasses =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-fg placeholder:text-fg-subtle outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/25 sm:text-base";

const labelClasses =
  "block text-[11px] font-bold uppercase tracking-wider text-fg-subtle";

export function ProfileForm({ profile, onSaved }: ProfileFormProps) {
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ProfileFormInput>({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
    defaultValues: toFormValues(profile),
  });

  // Reset form whenever the parent hands us a fresh profile (e.g. after
  // saving social links or restoring after an error).
  useEffect(() => {
    form.reset(toFormValues(profile));
  }, [profile, form]);

  const submit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const updated = await usersApi.updateProfile({
        username: values.username,
        fullName: values.fullName || undefined,
        description: values.description || undefined,
        company: values.company || undefined,
        location: values.location || undefined,
      });
      onSaved(updated);
      form.reset(toFormValues(updated));
      toast({
        variant: "success",
        title: "Profile saved",
        description: "Your changes are live.",
      });
    } catch (err) {
      setServerError(extractApiError(err, "Couldn't save your profile."));
    }
  });

  const isDirty = form.formState.isDirty;
  const isSubmitting = form.formState.isSubmitting;

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Username"
          error={form.formState.errors.username?.message}
          hint="Lowercase letters, digits, _ or -. 3–30 chars."
        >
          <input
            type="text"
            autoComplete="username"
            spellCheck={false}
            {...form.register("username")}
            className={fieldClasses}
          />
        </Field>
        <Field
          label="Full name"
          error={form.formState.errors.fullName?.message}
        >
          <input
            type="text"
            autoComplete="name"
            placeholder="e.g. Gopal Sasmal"
            {...form.register("fullName")}
            className={fieldClasses}
          />
        </Field>
        <Field
          label="Company"
          error={form.formState.errors.company?.message}
        >
          <input
            type="text"
            autoComplete="organization"
            placeholder="Where you work"
            {...form.register("company")}
            className={fieldClasses}
          />
        </Field>
        <Field
          label="Location"
          error={form.formState.errors.location?.message}
        >
          <input
            type="text"
            autoComplete="address-level2"
            placeholder="City, Country"
            {...form.register("location")}
            className={fieldClasses}
          />
        </Field>
      </div>

      <Field
        label="Bio"
        error={form.formState.errors.description?.message}
        hint="A short note about you. 500 characters max."
      >
        <textarea
          rows={4}
          maxLength={500}
          placeholder="Reads code on calm Sundays. Reviews PRs on noisy Mondays."
          {...form.register("description")}
          className={`${fieldClasses} resize-y leading-relaxed`}
        />
      </Field>

      {serverError ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm font-medium text-danger"
        >
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={() => form.reset(toFormValues(profile))}
          disabled={!isDirty || isSubmitting}
          className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg transition hover:border-fg-subtle disabled:cursor-not-allowed disabled:opacity-50 sm:text-[0.95rem]"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-[0.95rem]"
        >
          {isSubmitting ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className={labelClasses}>{label}</span>
      {children}
      {error ? (
        <span className="block text-xs font-medium text-danger">{error}</span>
      ) : hint ? (
        <span className="block text-xs font-medium text-fg-subtle">{hint}</span>
      ) : null}
    </label>
  );
}

function toFormValues(profile: PrivateUserProfile): ProfileFormInput {
  return {
    username: profile.username,
    fullName: profile.fullName ?? "",
    description: profile.description ?? "",
    company: profile.company ?? "",
    location: profile.location ?? "",
  };
}
