export type AccessTokenClaims = {
    userId: string;
    sessionId: string;
    sessionVersion: number;
};

export interface AccessTokenVerifier {
    verify(token: string): AccessTokenClaims | null;
}
