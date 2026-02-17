import { ProductType } from "./types";

export interface ProductCard {
    id: string;
    type: ProductType;

    slug: string;
    title: string;
    description: string;

    isActive: boolean;

    createdAt: Date;
    updatedAt: Date;
}
