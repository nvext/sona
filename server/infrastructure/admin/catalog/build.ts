import {
    copyFileSync,
    mkdirSync,
    readFileSync,
    statSync,
    writeFileSync,
} from "node:fs";
import { basename, extname, isAbsolute, relative, resolve } from "node:path";
import { expandedCatalogSchema, sourceCatalogSchema, type ExpandedCatalog } from "./types";

const DEFAULT_SOURCE_PATH = "server/infrastructure/admin/catalog/source.json";
const DEFAULT_EXPANDED_PATH = "server/infrastructure/admin/catalog/expanded.json";
const DEFAULT_UPLOADS_DIR = "public/uploads/catalog";
const PROJECT_ROOT = process.cwd();

function getArg(name: string, fallback: string): string {
    const index = process.argv.indexOf(name);
    if (index === -1) {
        return fallback;
    }
    return process.argv[index + 1] ?? fallback;
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function inferOriginalName(url: string): string {
    const pathname = new URL(url).pathname;
    const name = basename(pathname);
    return name.length > 0 ? name : "file";
}

function looksLikeUrl(value: string): boolean {
    return value.startsWith("http://") || value.startsWith("https://");
}

function inferMimeType(filePath: string): string {
    const extension = extname(filePath).toLowerCase();
    if (extension === ".jpg" || extension === ".jpeg") {
        return "image/jpeg";
    }
    if (extension === ".png") {
        return "image/png";
    }
    if (extension === ".webp") {
        return "image/webp";
    }
    if (extension === ".gif") {
        return "image/gif";
    }
    if (extension === ".svg") {
        return "image/svg+xml";
    }
    return "application/octet-stream";
}

function normalizePublicUrl(filePath: string, publicBaseUrl: string): string {
    const publicDir = resolve(PROJECT_ROOT, "public");
    const absolute = resolve(PROJECT_ROOT, filePath);
    const relativeFromPublic = relative(publicDir, absolute);
    if (relativeFromPublic.startsWith("..")) {
        throw new Error(`file path "${filePath}" must be inside "public" to build URL`);
    }
    const normalizedRelative = relativeFromPublic.split("\\").join("/");
    const pathUrl = `/${normalizedRelative}`;
    if (!publicBaseUrl) {
        return pathUrl;
    }
    return `${publicBaseUrl.replace(/\/+$/, "")}${pathUrl}`;
}

function resolveLocalFile(inputPath: string): string {
    return isAbsolute(inputPath) ? inputPath : resolve(PROJECT_ROOT, inputPath);
}

function ensureUnique<T extends { id: string }>(items: T[], label: string): void {
    const ids = new Set<string>();
    for (const item of items) {
        if (ids.has(item.id)) {
            throw new Error(`${label}: duplicate id "${item.id}"`);
        }
        ids.add(item.id);
    }
}

function buildExpandedCatalog(parameters: {
    sourcePath: string;
    uploadsDir: string;
    copyFiles: boolean;
    publicBaseUrl: string;
}): ExpandedCatalog {
    let copiedFiles = 0;
    const uploadsDirAbsolute = resolveLocalFile(parameters.uploadsDir);
    const sourceRaw = readFileSync(parameters.sourcePath, "utf8");
    const source = sourceCatalogSchema.parse(JSON.parse(sourceRaw));

    const filesById = new Map<string, ExpandedCatalog["files"][number]>();
    const productCards: ExpandedCatalog["productCards"] = [];
    const productColors: ExpandedCatalog["productColors"] = [];
    const products: ExpandedCatalog["products"] = [];

    for (const card of source.cards) {
        productCards.push({
            id: card.id,
            type: card.type,
            slug: card.slug,
            title: card.title,
            description: card.description,
            isActive: card.isActive ?? true,
        });

        for (let colorIndex = 0; colorIndex < card.colors.length; colorIndex += 1) {
            const color = card.colors[colorIndex];
            const colorId = color.id ?? `${card.id}-color-${colorIndex + 1}-${slugify(color.name)}`;
            const imageIds: string[] = [];

            for (let imageIndex = 0; imageIndex < color.images.length; imageIndex += 1) {
                const inputImage = color.images[imageIndex];
                const imageId =
                    (typeof inputImage === "string"
                        ? undefined
                        : inputImage.id) ?? `${colorId}-img-${imageIndex + 1}`;
                let file: ExpandedCatalog["files"][number];

                if (typeof inputImage === "string" && !looksLikeUrl(inputImage)) {
                    const sourcePathAbsolute = resolveLocalFile(inputImage);
                    const sourceStat = statSync(sourcePathAbsolute);
                    const sourceName = basename(sourcePathAbsolute);
                    const sourceExt = extname(sourceName).toLowerCase();
                    const outputName = sourceExt ? `${imageId}${sourceExt}` : imageId;
                    const outputAbsolute = resolve(uploadsDirAbsolute, outputName);
                    if (parameters.copyFiles && outputAbsolute !== sourcePathAbsolute) {
                        mkdirSync(uploadsDirAbsolute, { recursive: true });
                        copyFileSync(sourcePathAbsolute, outputAbsolute);
                        copiedFiles += 1;
                    }
                    file = {
                        id: imageId,
                        url: normalizePublicUrl(
                            parameters.copyFiles ? outputAbsolute : sourcePathAbsolute,
                            parameters.publicBaseUrl,
                        ),
                        originalName: sourceName,
                        mimeType: inferMimeType(sourceName),
                        sizeBytes: sourceStat.size,
                        width: null,
                        height: null,
                    };
                } else if (typeof inputImage === "string") {
                    file = {
                        id: imageId,
                        url: inputImage,
                        originalName: inferOriginalName(inputImage),
                        mimeType: "image/jpeg",
                        sizeBytes: 0,
                        width: null,
                        height: null,
                    };
                } else if ("path" in inputImage) {
                    const sourcePathAbsolute = resolveLocalFile(inputImage.path);
                    const sourceStat = statSync(sourcePathAbsolute);
                    const sourceName = basename(sourcePathAbsolute);
                    const sourceExt = extname(sourceName).toLowerCase();
                    const outputName = sourceExt ? `${imageId}${sourceExt}` : imageId;
                    const outputAbsolute = resolve(uploadsDirAbsolute, outputName);
                    if (parameters.copyFiles && outputAbsolute !== sourcePathAbsolute) {
                        mkdirSync(uploadsDirAbsolute, { recursive: true });
                        copyFileSync(sourcePathAbsolute, outputAbsolute);
                        copiedFiles += 1;
                    }
                    file = {
                        id: imageId,
                        url: normalizePublicUrl(
                            parameters.copyFiles ? outputAbsolute : sourcePathAbsolute,
                            parameters.publicBaseUrl,
                        ),
                        originalName: sourceName,
                        mimeType: inferMimeType(sourceName),
                        sizeBytes: sourceStat.size,
                        width: null,
                        height: null,
                    };
                } else {
                    file = {
                        id: imageId,
                        url: inputImage.url,
                        originalName: inputImage.originalName ?? inferOriginalName(inputImage.url),
                        mimeType: inputImage.mimeType ?? "image/jpeg",
                        sizeBytes: inputImage.sizeBytes ?? 0,
                        width: inputImage.width ?? null,
                        height: inputImage.height ?? null,
                    };
                }

                const existing = filesById.get(imageId);
                if (existing) {
                    if (existing.url !== file.url) {
                        throw new Error(
                            `files: duplicate id "${imageId}" with different url (${existing.url} vs ${file.url})`,
                        );
                    }
                } else {
                    filesById.set(imageId, file);
                }
                imageIds.push(imageId);
            }

            productColors.push({
                id: colorId,
                productCardId: card.id,
                name: color.name,
                hex: color.hex,
                imageIds,
                isActive: color.isActive ?? true,
            });

            for (const size of card.matrix.sizes) {
                for (const thickness of card.matrix.thicknesses) {
                    products.push({
                        id: `${card.id}-${colorId}-${size.width}x${size.height}x${thickness}`,
                        cardId: card.id,
                        productColorId: colorId,
                        width: size.width,
                        height: size.height,
                        thickness,
                        price: card.price,
                        currency: card.currency,
                        isActive: card.isActive ?? true,
                    });
                }
            }
        }
    }

    const expanded: ExpandedCatalog = {
        files: [...filesById.values()],
        productCards,
        productColors,
        products,
    };

    ensureUnique(expanded.files, "files");
    ensureUnique(expanded.productCards, "productCards");
    ensureUnique(expanded.productColors, "productColors");
    ensureUnique(expanded.products, "products");

    const validated = expandedCatalogSchema.parse(expanded);
    console.log(`[admin:catalog:build] copied files: ${copiedFiles}`);
    return validated;
}

const sourcePath = getArg("--in", DEFAULT_SOURCE_PATH);
const outputPath = getArg("--out", DEFAULT_EXPANDED_PATH);
const uploadsDir = getArg("--uploads-dir", DEFAULT_UPLOADS_DIR);
const publicBaseUrl = getArg("--public-base-url", "");
const copyFiles = !process.argv.includes("--no-copy-files");

const expanded = buildExpandedCatalog({
    sourcePath,
    uploadsDir,
    copyFiles,
    publicBaseUrl,
});
writeFileSync(outputPath, `${JSON.stringify(expanded, null, 2)}\n`, "utf8");
console.log(
    `[admin:catalog:build] written ${outputPath}: files=${expanded.files.length}, cards=${expanded.productCards.length}, colors=${expanded.productColors.length}, products=${expanded.products.length}, uploadsDir=${uploadsDir}, copyFiles=${copyFiles}`,
);
