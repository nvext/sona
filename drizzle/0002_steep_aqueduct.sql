CREATE TABLE "files" (
	"id" text PRIMARY KEY NOT NULL,
	"storage_provider" text NOT NULL,
	"storage_bucket" text,
	"storage_key" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
