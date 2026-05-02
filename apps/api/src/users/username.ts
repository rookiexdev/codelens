import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?$/;

/**
 * Reserved names that cannot be claimed as usernames. Mirror of common
 * route segments + admin-flavoured names. Keep lowercase.
 */
const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  'admin',
  'administrator',
  'root',
  'system',
  'api',
  'auth',
  'login',
  'logout',
  'register',
  'signup',
  'signin',
  'me',
  'profile',
  'profiles',
  'user',
  'users',
  'settings',
  'support',
  'help',
  'contact',
  'about',
  'pricing',
  'terms',
  'privacy',
  'docs',
  'doc',
  'blog',
  'news',
  'static',
  'assets',
  'public',
  'review',
  'reviews',
  'badge',
  'badges',
  'codelens',
]);

export function isReservedUsername(value: string): boolean {
  return RESERVED_USERNAMES.has(value.toLowerCase());
}

export function isValidUsername(value: string): boolean {
  if (
    value.length < USERNAME_MIN_LENGTH ||
    value.length > USERNAME_MAX_LENGTH
  ) {
    return false;
  }
  if (!USERNAME_REGEX.test(value)) {
    return false;
  }
  if (isReservedUsername(value)) {
    return false;
  }
  return true;
}

/**
 * Sanitize an email local-part (or any free-form string) into a candidate
 * username. Only the character class is normalized — uniqueness is the
 * caller's job (see UsernameGenerator).
 */
export function sanitizeToUsername(input: string): string {
  let value = input.toLowerCase();
  value = value.replace(/[^a-z0-9_-]+/g, '-');
  value = value.replace(/-+/g, '-');
  value = value.replace(/^[-_]+|[-_]+$/g, '');
  if (value.length < USERNAME_MIN_LENGTH) {
    value = `${value}user`.slice(0, USERNAME_MAX_LENGTH);
  }
  if (value.length > USERNAME_MAX_LENGTH) {
    value = value.slice(0, USERNAME_MAX_LENGTH);
  }
  return value;
}

@Injectable()
export class UsernameGenerator {
  /** Hard cap on collision retries before we fall back to a random suffix. */
  private static readonly MAX_NUMERIC_ATTEMPTS = 5;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a unique username derived from the given email. Strategy:
   *   1) sanitize email local-part to the username character class
   *   2) reject reserved/too-short/too-long values
   *   3) try numeric suffixes (-1, -2, ...) until one is free
   *   4) fall back to a short random hex suffix as a last resort
   */
  async fromEmail(email: string): Promise<string> {
    const localPart = email.split('@')[0] ?? email;
    const base = this.sanitizeBase(sanitizeToUsername(localPart));

    if (await this.isAvailable(base)) {
      return base;
    }

    for (
      let attempt = 1;
      attempt <= UsernameGenerator.MAX_NUMERIC_ATTEMPTS;
      attempt++
    ) {
      const suffix = `-${attempt}`;
      const candidate = this.fitWithSuffix(base, suffix);
      if (await this.isAvailable(candidate)) {
        return candidate;
      }
    }

    // Random fallback. 6 hex chars = 16M space — collision-safe in practice.
    const random = randomBytes(3).toString('hex');
    return this.fitWithSuffix(base, `-${random}`);
  }

  async isAvailable(candidate: string): Promise<boolean> {
    if (!isValidUsername(candidate)) return false;
    const existing = await this.prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    return existing === null;
  }

  /** Trim base so that base + suffix fits within USERNAME_MAX_LENGTH. */
  private fitWithSuffix(base: string, suffix: string): string {
    const room = USERNAME_MAX_LENGTH - suffix.length;
    const trimmed = base.slice(0, Math.max(USERNAME_MIN_LENGTH, room));
    return `${trimmed}${suffix}`.replace(/--+/g, '-');
  }

  /**
   * If the sanitized local-part is reserved or invalid, derive a safe
   * "user" prefix so collision logic still has something to work with.
   */
  private sanitizeBase(value: string): string {
    if (isValidUsername(value)) return value;
    const fallback = `user-${value}`.slice(0, USERNAME_MAX_LENGTH);
    return isValidUsername(fallback) ? fallback : 'user';
  }
}
