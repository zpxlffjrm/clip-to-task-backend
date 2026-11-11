-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "users";

-- CreateEnum
CREATE TYPE "users"."JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED_UNPROCESSABLE', 'REJECTED_VIOLATION');

-- CreateTable
CREATE TABLE "users"."tb_users" (
    "uuid" UUID NOT NULL,
    "id" CHAR(20) NOT NULL,
    "password" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "name" VARCHAR,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "password_changed_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tb_users_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "auth"."tb_token" (
    "user_id" UUID NOT NULL,
    "access_token" VARCHAR,
    "refresh_token" VARCHAR,

    CONSTRAINT "tb_token_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "users"."tb_user_credits" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tb_user_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."tb_credit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" VARCHAR NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_credit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."tb_meeting_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR,
    "status" "users"."JobStatus" NOT NULL DEFAULT 'PENDING',
    "file_url" VARCHAR NOT NULL,
    "duration_sec" INTEGER,
    "mongo_result_id" VARCHAR,
    "error_message" VARCHAR,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tb_meeting_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tb_users_id_key" ON "users"."tb_users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "tb_users_email_key" ON "users"."tb_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tb_user_credits_user_id_key" ON "users"."tb_user_credits"("user_id");

-- AddForeignKey
ALTER TABLE "auth"."tb_token" ADD CONSTRAINT "tb_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."tb_users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."tb_user_credits" ADD CONSTRAINT "tb_user_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."tb_users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."tb_credit_logs" ADD CONSTRAINT "tb_credit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."tb_users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."tb_meeting_records" ADD CONSTRAINT "tb_meeting_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."tb_users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
