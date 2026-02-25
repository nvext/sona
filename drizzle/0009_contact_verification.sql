ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp;
ALTER TABLE "users" ADD COLUMN "phone_verified_at" timestamp;
ALTER TABLE "users" ADD COLUMN "email_verification_code_hash" text;
ALTER TABLE "users" ADD COLUMN "email_verification_expires_at" timestamp;
ALTER TABLE "users" ADD COLUMN "email_verification_requested_at" timestamp;
ALTER TABLE "users" ADD COLUMN "phone_verification_code_hash" text;
ALTER TABLE "users" ADD COLUMN "phone_verification_expires_at" timestamp;
ALTER TABLE "users" ADD COLUMN "phone_verification_requested_at" timestamp;
