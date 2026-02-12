export interface Session {
	id: string
	userId: string
	createdAt: Date
	expiresAt: Date
	lastSeenAt: Date
	revokedAt: Date | null
	refreshTokenHash: string
	refreshTokenFamilyId: string
    refreshTokenFingerprint: string
	version: number
}