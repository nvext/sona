import { z } from 'zod';
import { resolveUseCases } from '~~/server/infrastructure/api/_shared/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/api/_shared/handler';
import { readValidatedBody } from '~~/server/infrastructure/api/_shared/validation';

const submitSchema = z.object({
  orderRequestId: z.string().min(1),
  contactName: z.string().nullable(),
  contactPhone: z.string().min(1),
  contactEmail: z.string().email().nullable(),
  contactTelegram: z.string().nullable(),
});

export default defineApiHandler(async (event) => {
  const input = await readValidatedBody(event, submitSchema);
  return resolveUseCases(event).submitOrderRequest.execute(input);
});
