export interface Product {
	id: string
	cardId: string
	typeId: string
	sequence: number
	imageIds: string[]
	createdAt: Date
	updatedAt: Date | null
}