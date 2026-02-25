import { z } from "zod";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { requireAuth } from "~~/server/infrastructure/http/api/auth";
import { resolveUseCases } from "~~/server/infrastructure/http/api/use-cases";
import { readValidatedBody } from "~~/server/infrastructure/http/api/validation";

const requestVerificationSchema = z.object({
    channel: z.enum(["email", "phone"]),
});

export default defineApiHandler(async (event) => {
    const auth = await requireAuth(event);
    const input = await readValidatedBody(event, requestVerificationSchema);
    const result = await resolveUseCases(event).requestContactVerification.execute({
        userId: auth.userId,
        channel: input.channel,
    });

    return {
        ok: true,
        channel: result.channel,
        expiresAt: result.expiresAt,
        retryAfterMs: result.retryAfterMs,
    };
});
