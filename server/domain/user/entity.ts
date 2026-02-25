export interface User {
	id: string
	name: string | null
	email: string | null
	phone: string | null
	role?: 'customer' | 'admin'
	emailVerifiedAt: Date | null
	phoneVerifiedAt: Date | null
	emailVerificationCodeHash: string | null
	emailVerificationExpiresAt: Date | null
	emailVerificationRequestedAt: Date | null
	phoneVerificationCodeHash: string | null
	phoneVerificationExpiresAt: Date | null
	phoneVerificationRequestedAt: Date | null
	passwordHash: string
	createdAt: Date
	updatedAt: Date | null
	sessionVersion: number
	status: 'active' | 'blocked' | 'deleted'
}
