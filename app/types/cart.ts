export type CartItem = {
    id: string;
    productId: string;
    productColorId: string;
    title: string;
    colorName: string;
    colorHex: string;
    width: number;
    height: number;
    thickness: number;
    price: number;
    currency: "RUB";
    imageUrl: string | null;
    quantity: number;
};
