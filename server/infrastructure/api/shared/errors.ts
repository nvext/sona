import { createError } from 'h3';
import { ZodError } from 'zod';
import { ApplicationError } from '~~/server/shared/errors/ApplicationError';

export function toHttpError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number"
  ) {
    return error;
  }

  if (error instanceof ApplicationError) {
    return createError({ statusCode: error.status, statusMessage: error.message });
  }

  if (error instanceof ZodError) {
    return createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: {
        issues: error.issues,
      },
    });
  }

  return createError({
    statusCode: 500,
    statusMessage: 'Internal Server Error',
  });
}
