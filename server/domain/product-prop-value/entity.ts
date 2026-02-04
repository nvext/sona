export interface ProductPropValue {
    propId: string;
    productId: string;

    valueString: string | null;
    valueNumber: number | null;
    valueBoolean: boolean | null;

    createdAt: Date;
    updatedAt: Date | null;
}
