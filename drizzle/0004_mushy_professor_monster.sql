ALTER TABLE "files" ALTER COLUMN "storage_provider" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "storage_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "url" text;--> statement-breakpoint
UPDATE "files"
SET "url" = COALESCE(
    CASE
        WHEN "storage_bucket" IS NOT NULL AND "storage_key" IS NOT NULL
            THEN CONCAT('https://', "storage_bucket", '.s3.amazonaws.com/', "storage_key")
    END,
    CONCAT('file://', "id")
)
WHERE "url" IS NULL;--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "url" SET NOT NULL;
