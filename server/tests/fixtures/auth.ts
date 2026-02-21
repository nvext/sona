import type { User } from "~~/server/domain/user/entity";

export const baseUser: User = {
    id: "user-1",
    name: "Иван",
    email: "user@example.com",
    phone: null,
    passwordHash: "password-hash",
    createdAt: new Date(),
    updatedAt: null,
    sessionVersion: 0,
    status: "active",
};
