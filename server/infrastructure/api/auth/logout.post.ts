import { z } from 'zod';
import { resolveUseCases } from '~~/server/infrastructure/http/api/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/http/api/handler';
import { readValidatedBody } from '~~/server/infrastructure/http/api/validation';

const logoutSchema = z.object({
  sessionId: z.string().min(1),
});

export default defineApiHandler(async (event) => {
  const input = await readValidatedBody(event, logoutSchema);
  return resolveUseCases(event).logout.execute(input);
});
