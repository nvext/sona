import { z } from 'zod';
import { resolveUseCases } from '~~/server/infrastructure/api/shared/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/api/shared/handler';
import { readValidatedBody } from '~~/server/infrastructure/api/shared/validation';

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
