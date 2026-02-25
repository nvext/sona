import { createError, type H3Event } from "h3";
import { requireAuth } from "./auth";
import { resolveContainer } from "./use-cases";

export async function requireAdmin(event: H3Event): Promise<{ userId: string }> {
    const auth = await requireAuth(event);
    const { data: user } = await resolveContainer(event).repos.userRepo.getById({ id: auth.userId });

    if (user === null || user.status !== "active" || user.role !== "admin") {
        throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }

    return { userId: user.id };
}
