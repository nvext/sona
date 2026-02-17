import { Currency } from "~~/server/shared/types";

export interface Product {
    id: string;

    cardId: string;

    productColorId: string;

    width: number;
    height: number;
    thickness: number;

    price: number;
    currency: Currency;

    isActive: boolean;

    createdAt: Date;
    updatedAt: Date;
}
