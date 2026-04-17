-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "hello_world_test" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" VARCHAR(255),
    "user_id" INTEGER,

    CONSTRAINT "hello_world_test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "job_type" VARCHAR(255),
    "job_status" VARCHAR(255),
    "user_id" INTEGER,
    "data" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_checker_links" (
    "id" BIGSERIAL NOT NULL,
    "job_id" INTEGER,
    "from_url_id" INTEGER,
    "to_url_id" INTEGER,

    CONSTRAINT "link_checker_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_checker_pages" (
    "id" BIGSERIAL NOT NULL,
    "job_id" INTEGER,
    "url" TEXT,
    "status_code" INTEGER,
    "fetched_at" TIMESTAMP(6),
    "destination_url" TEXT,

    CONSTRAINT "link_checker_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(100),
    "username" VARCHAR(100),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

