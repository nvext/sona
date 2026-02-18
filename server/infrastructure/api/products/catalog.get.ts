import { z } from 'zod';
import { resolveUseCases } from '~~/server/infrastructure/api/_shared/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/api/_shared/handler';
import { readValidatedQuery } from '~~/server/infrastructure/api/_shared/validation';

const querySchema = z.object({
  offset: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export default defineApiHandler(async (event) => {
  const query = readValidatedQuery(event, querySchema);
  const pagination =
    query.offset !== undefined || query.limit !== undefined
      ? { offset: query.offset ?? 0, limit: query.limit ?? 24 }
      : undefined;

  return resolveUseCases(event).getCatalogPage.execute({ pagination });
});
