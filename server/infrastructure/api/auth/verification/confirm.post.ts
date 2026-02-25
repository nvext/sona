import { z } from "zod";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { requireAuth } from "~~/server/infrastructure/http/api/auth";
import { resolveUseCases } from "~~/server/infrastructure/http/api/use-cases";
import { readValidatedBody } from "~~/server/infrastructure/http/api/validation";
import { toAuthUserPayload } from "../user-payload";

const confirmVerificationSchema = z.object({
    channel: z.enum(["email", "phone"]),
    code: z.string().min(1),
});

export default defineApiHandler(async (event) => {
    const auth = await requireAuth(event);
    const input = await readValidatedBody(event, confirmVerificationSchema);
    const result = await resolveUseCases(event).confirmContactVerification.execute({
        userId: auth.userId,
        channel: input.channel,
        code: input.code,
    });

    return {
        ok: true,
        channel: result.channel,
        verifiedAt: result.verifiedAt,
        user: toAuthUserPayload(result.user),
    };
});
