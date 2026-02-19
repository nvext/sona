import { resolveUseCases } from '~~/server/infrastructure/http/api/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/http/api/handler';
import { requireAuth } from '~~/server/infrastructure/http/api/auth';

export default defineApiHandler(async (event) => {
  const auth = await requireAuth(event);
  return resolveUseCases(event).getCartItems.execute({ userId: auth.userId });
});
