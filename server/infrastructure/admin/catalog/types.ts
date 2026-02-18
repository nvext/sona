import { z } from "zod";

const sourceImageSchema = z.union([
    z.string().min(1),
    z.object({
        id: z.string().min(1).optional(),
        path: z.string().min(1),
    }),
    z.object({
        id: z.string().min(1).optional(),
        url: z.string().url(),
        originalName: z.string().min(1).optional(),
        mimeType: z.string().min(1).optional(),
        sizeBytes: z.number().int().nonnegative().optional(),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
    }),
]);

const sourceSizeSchema = z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
});

const sourceColorSchema = z.object({
    id: z.string().min(1).optional(),
    name: z.string().min(1),
    hex: z.string().min(1),
    isActive: z.boolean().optional(),
    images: z.array(sourceImageSchema).default([]),
});

const sourceMatrixSchema = z.object({
    sizes: z.array(sourceSizeSchema).min(1),
    thicknesses: z.array(z.number().int().positive()).min(1),
});

const sourceCardSchema = z.object({
    id: z.string().min(1),
    type: z.literal("panel"),
    slug: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    isActive: z.boolean().optional(),
    price: z.number().int().nonnegative(),
    currency: z.literal("RUB"),
    colors: z.array(sourceColorSchema).min(1),
    matrix: sourceMatrixSchema,
});

export const sourceCatalogSchema = z.object({
    cards: z.array(sourceCardSchema).min(1),
});

export type SourceCatalog = z.infer<typeof sourceCatalogSchema>;

const expandedFileSchema = z.object({
    id: z.string().min(1),
    url: z.string().min(1),
    originalName: z.string().min(1),
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().nonnegative(),
    width: z.number().int().positive().nullable(),
    height: z.number().int().positive().nullable(),
});

const expandedProductCardSchema = z.object({
    id: z.string().min(1),
    type: z.literal("panel"),
    slug: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    isActive: z.boolean(),
});

const expandedProductColorSchema = z.object({
    id: z.string().min(1),
    productCardId: z.string().min(1),
    name: z.string().min(1),
    hex: z.string().min(1),
    imageIds: z.array(z.string().min(1)),
    isActive: z.boolean(),
});

const expandedProductSchema = z.object({
    id: z.string().min(1),
    cardId: z.string().min(1),
    productColorId: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    thickness: z.number().int().positive(),
    price: z.number().int().nonnegative(),
    currency: z.literal("RUB"),
    isActive: z.boolean(),
});

export const expandedCatalogSchema = z.object({
    files: z.array(expandedFileSchema),
    productCards: z.array(expandedProductCardSchema),
    productColors: z.array(expandedProductColorSchema),
    products: z.array(expandedProductSchema),
});

export type ExpandedCatalog = z.infer<typeof expandedCatalogSchema>;
