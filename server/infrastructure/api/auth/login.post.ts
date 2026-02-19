import { z } from 'zod';
import { resolveUseCases } from '~~/server/infrastructure/http/api/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/http/api/handler';
import { readValidatedBody } from '~~/server/infrastructure/http/api/validation';
import { setAuthCookies } from '~~/server/infrastructure/http/api/auth';

const loginSchema = z.union([
  z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  z.object({
    phone: z.string().min(5),
    password: z.string().min(1),
  }),
]);

export default defineApiHandler(async (event) => {
  const input = await readValidatedBody(event, loginSchema);
  const result = await resolveUseCases(event).login.execute(input as any);
  setAuthCookies(event, result.accessToken, result.refreshToken);
  return { ok: true };
});
