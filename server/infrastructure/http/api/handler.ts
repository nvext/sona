import { randomUUID } from 'node:crypto';
import { defineEventHandler, getHeader, getRequestURL, H3Event, setHeader, setResponseStatus } from 'h3';
import { toHttpError } from './errors';
import { applyCors, enforceRateLimit } from './security';
import { logError, logInfo } from '~~/server/infrastructure/runtime';

type ApiEventContext = {
  requestId?: string;
};

export function defineApiHandler<T>(handler: (event: H3Event) => Promise<T> | T) {
  return defineEventHandler(async (event) => {
    const startedAt = Date.now();
    const requestId = getHeader(event, "x-request-id") ?? randomUUID();
    const requestUrl = getRequestURL(event);
    const pathWithQuery = `${requestUrl.pathname}${requestUrl.search}`;
    (event.context as ApiEventContext).requestId = requestId;
    setHeader(event, "x-request-id", requestId);

    try {
      applyCors(event);
      if (event.method === "OPTIONS") {
        setResponseStatus(event, 204);
        logInfo("api.options", {
          requestId,
          method: event.method,
          path: pathWithQuery,
          statusCode: 204,
          durationMs: Date.now() - startedAt,
        });
        return null;
      }

      enforceRateLimit(event);
      const result = await handler(event);
      logInfo("api.success", {
        requestId,
        method: event.method,
        path: pathWithQuery,
        statusCode: 200,
        durationMs: Date.now() - startedAt,
      });
      return result;
    } catch (error) {
      const httpError = toHttpError(error) as { statusCode?: number; statusMessage?: string };
      logError("api.error", {
        requestId,
        method: event.method,
        path: pathWithQuery,
        statusCode: httpError.statusCode ?? 500,
        statusMessage: httpError.statusMessage ?? "Internal Server Error",
        durationMs: Date.now() - startedAt,
      });
      throw httpError;
    }
  });
}
