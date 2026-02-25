import { and, eq } from "drizzle-orm";
import { createError, getHeader, readBody, readMultipartFormData } from "h3";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "~~/server/infrastructure/db/connection";
import { files, filesStaging } from "~~/server/infrastructure/db/schema";
import { requireAdmin } from "~~/server/infrastructure/http/api/admin-auth";
import { defineApiHandler } from "~~/server/infrastructure/http/api/handler";
import { resolveOrCreateOpenDraft, touchDraftUpdatedAt } from "~~/server/infrastructure/http/api/admin-catalog-draft";

const createFileByUrlSchema = z.object({
    draftId: z.string().trim().optional(),
    id: z.string().trim().min(1).optional(),
    url: z.string().trim().min(1),
    originalName: z.string().trim().min(1),
    mimeType: z.string().trim().min(1),
    sizeBytes: z.number().int().nonnegative(),
    width: z.number().int().positive().nullable().optional(),
    height: z.number().int().positive().nullable().optional(),
});

function sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

function resolveUploadExtension(fileName: string, mimeType: string): string {
    const fromName = extname(fileName);
    if (fromName.length > 0) {
        return fromName.toLowerCase();
    }
    if (mimeType === "image/png") return ".png";
    if (mimeType === "image/jpeg") return ".jpg";
    if (mimeType === "image/webp") return ".webp";
    if (mimeType === "image/gif") return ".gif";
    return ".bin";
}

export default defineApiHandler(async (event) => {
    const admin = await requireAdmin(event);
    const contentType = getHeader(event, "content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
        const parts = await readMultipartFormData(event);
        const filePart = parts?.find((part) => part.name === "file" && part.filename && part.data);
        if (!filePart?.filename || !filePart.data) {
            throw createError({ statusCode: 400, statusMessage: "Missing file in multipart payload" });
        }

        const draftIdPart = parts?.find((part) => part.name === "draftId");
        const requestedDraftId = draftIdPart?.data ? Buffer.from(draftIdPart.data).toString("utf8").trim() : "";
        const draftId = await resolveOrCreateOpenDraft({
            draftId: requestedDraftId.length > 0 ? requestedDraftId : undefined,
            userId: admin.userId,
        });

        const fileId = randomUUID();
        const fileNameSafe = sanitizeFileName(filePart.filename);
        const extension = resolveUploadExtension(filePart.filename, filePart.type ?? "application/octet-stream");
        const persistedName = `${fileId}-${fileNameSafe || `file${extension}`}`;
        const absoluteDir = join(process.cwd(), "public", "uploads", "admin");
        await mkdir(absoluteDir, { recursive: true });
        await writeFile(join(absoluteDir, persistedName), filePart.data);

        const now = new Date();
        const url = `/uploads/admin/${persistedName}`;
        await db.insert(filesStaging).values({
            draftId,
            id: fileId,
            url,
            storageProvider: null,
            storageBucket: null,
            storageKey: null,
            originalName: filePart.filename,
            mimeType: filePart.type ?? "application/octet-stream",
            sizeBytes: filePart.data.length,
            width: null,
            height: null,
            op: "create",
            rowVersion: 1,
            createdAt: now,
            updatedAt: now,
        });
        await touchDraftUpdatedAt(draftId);

        return {
            draftId,
            file: {
                id: fileId,
                url,
                originalName: filePart.filename,
                mimeType: filePart.type ?? "application/octet-stream",
                sizeBytes: filePart.data.length,
                width: null,
                height: null,
                hasDraft: true,
            },
        };
    }

    const input = createFileByUrlSchema.parse(await readBody(event));
    const draftId = await resolveOrCreateOpenDraft({ draftId: input.draftId, userId: admin.userId });
    const fileId = input.id ?? randomUUID();

    const [liveFile, stagedFile] = await Promise.all([
        db.select().from(files).where(eq(files.id, fileId)).limit(1),
        db
            .select()
            .from(filesStaging)
            .where(and(eq(filesStaging.draftId, draftId), eq(filesStaging.id, fileId)))
            .limit(1),
    ]);

    if (liveFile[0] || (stagedFile[0] && stagedFile[0].op !== "delete")) {
        throw createError({ statusCode: 409, statusMessage: "File id already exists" });
    }

    const now = new Date();
    await db
        .insert(filesStaging)
        .values({
            draftId,
            id: fileId,
            url: input.url,
            storageProvider: null,
            storageBucket: null,
            storageKey: null,
            originalName: input.originalName,
            mimeType: input.mimeType,
            sizeBytes: input.sizeBytes,
            width: input.width ?? null,
            height: input.height ?? null,
            op: "create",
            rowVersion: 1,
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: [filesStaging.draftId, filesStaging.id],
            set: {
                url: input.url,
                originalName: input.originalName,
                mimeType: input.mimeType,
                sizeBytes: input.sizeBytes,
                width: input.width ?? null,
                height: input.height ?? null,
                op: "create",
                rowVersion: 1,
                updatedAt: now,
            },
        });
    await touchDraftUpdatedAt(draftId);

    return {
        draftId,
        file: {
            id: fileId,
            url: input.url,
            originalName: input.originalName,
            mimeType: input.mimeType,
            sizeBytes: input.sizeBytes,
            width: input.width ?? null,
            height: input.height ?? null,
            hasDraft: true,
        },
    };
});
