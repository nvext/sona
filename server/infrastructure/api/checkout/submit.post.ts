import { z } from 'zod';
import { resolveUseCases } from '~~/server/infrastructure/http/api/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/http/api/handler';
import { readValidatedBody } from '~~/server/infrastructure/http/api/validation';
import { requireAuth } from '~~/server/infrastructure/http/api/auth';
import { OperationFailedError } from '~~/server/shared/errors';
import { recordSubmitAttempt, recordSubmitDelivered, recordSubmitFailed } from '~~/server/infrastructure/runtime/metrics';
import { logError, logInfo } from '~~/server/infrastructure/runtime';

const submitSchema = z.object({
  orderRequestId: z.string().min(1),
  contactName: z.string().nullable(),
  contactPhone: z.string().min(1),
  contactEmail: z.string().email().nullable(),
  contactTelegram: z.string().nullable(),
});

export default defineApiHandler(async (event) => {
  const requestId = (event.context as { requestId?: string }).requestId;
  const auth = await requireAuth(event);
  const input = await readValidatedBody(event, submitSchema);
  recordSubmitAttempt();
  logInfo("checkout.submit.requested", {
    requestId,
    userId: auth.userId,
    orderRequestId: input.orderRequestId,
  });
  try {
    const result = await resolveUseCases(event).submitOrderRequest.execute({
      ...input,
      userId: auth.userId,
    });
    recordSubmitDelivered();
    logInfo("checkout.submit.delivered", {
      requestId,
      userId: auth.userId,
      orderRequestId: result.orderRequest.id,
      status: result.orderRequest.status,
    });
    return result;
  } catch (error) {
    if (error instanceof OperationFailedError) {
      recordSubmitFailed();
      logError("checkout.submit.delivery_failed", {
        requestId,
        userId: auth.userId,
        orderRequestId: input.orderRequestId,
        errorMessage: error.message,
      });
    }
    throw error;
  }
});
