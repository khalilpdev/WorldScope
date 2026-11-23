-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "favorite_countries" (
    "id" UUID NOT NULL,
    "client_id" VARCHAR(64) NOT NULL,
    "country_code" VARCHAR(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_comparisons" (
    "id" UUID NOT NULL,
    "client_id" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120),
    "country_codes" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favorite_countries_client_id_created_at_idx" ON "favorite_countries"("client_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_countries_client_id_country_code_key" ON "favorite_countries"("client_id", "country_code");

-- CreateIndex
CREATE INDEX "saved_comparisons_client_id_updated_at_idx" ON "saved_comparisons"("client_id", "updated_at");

