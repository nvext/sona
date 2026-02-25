export type AdminCatalogCard = {
    id: string;
    slug: string;
    title: string;
    type: string;
    description?: string;
    isActive: boolean;
    hasDraft?: boolean;
    updatedAt?: string;
};

export type AdminCatalogColor = {
    id: string;
    productCardId: string;
    name: string;
    hex: string;
    imageIds: string[];
    isActive: boolean;
    hasDraft?: boolean;
    images?: Array<{ id: string; url: string }>;
};

export type AdminCatalogProduct = {
    id: string;
    cardId: string;
    productColorId: string;
    width: number;
    height: number;
    thickness: number;
    price: number;
    currency: string;
    isActive: boolean;
    hasDraft?: boolean;
};

export type AdminFile = {
    id: string;
    url: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    width: number | null;
    height: number | null;
    hasDraft?: boolean;
};
