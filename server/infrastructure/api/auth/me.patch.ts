import { z } from "zod";
import { resolveUseCases } from "~~/server/infrastructure/http/api/use-cases";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { requireAuth } from "~~/server/infrastructure/http/api/auth";
import { readValidatedBody } from "~~/server/infrastructure/http/api/validation";

const updateProfileSchema = z
    .object({
        email: z.string().email().nullable().optional(),
        phone: z.string().min(5).nullable().optional(),
    })
    .refine((value) => value.email !== undefined || value.phone !== undefined);

export default defineApiHandler(async (event) => {
    const auth = await requireAuth(event);
    const input = await readValidatedBody(event, updateProfileSchema);
    const result = await resolveUseCases(event).updateProfile.execute({
        userId: auth.userId,
        email: input.email,
        phone: input.phone,
    });

    return {
        user: {
            id: result.user.id,
            email: result.user.email,
            phone: result.user.phone,
            status: result.user.status,
        },
    };
});
