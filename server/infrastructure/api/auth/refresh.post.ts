import { z } from 'zod';
import { resolveUseCases } from '~~/server/infrastructure/api/shared/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/api/shared/handler';
import { readValidatedBody } from '~~/server/infrastructure/api/shared/validation';

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export default defineApiHandler(async (event) => {
  const input = await readValidatedBody(event, refreshSchema);
  return resolveUseCases(event).refresh.execute(input);
});
