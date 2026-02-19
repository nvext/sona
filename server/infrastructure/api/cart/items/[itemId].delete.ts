import { z } from 'zod';
import { resolveUseCases } from '~~/server/infrastructure/http/api/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/http/api/handler';
import { readValidatedParam } from '~~/server/infrastructure/http/api/validation';
import { requireAuth } from '~~/server/infrastructure/http/api/auth';

export default defineApiHandler(async (event) => {
  const auth = await requireAuth(event);
  const itemId = readValidatedParam(event, 'itemId', z.string().min(1));
  return resolveUseCases(event).removeItemFromCart.execute({ itemId, userId: auth.userId });
});
