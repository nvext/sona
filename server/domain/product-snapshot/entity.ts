import { Currency } from "~~/server/shared/types";

export interface ProductSnapshot {
    id: string;

    orderRequestId: string;

    productId: string;
    title: string;
    description: string;

    colorId: string;
    colorName: string;
    colorHex: string;

    imageIds: string[];

    width: number;
    height: number;
    thickness: number;

    price: number;
    currency: Currency;

    capturedAt: Date;
}
