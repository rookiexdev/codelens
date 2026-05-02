/**
 * Per-model soft-delete configuration.
 *
 * `tombstoneFields` lists columns whose value must be mutated on soft-delete
 * so that the live partial-unique indexes (e.g. users.email, users.username)
 * do not collide when a fresh record is created with the same logical value.
 *
 * Add a new model here to opt it into the generic SoftDeleteService.
 */
export interface SoftDeleteModelConfig {
  /** Prisma delegate name on PrismaClient (e.g. 'user'). */
  readonly delegate: string;
  /** Columns to tombstone on soft-delete. */
  readonly tombstoneFields: readonly string[];
}

export const SOFT_DELETE_TOMBSTONE_SEPARATOR = '#deleted-' as const;

export const SOFT_DELETE_REGISTRY = {
  user: {
    delegate: 'user',
    tombstoneFields: ['email', 'username'],
  },
} as const satisfies Record<string, SoftDeleteModelConfig>;

export type SoftDeleteModelName = keyof typeof SOFT_DELETE_REGISTRY;

/**
 * Build a tombstone value: `<original>#deleted-<id>`.
 *
 * `#` is invalid in RFC-5321 emails and disallowed in our username regex,
 * so the tombstone marker can never collide with a real value, and the
 * presence of `#deleted-` is a reliable detection signal.
 */
export function buildTombstone(value: string, id: string): string {
  return `${value}${SOFT_DELETE_TOMBSTONE_SEPARATOR}${id}`;
}
