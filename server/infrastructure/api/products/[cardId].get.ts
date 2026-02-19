import { z } from 'zod';
import { resolveUseCases } from '~~/server/infrastructure/http/api/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/http/api/handler';
import { readValidatedParam } from '~~/server/infrastructure/http/api/validation';

export default defineApiHandler(async (event) => {
  const cardId = readValidatedParam(event, 'cardId', z.string().min(1));
  return resolveUseCases(event).getProductCardDetails.execute({ cardId });
});
