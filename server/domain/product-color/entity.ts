export interface ProductColor {
    id: string;

    productCardId: string;

    name: string;
    hex: string;

    imageIds: string[];
    isActive: boolean;

    createdAt: Date;
    updatedAt: Date;
}
