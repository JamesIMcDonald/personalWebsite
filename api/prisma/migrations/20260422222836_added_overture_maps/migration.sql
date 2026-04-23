/*
  Warnings:

  - You are about to drop the `hello_world_test` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "hello_world_test" DROP CONSTRAINT "hello_world_test_user_id_fkey";

-- DropTable
DROP TABLE "hello_world_test";

-- CreateTable
CREATE TABLE "overture_maps_places" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "map_id" TEXT NOT NULL,
    "name" TEXT,
    "category" TEXT,
    "basic_category" TEXT,
    "confidence" DECIMAL(65,30),
    "operating_status" VARCHAR(25) NOT NULL,
    "address" TEXT,
    "postcode" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "latitude" DECIMAL(65,30) NOT NULL,
    "longitude" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "overture_maps_places_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "link_checker_links" ADD CONSTRAINT "link_checker_links_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_checker_pages" ADD CONSTRAINT "link_checker_pages_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overture_maps_places" ADD CONSTRAINT "overture_maps_places_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
