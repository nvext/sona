import { z } from 'zod';
import { resolveUseCases } from '~~/server/infrastructure/api/shared/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/api/shared/handler';
import { readValidatedBody } from '~~/server/infrastructure/api/shared/validation';
import { requireAuth } from '~~/server/infrastructure/api/shared/auth';

const addItemSchema = z.object({
  productId: z.string().min(1),
  productColorId: z.string().min(1),
});

export default defineApiHandler(async (event) => {
  const auth = await requireAuth(event);
  const input = await readValidatedBody(event, addItemSchema);
  return resolveUseCases(event).addItemToCart.execute({
    userId: auth.userId,
    ...input,
  });
});
