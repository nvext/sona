import { z } from "zod";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { readValidatedBody } from "~~/server/infrastructure/http/api/validation";
import { resolveUseCases } from "~~/server/infrastructure/http/api/use-cases";
import { resolveUserByCredentials } from "./credentials";

const resendRegistrationSchema = z.union([
    z.object({
        email: z.string().email(),
        password: z.string().min(1),
    }),
    z.object({
        phone: z.string().min(5),
        password: z.string().min(1),
    }),
]);

export default defineApiHandler(async (event) => {
    const input = await readValidatedBody(event, resendRegistrationSchema);
    const { userId, channel } = await resolveUserByCredentials(event, input as any);
    const verification = await resolveUseCases(event).requestContactVerification.execute({
        userId,
        channel,
    });

    return {
        ok: true,
        channel: verification.channel,
        expiresAt: verification.expiresAt,
        retryAfterMs: verification.retryAfterMs,
    };
});
