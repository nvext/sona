import { fileStorageProviders } from "./const";

export interface File {
    id: string;

    url: string;

    storageProvider: (typeof fileStorageProviders)[number] | null;
    storageBucket: string | null;
    storageKey: string | null;

    originalName: string;
    mimeType: string;
    sizeBytes: number;
    width: number | null;
    height: number | null;

    createdAt: Date;
    updatedAt: Date;
}
