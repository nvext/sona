import { defineEventHandler, H3Event, setResponseStatus } from 'h3';
import { toHttpError } from './errors';
import { applyCors, enforceRateLimit } from './security';

export function defineApiHandler<T>(handler: (event: H3Event) => Promise<T> | T) {
  return defineEventHandler(async (event) => {
    try {
      applyCors(event);
      if (event.method === "OPTIONS") {
        setResponseStatus(event, 204);
        return null;
      }

      enforceRateLimit(event);
      return await handler(event);
    } catch (error) {
      throw toHttpError(error);
    }
  });
}
