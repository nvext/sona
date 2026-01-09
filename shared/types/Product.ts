export interface ProductVariant {
    name: string;
    images: string[];
    size: {
        width: number;
        height: number;
    };
    thickness: number;
    color: string;
    price: {
        rub: number;
    };
}

export interface Product {
    category: string;
    series: string;
    description: string;
    variants: ProductVariant[];
}
