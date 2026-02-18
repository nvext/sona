import { SessionRepo } from "~~/server/domain/session/repo";

export class Logout {
    constructor(private readonly sessionRepo: SessionRepo) {}

    async execute(input: LogoutInput): Promise<LogoutOutput> {
        const { data: revoked } = await this.sessionRepo.revoke({
            id: input.sessionId,
            now: new Date(),
        });

        return {
            revoked,
        };
    }
}

type LogoutInput = {
    sessionId: string;
};

type LogoutOutput = {
    revoked: boolean;
};
