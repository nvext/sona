import { resolveContainer } from '~~/server/infrastructure/http/api/use-cases';
import { defineApiHandler } from '~~/server/infrastructure/http/api/handler';
import { requireAuth } from '~~/server/infrastructure/http/api/auth';

export default defineApiHandler(async (event) => {
  const auth = await requireAuth(event);
  const container = resolveContainer(event);
  const { data: user } = await container.repos.userRepo.getById({ id: auth.userId });
  if (!user) {
    return { user: null };
  }
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
    },
  };
});
