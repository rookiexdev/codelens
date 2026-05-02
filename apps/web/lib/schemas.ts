import { z } from "zod";
import { SOCIAL_PROVIDERS } from "./social-providers";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
});

/** Mirrors the backend username constraints. Keep these in sync. */
export const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?$/;

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username is too long")
    .regex(USERNAME_REGEX, "Use a-z, 0-9, _ or -"),
  fullName: z
    .string()
    .max(80, "Full name is too long")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(500, "Bio is too long")
    .optional()
    .or(z.literal("")),
  company: z
    .string()
    .max(80, "Company is too long")
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .max(80, "Location is too long")
    .optional()
    .or(z.literal("")),
});

const socialProviderEnum = z.enum(SOCIAL_PROVIDERS);

export const socialLinkSchema = z.object({
  provider: socialProviderEnum,
  url: z
    .string()
    .min(1, "URL is required")
    .url("Enter a valid URL (include https://)")
    .max(500, "URL is too long"),
  label: z
    .string()
    .max(40, "Label is too long")
    .optional()
    .or(z.literal("")),
});

export const socialLinksSchema = z.object({
  links: z
    .array(socialLinkSchema)
    .max(4, "You can add up to 4 social links"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileFormInput = z.infer<typeof profileSchema>;
export type SocialLinkFormInput = z.infer<typeof socialLinkSchema>;
export type SocialLinksFormInput = z.infer<typeof socialLinksSchema>;
