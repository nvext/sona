import { z } from 'zod';
import { resolveUseCases } from '~~/server/infrastructure/api/_shared/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/api/_shared/handler';
import { readValidatedBody } from '~~/server/infrastructure/api/_shared/validation';

const addItemSchema = z.object({
  userId: z.string().min(1),
  productId: z.string().min(1),
  productColorId: z.string().min(1),
});

export default defineApiHandler(async (event) => {
  const input = await readValidatedBody(event, addItemSchema);
  return resolveUseCases(event).addItemToCart.execute(input);
});
