import { z } from 'zod';
import { resolveUseCases } from '~~/server/infrastructure/http/api/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/http/api/handler';
import { readValidatedBody } from '~~/server/infrastructure/http/api/validation';
import { toAuthUserPayload } from './user-payload';

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
  const channel = "email" in input ? "email" : "phone";
  const verification = await resolveUseCases(event).requestContactVerification.execute({
    userId: result.user.id,
    channel,
  });

  return {
    user: toAuthUserPayload(result.user),
    verification: {
      required: true,
      channel: verification.channel,
      expiresAt: verification.expiresAt,
      retryAfterMs: verification.retryAfterMs,
    },
  };
});
