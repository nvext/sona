CREATE TABLE "cart_items" (
	"id" text PRIMARY KEY NOT NULL,
	"cart_id" text NOT NULL,
	"product_card_id" text NOT NULL,
	"product_id" text NOT NULL,
	"product_color_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" text NOT NULL,
	"contact_name" text,
	"contact_phone" text,
	"contact_email" text,
	"contact_telegram" text,
	"created_at" timestamp NOT NULL,
	"submitted_at" timestamp,
	"sent_at" timestamp,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"is_active" boolean NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_colors" (
	"id" text PRIMARY KEY NOT NULL,
	"product_card_id" text NOT NULL,
	"name" text NOT NULL,
	"hex" text NOT NULL,
	"image_ids" jsonb NOT NULL,
	"is_active" boolean NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"order_request_id" text NOT NULL,
	"product_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"color_id" text NOT NULL,
	"color_name" text NOT NULL,
	"color_hex" text NOT NULL,
	"image_ids" jsonb NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"thickness" integer NOT NULL,
	"price" integer NOT NULL,
	"currency" text NOT NULL,
	"captured_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"product_color_id" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"thickness" integer NOT NULL,
	"price" integer NOT NULL,
	"currency" text NOT NULL,
	"is_active" boolean NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"last_seen_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"refresh_token_hash" text NOT NULL,
	"refresh_token_family_id" text NOT NULL,
	"refresh_token_fingerprint" text NOT NULL,
	"version" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"phone" text,
	"password_hash" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp,
	"session_version" integer NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_cart_product_color_unique" ON "cart_items" USING btree ("cart_id","product_id","product_color_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_requests_user_idempotency_unique" ON "order_requests" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "product_cards_slug_unique" ON "product_cards" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_refresh_token_fingerprint_unique" ON "sessions" USING btree ("refresh_token_fingerprint");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_unique" ON "users" USING btree ("phone");