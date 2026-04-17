/*
  Warnings:

  - Made the column `job_id` on table `hello_world_test` required. This step will fail if there are existing NULL values in that column.
  - Made the column `data` on table `hello_world_test` required. This step will fail if there are existing NULL values in that column.
  - Made the column `user_id` on table `hello_world_test` required. This step will fail if there are existing NULL values in that column.
  - Made the column `job_type` on table `jobs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `job_status` on table `jobs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `user_id` on table `jobs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `google_id` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "hello_world_test" ALTER COLUMN "job_id" SET NOT NULL,
ALTER COLUMN "data" SET NOT NULL,
ALTER COLUMN "user_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "jobs" ALTER COLUMN "job_type" SET NOT NULL,
ALTER COLUMN "job_status" SET NOT NULL,
ALTER COLUMN "user_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "google_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "hello_world_test" ADD CONSTRAINT "hello_world_test_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
