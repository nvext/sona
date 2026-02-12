import { SessionRepo } from "~~/server/domain/session/repo";

export class Logout {
    constructor(private readonly sessionRepo: SessionRepo) {}

    async execute(input: LogoutInput) {
        await this.sessionRepo.revoke({ id: input.sessionId, now: new Date() });
    }
}

type LogoutInput = {
    sessionId: string;
};
