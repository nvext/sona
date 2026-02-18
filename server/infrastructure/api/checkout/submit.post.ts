import { z } from 'zod';
import { resolveUseCases } from '~~/server/infrastructure/api/_shared/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/api/_shared/handler';
import { readValidatedBody } from '~~/server/infrastructure/api/_shared/validation';
import { requireAuth } from '~~/server/infrastructure/api/_shared/auth';
import { OperationFailedError } from '~~/server/shared/errors';
import { recordSubmitAttempt, recordSubmitDelivered, recordSubmitFailed } from '~~/server/infrastructure/runtime/metrics';

const submitSchema = z.object({
  orderRequestId: z.string().min(1),
  contactName: z.string().nullable(),
  contactPhone: z.string().min(1),
  contactEmail: z.string().email().nullable(),
  contactTelegram: z.string().nullable(),
});

export default defineApiHandler(async (event) => {
  const auth = await requireAuth(event);
  const input = await readValidatedBody(event, submitSchema);
  recordSubmitAttempt();
  try {
    const result = await resolveUseCases(event).submitOrderRequest.execute({
      ...input,
      userId: auth.userId,
    });
    recordSubmitDelivered();
    return result;
  } catch (error) {
    if (error instanceof OperationFailedError) {
      recordSubmitFailed();
    }
    throw error;
  }
});
