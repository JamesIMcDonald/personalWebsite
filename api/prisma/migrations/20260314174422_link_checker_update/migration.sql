/*
  Warnings:

  - You are about to drop the column `status_code` on the `link_checker_pages` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[job_id,id]` on the table `link_checker_pages` will be added. If there are existing duplicate values, this will fail.
  - Made the column `job_id` on table `link_checker_links` required. This step will fail if there are existing NULL values in that column.
  - Made the column `from_url_id` on table `link_checker_links` required. This step will fail if there are existing NULL values in that column.
  - Made the column `to_url_id` on table `link_checker_links` required. This step will fail if there are existing NULL values in that column.
  - Made the column `job_id` on table `link_checker_pages` required. This step will fail if there are existing NULL values in that column.
  - Made the column `url` on table `link_checker_pages` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "link_checker_links" ALTER COLUMN "job_id" SET NOT NULL,
ALTER COLUMN "from_url_id" SET NOT NULL,
ALTER COLUMN "from_url_id" SET DATA TYPE BIGINT,
ALTER COLUMN "to_url_id" SET NOT NULL,
ALTER COLUMN "to_url_id" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "link_checker_pages" DROP COLUMN "status_code",
ALTER COLUMN "job_id" SET NOT NULL,
ALTER COLUMN "url" SET NOT NULL;

-- CreateIndex
CREATE INDEX "link_checker_links_job_id_from_url_id_idx" ON "link_checker_links"("job_id", "from_url_id");

-- CreateIndex
CREATE INDEX "link_checker_links_job_id_to_url_id_idx" ON "link_checker_links"("job_id", "to_url_id");

-- CreateIndex
CREATE UNIQUE INDEX "link_checker_pages_job_id_id_key" ON "link_checker_pages"("job_id", "id");

-- AddForeignKey
ALTER TABLE "link_checker_links" ADD CONSTRAINT "link_checker_links_from_url_id_fkey" FOREIGN KEY ("from_url_id") REFERENCES "link_checker_pages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_checker_links" ADD CONSTRAINT "link_checker_links_to_url_id_fkey" FOREIGN KEY ("to_url_id") REFERENCES "link_checker_pages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
