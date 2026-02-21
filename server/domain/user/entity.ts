export interface User {
	id: string
	name: string | null
	email: string | null
	phone: string | null
	passwordHash: string
	createdAt: Date
	updatedAt: Date | null
	sessionVersion: number
	status: 'active' | 'blocked' | 'deleted'
}
