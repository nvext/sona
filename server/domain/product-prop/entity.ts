export interface ProductProp {
    id: string;
    productTypeId: string;

    type: "string" | "number" | "boolean";
    name: string;

    createdAt: Date;
    updatedAt: Date | null;
}
