"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { useToast } from "@/components/ui/toast";
import { extractApiError } from "@/lib/api";
import {
  socialLinksSchema,
  type SocialLinkFormInput,
  type SocialLinksFormInput,
} from "@/lib/schemas";
import {
  SOCIAL_PROVIDER_GROUPS,
  SOCIAL_PROVIDER_META,
  type SocialProvider,
} from "@/lib/social-providers";
import { usersApi, type SocialLinkView } from "@/lib/users-api";

interface SocialLinksEditorProps {
  initialLinks: SocialLinkView[];
  onSaved: (links: SocialLinkView[]) => void;
}

const MAX_LINKS = 4;

export function SocialLinksEditor({
  initialLinks,
  onSaved,
}: SocialLinksEditorProps) {
  const { toast } = useToast();
  const form = useForm<SocialLinksFormInput>({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: {
      links: initialLinks.map<SocialLinkFormInput>((l) => ({
        provider: l.provider,
        url: l.url,
        label: l.label ?? "",
      })),
    },
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "links",
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      const saved = await usersApi.replaceSocialLinks({
        links: values.links.map((link) => ({
          provider: link.provider,
          url: link.url,
          ...(link.label ? { label: link.label } : {}),
        })),
      });
      onSaved(saved);
      form.reset({
        links: saved.map<SocialLinkFormInput>((l) => ({
          provider: l.provider,
          url: l.url,
          label: l.label ?? "",
        })),
      });
      toast({
        variant: "success",
        title: "Social links saved",
        description: `${saved.length} ${saved.length === 1 ? "link" : "links"} on your profile`,
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Couldn't save links",
        description: extractApiError(err, "Please try again."),
      });
    }
  });

  const canAdd = fields.length < MAX_LINKS;
  const isDirty = form.formState.isDirty;
  const isSubmitting = form.formState.isSubmitting;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-fg-muted sm:text-sm">
          Up to 4 links — show off the platforms you live on.
        </p>
        <span className="rounded-full border border-border bg-surface-2/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-fg-subtle">
          {fields.length}/{MAX_LINKS}
        </span>
      </div>

      <ul className="space-y-3">
        {fields.map((field, index) => {
          const providerErr = form.formState.errors.links?.[index]?.provider;
          const urlErr = form.formState.errors.links?.[index]?.url;
          const labelErr = form.formState.errors.links?.[index]?.label;
          const provider = form.watch(`links.${index}.provider`);
          const hint =
            (provider && SOCIAL_PROVIDER_META[provider as SocialProvider]?.hint) ??
            "https://…";
          return (
            <li
              key={field.id}
              className="rounded-xl border border-border bg-surface-2/50 p-3 sm:p-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-start">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-fg-subtle">
                    Platform
                  </label>
                  <select
                    {...form.register(`links.${index}.provider`)}
                    className="mt-1 w-full cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-fg transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    {SOCIAL_PROVIDER_GROUPS.map(({ group, providers }) => (
                      <optgroup key={group} label={group}>
                        {providers.map((id) => (
                          <option key={id} value={id}>
                            {SOCIAL_PROVIDER_META[id].label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {providerErr ? (
                    <p className="mt-1 text-xs font-medium text-danger">
                      {providerErr.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-fg-subtle">
                    URL
                  </label>
                  <input
                    type="url"
                    inputMode="url"
                    placeholder={`https://${hint}`}
                    {...form.register(`links.${index}.url`)}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                  {urlErr ? (
                    <p className="mt-1 text-xs font-medium text-danger">
                      {urlErr.message}
                    </p>
                  ) : null}
                  <input
                    type="text"
                    placeholder="Label (optional)"
                    maxLength={40}
                    {...form.register(`links.${index}.label`)}
                    className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-fg-muted placeholder:text-fg-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                  {labelErr ? (
                    <p className="mt-1 text-xs font-medium text-danger">
                      {labelErr.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-end justify-end sm:items-start sm:pt-6">
                  <button
                    type="button"
                    aria-label={`Remove link ${index + 1}`}
                    onClick={() => remove(index)}
                    className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-danger/30 bg-danger/5 p-2 text-danger transition hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
                  >
                    <Trash2 aria-hidden className="h-4 w-4" strokeWidth={2.25} />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {fields.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface-2/40 p-4 text-center text-sm font-medium text-fg-muted">
          No social links yet. Add up to 4 to share your profile.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={!canAdd}
          onClick={() =>
            append({ provider: "github", url: "", label: "" })
          }
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-fg transition hover:border-accent/40 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-[0.95rem]"
        >
          <Plus aria-hidden className="h-4 w-4" strokeWidth={2.25} />
          Add link
        </button>

        <button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-[0.95rem]"
        >
          {isSubmitting ? "Saving…" : "Save links"}
        </button>
      </div>
    </form>
  );
}
