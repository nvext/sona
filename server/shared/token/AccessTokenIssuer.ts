export interface AccessTokenIssuer {
    issue(input: { userId: string; sessionId: string; sessionVersion: number }): string;
}
