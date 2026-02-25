ALTER TABLE "users"
ADD COLUMN "role" text NOT NULL DEFAULT 'customer';

CREATE TABLE "catalog_drafts" (
  "id" text PRIMARY KEY NOT NULL,
  "status" text NOT NULL,
  "created_by" text NOT NULL REFERENCES "users"("id") ON DELETE restrict,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL,
  "published_at" timestamp
);

CREATE TABLE "files_staging" (
  "draft_id" text NOT NULL REFERENCES "catalog_drafts"("id") ON DELETE cascade,
  "id" text NOT NULL,
  "url" text NOT NULL,
  "storage_provider" text,
  "storage_bucket" text,
  "storage_key" text,
  "original_name" text NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" integer NOT NULL,
  "width" integer,
  "height" integer,
  "op" text NOT NULL,
  "row_version" integer NOT NULL,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL,
  CONSTRAINT "files_staging_pk" PRIMARY KEY("draft_id", "id")
);

CREATE TABLE "product_cards_staging" (
  "draft_id" text NOT NULL REFERENCES "catalog_drafts"("id") ON DELETE cascade,
  "id" text NOT NULL,
  "type" text NOT NULL,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "is_active" boolean NOT NULL,
  "op" text NOT NULL,
  "row_version" integer NOT NULL,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL,
  CONSTRAINT "product_cards_staging_pk" PRIMARY KEY("draft_id", "id")
);

CREATE TABLE "product_colors_staging" (
  "draft_id" text NOT NULL REFERENCES "catalog_drafts"("id") ON DELETE cascade,
  "id" text NOT NULL,
  "product_card_id" text NOT NULL,
  "name" text NOT NULL,
  "hex" text NOT NULL,
  "image_ids" jsonb NOT NULL,
  "is_active" boolean NOT NULL,
  "op" text NOT NULL,
  "row_version" integer NOT NULL,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL,
  CONSTRAINT "product_colors_staging_pk" PRIMARY KEY("draft_id", "id")
);

CREATE TABLE "products_staging" (
  "draft_id" text NOT NULL REFERENCES "catalog_drafts"("id") ON DELETE cascade,
  "id" text NOT NULL,
  "card_id" text NOT NULL,
  "product_color_id" text NOT NULL,
  "width" integer NOT NULL,
  "height" integer NOT NULL,
  "thickness" integer NOT NULL,
  "price" integer NOT NULL,
  "currency" text NOT NULL,
  "is_active" boolean NOT NULL,
  "op" text NOT NULL,
  "row_version" integer NOT NULL,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL,
  CONSTRAINT "products_staging_pk" PRIMARY KEY("draft_id", "id")
);
