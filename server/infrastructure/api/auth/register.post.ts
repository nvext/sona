import { z } from 'zod';
import { resolveUseCases } from '~~/server/infrastructure/http/api/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/http/api/handler';
import { readValidatedBody } from '~~/server/infrastructure/http/api/validation';
import { setAuthCookies } from '~~/server/infrastructure/http/api/auth';

const registerSchema = z.union([
  z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
  z.object({
    phone: z.string().min(5),
    password: z.string().min(6),
  }),
]);

export default defineApiHandler(async (event) => {
  const input = await readValidatedBody(event, registerSchema);
  const result = await resolveUseCases(event).register.execute(input as any);

  if ("password" in input) {
    const loginResult = await resolveUseCases(event).login.execute(input as any);
    setAuthCookies(event, loginResult.accessToken, loginResult.refreshToken);
  }

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      phone: result.user.phone,
      status: result.user.status,
      createdAt: result.user.createdAt,
    },
  };
});
