import { z } from 'zod';
import { resolveUseCases } from '~~/server/infrastructure/api/shared/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/api/shared/handler';
import { readValidatedParam } from '~~/server/infrastructure/api/shared/validation';
import { requireAuth } from '~~/server/infrastructure/api/shared/auth';

export default defineApiHandler(async (event) => {
  const auth = await requireAuth(event);
  const itemId = readValidatedParam(event, 'itemId', z.string().min(1));
  return resolveUseCases(event).removeItemFromCart.execute({ itemId, userId: auth.userId });
});
