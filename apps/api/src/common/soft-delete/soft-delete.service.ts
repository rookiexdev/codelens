import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../../prisma/generated/client';
import {
  SOFT_DELETE_REGISTRY,
  type SoftDeleteModelName,
  buildTombstone,
} from './soft-delete.config';

type Tx = Prisma.TransactionClient;

interface SoftDeleteOptions {
  tx?: Tx;
  /** Override tombstone fields for this call (e.g. omit them entirely). */
  tombstoneFields?: readonly string[];
  /** Extra columns to set on the soft-deleted row. */
  extraData?: Record<string, unknown>;
}

interface RestoreOptions {
  tx?: Tx;
  /** Restore tombstoned columns to a known set of values (caller-supplied). */
  restoreData?: Record<string, unknown>;
}

interface MinimalDelegate {
  findUnique: (args: {
    where: { id: string };
    select: Record<string, true>;
  }) => Promise<Record<string, unknown> | null>;
  update: (args: {
    where: { id: string };
    data: Record<string, unknown>;
  }) => Promise<unknown>;
}

/**
 * Generic soft-delete helper. A model opts in by:
 *   1) having `deletedAt: DateTime?` on its Prisma model, and
 *   2) being registered in SOFT_DELETE_REGISTRY with its tombstone fields.
 *
 * Tombstoning rewrites unique columns (e.g. email, username) on delete so
 * that re-registration is allowed without partial-unique-index gymnastics.
 */
@Injectable()
export class SoftDeleteService {
  private readonly logger = new Logger(SoftDeleteService.name);

  constructor(private readonly prisma: PrismaService) {}

  async softDelete(
    model: SoftDeleteModelName,
    id: string,
    options: SoftDeleteOptions = {},
  ): Promise<void> {
    const config = SOFT_DELETE_REGISTRY[model];
    const fields = options.tombstoneFields ?? config.tombstoneFields;
    const delegate = this.delegate(model, options.tx);

    const select = fields.reduce<Record<string, true>>(
      (acc, field) => ({ ...acc, [field]: true }),
      { deletedAt: true },
    );
    const row = await delegate.findUnique({ where: { id }, select });
    if (!row) {
      throw new NotFoundException(`${model} not found: ${id}`);
    }
    if (row.deletedAt instanceof Date) {
      this.logger.warn(`softDelete called on already-deleted ${model} ${id}`);
      return;
    }

    const data: Record<string, unknown> = {
      deletedAt: new Date(),
      ...(options.extraData ?? {}),
    };
    for (const field of fields) {
      const original = row[field];
      if (typeof original === 'string' && original.length > 0) {
        data[field] = buildTombstone(original, id);
      }
    }

    await delegate.update({ where: { id }, data });
  }

  async restore(
    model: SoftDeleteModelName,
    id: string,
    options: RestoreOptions = {},
  ): Promise<void> {
    const delegate = this.delegate(model, options.tx);
    const data: Record<string, unknown> = {
      deletedAt: null,
      ...(options.restoreData ?? {}),
    };
    await delegate.update({ where: { id }, data });
  }

  private delegate(model: SoftDeleteModelName, tx?: Tx): MinimalDelegate {
    const client = (tx ?? this.prisma) as unknown as Record<
      string,
      MinimalDelegate
    >;
    const delegateName = SOFT_DELETE_REGISTRY[model].delegate;
    const delegate = client[delegateName];
    if (!delegate) {
      throw new Error(`Prisma delegate not found: ${delegateName}`);
    }
    return delegate;
  }
}
