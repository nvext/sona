import { getQuery, getRouterParam, H3Event, readBody } from 'h3';
import { z } from 'zod';

export async function readValidatedBody<T extends z.ZodTypeAny>(event: H3Event, schema: T): Promise<z.infer<T>> {
  const body = await readBody(event);
  return schema.parse(body);
}

export function readValidatedQuery<T extends z.ZodTypeAny>(event: H3Event, schema: T): z.infer<T> {
  const query = getQuery(event);
  return schema.parse(query);
}

export function readValidatedParam<T extends z.ZodTypeAny>(event: H3Event, name: string, schema: T): z.infer<T> {
  const value = getRouterParam(event, name);
  return schema.parse(value);
}
