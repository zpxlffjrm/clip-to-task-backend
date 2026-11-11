-- CreateTable
CREATE TABLE "users"."tb_meeting_participants" (
    "id" UUID NOT NULL,
    "meeting_record_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "speaker_label" VARCHAR,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_meeting_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tb_meeting_participants_meeting_record_id_idx" ON "users"."tb_meeting_participants"("meeting_record_id");

-- AddForeignKey
ALTER TABLE "users"."tb_meeting_participants" ADD CONSTRAINT "tb_meeting_participants_meeting_record_id_fkey" FOREIGN KEY ("meeting_record_id") REFERENCES "users"."tb_meeting_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
