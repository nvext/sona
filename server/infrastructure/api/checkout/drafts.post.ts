import { z } from 'zod';
import { resolveUseCases } from '~~/server/infrastructure/api/_shared/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/api/_shared/handler';
import { readValidatedBody } from '~~/server/infrastructure/api/_shared/validation';
import { requireAuth } from '~~/server/infrastructure/api/_shared/auth';

const draftSchema = z.object({
  cartId: z.string().min(1),
  idempotencyKey: z.string().min(1),
});

export default defineApiHandler(async (event) => {
  const auth = await requireAuth(event);
  const input = await readValidatedBody(event, draftSchema);
  return resolveUseCases(event).createOrderRequestDraft.execute({
    ...input,
    userId: auth.userId,
  });
});
