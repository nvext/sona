import { resolveUseCases } from '~~/server/infrastructure/http/api/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/http/api/handler';
import { readBody } from 'h3';
import { setAuthCookies, resolveRefreshToken } from '~~/server/infrastructure/http/api/auth';

export default defineApiHandler(async (event) => {
  const body = (await readBody(event)) ?? {};
  const refreshToken = typeof body.refreshToken === "string" && body.refreshToken.length > 0
    ? body.refreshToken
    : resolveRefreshToken(event);

  if (!refreshToken) {
    return { ok: false };
  }

  const result = await resolveUseCases(event).refresh.execute({ refreshToken });
  setAuthCookies(event, result.accessToken, result.refreshToken);
  return { ok: true };
});
