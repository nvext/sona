import { z } from 'zod';
import { resolveUseCases } from '~~/server/infrastructure/api/_shared/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/api/_shared/handler';
import { readValidatedBody } from '~~/server/infrastructure/api/_shared/validation';

const logoutSchema = z.object({
  sessionId: z.string().min(1),
});

export default defineApiHandler(async (event) => {
  const input = await readValidatedBody(event, logoutSchema);
  return resolveUseCases(event).logout.execute(input);
});
