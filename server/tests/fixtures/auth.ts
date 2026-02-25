import type { User } from "~~/server/domain/user/entity";

export const baseUser: User = {
    id: "user-1",
    name: "Иван",
    email: "user@example.com",
    phone: null,
    emailVerifiedAt: new Date(),
    phoneVerifiedAt: null,
    emailVerificationCodeHash: null,
    emailVerificationExpiresAt: null,
    emailVerificationRequestedAt: null,
    phoneVerificationCodeHash: null,
    phoneVerificationExpiresAt: null,
    phoneVerificationRequestedAt: null,
    passwordHash: "password-hash",
    createdAt: new Date(),
    updatedAt: null,
    sessionVersion: 0,
    status: "active",
};
