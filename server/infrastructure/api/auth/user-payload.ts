import type { User } from "~~/server/domain/user/entity";

export function toAuthUserPayload(user: User) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        emailVerified: user.emailVerifiedAt !== null,
        phoneVerified: user.phoneVerifiedAt !== null,
        status: user.status,
    };
}
