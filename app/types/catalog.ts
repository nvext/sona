export type CatalogImage = {
    id: string;
    url: string;
};

export type CatalogColor = {
    colorId: string;
    hex: string;
    images: CatalogImage[];
};

export type CatalogCardItem = {
    cardId: string;
    slug: string;
    title: string;
    description: string;
    type: "panel";
    minPrice: number;
    currency: "RUB";
    colors: CatalogColor[];
};

export type CatalogResponse = {
    data: CatalogCardItem[];
    meta: {
        pagination: {
            offset: number;
            limit: number;
        };
        total: number;
    };
};

export type ProductDetailsColor = {
    id: string;
    productCardId: string;
    name: string;
    hex: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    images: CatalogImage[];
};

export type ProductDetailsProduct = {
    id: string;
    cardId: string;
    productColorId: string;
    width: number;
    height: number;
    thickness: number;
    price: number;
    currency: "RUB";
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type ProductDetailsResponse = {
    card: {
        id: string;
        type: "panel";
        slug: string;
        title: string;
        description: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
    };
    colors: ProductDetailsColor[];
    products: ProductDetailsProduct[];
};
