ALTER TABLE "order_requests" ADD COLUMN "delivery_attempts" integer;--> statement-breakpoint
UPDATE "order_requests" SET "delivery_attempts" = 0 WHERE "delivery_attempts" IS NULL;--> statement-breakpoint
ALTER TABLE "order_requests" ALTER COLUMN "delivery_attempts" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order_requests" ADD COLUMN "next_delivery_retry_at" timestamp;--> statement-breakpoint
ALTER TABLE "order_requests" ADD COLUMN "last_delivery_error" text;
