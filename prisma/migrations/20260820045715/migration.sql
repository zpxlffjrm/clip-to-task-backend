/*
  Warnings:

  - You are about to alter the column `mongo_result_id` on the `tb_meeting_records` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `Char(24)`.

*/
-- AlterTable
ALTER TABLE "users"."tb_meeting_records" ALTER COLUMN "mongo_result_id" SET DATA TYPE CHAR(24);
