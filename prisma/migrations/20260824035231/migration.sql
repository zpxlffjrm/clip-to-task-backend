-- CreateTable
CREATE TABLE "users"."tb_action_items" (
    "id" UUID NOT NULL,
    "meeting_record_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "assignee" VARCHAR NOT NULL,
    "task" TEXT NOT NULL,
    "deadline" TIMESTAMPTZ(3),
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_action_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tb_action_items_user_id_is_completed_deadline_idx" ON "users"."tb_action_items"("user_id", "is_completed", "deadline");

-- CreateIndex
CREATE INDEX "tb_action_items_meeting_record_id_idx" ON "users"."tb_action_items"("meeting_record_id");

-- AddForeignKey
ALTER TABLE "users"."tb_action_items" ADD CONSTRAINT "tb_action_items_meeting_record_id_fkey" FOREIGN KEY ("meeting_record_id") REFERENCES "users"."tb_meeting_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"."tb_action_items" ADD CONSTRAINT "tb_action_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."tb_users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
