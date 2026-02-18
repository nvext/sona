import { z } from 'zod';
import { resolveUseCases } from '~~/server/infrastructure/api/_shared/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/api/_shared/handler';
import { readValidatedParam } from '~~/server/infrastructure/api/_shared/validation';

export default defineApiHandler(async (event) => {
  const itemId = readValidatedParam(event, 'itemId', z.string().min(1));
  return resolveUseCases(event).removeItemFromCart.execute({ itemId });
});
