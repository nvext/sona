import { defineEventHandler, H3Event } from 'h3';
import { toHttpError } from './errors';

export function defineApiHandler<T>(handler: (event: H3Event) => Promise<T> | T) {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event);
    } catch (error) {
      throw toHttpError(error);
    }
  });
}
