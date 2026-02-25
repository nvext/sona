import { z } from "zod";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { readValidatedBody } from "~~/server/infrastructure/http/api/validation";
import { resolveUseCases } from "~~/server/infrastructure/http/api/use-cases";
import { setAuthCookies } from "~~/server/infrastructure/http/api/auth";
import { toAuthUserPayload } from "../user-payload";
import { resolveUserByCredentials } from "./credentials";

const confirmRegistrationSchema = z.union([
    z.object({
        email: z.string().email(),
        password: z.string().min(1),
        code: z.string().min(1),
    }),
    z.object({
        phone: z.string().min(5),
        password: z.string().min(1),
        code: z.string().min(1),
    }),
]);

export default defineApiHandler(async (event) => {
    const input = await readValidatedBody(event, confirmRegistrationSchema);
    const { userId, channel, identifier } = await resolveUserByCredentials(event, input as any);

    const verificationResult = await resolveUseCases(event).confirmContactVerification.execute({
        userId,
        channel,
        code: input.code,
    });

    const loginResult = await resolveUseCases(event).login.execute(
        channel === "email"
            ? { email: identifier, password: input.password }
            : { phone: identifier, password: input.password },
    );
    setAuthCookies(event, loginResult.accessToken, loginResult.refreshToken);

    return {
        ok: true,
        user: toAuthUserPayload(verificationResult.user),
    };
});
