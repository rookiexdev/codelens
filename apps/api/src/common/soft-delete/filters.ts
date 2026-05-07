import type { Prisma } from '../../../prisma/generated/client';

/**
 * "Not soft-deleted" filter for the User model.
 *
 * Plain `{ deletedAt: null }` does not work on Prisma 6 + MongoDB: the
 * generated $match adds a `$ne: "$$REMOVE"` clause that excludes documents
 * where the field is unset. Newly-created users have `deletedAt` unset (it
 * is an optional field that Prisma omits from inserts unless given), so a
 * plain null filter silently drops them.
 *
 * Match both cases — field absent from the document, and field present with
 * value null (the state restore() leaves a row in).
 */
export const USER_NOT_DELETED_FILTER: Pick<Prisma.UserWhereInput, 'OR'> = {
  OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
};
