export interface User {
	id: string
	email: string | null
	phone: string | null
	passwordHash: string
	createdAt: Date
	updatedAt: Date | null
	sessionVersion: number
	status: 'active' | 'blocked' | 'deleted'
}