/*
  Warnings:

  - You are about to drop the column `make` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `Vehicle` table. All the data in the column will be lost.
  - Added the required column `makeId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modelId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Vehicle_make_model_idx";

-- AlterTable
ALTER TABLE "public"."Vehicle" DROP COLUMN "make",
DROP COLUMN "model",
ADD COLUMN     "makeId" TEXT NOT NULL,
ADD COLUMN     "modelId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."Make" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Make_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Model" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "makeId" TEXT NOT NULL,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Make_name_key" ON "public"."Make"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Make_slug_key" ON "public"."Make"("slug");

-- CreateIndex
CREATE INDEX "Make_slug_idx" ON "public"."Make"("slug");

-- CreateIndex
CREATE INDEX "Make_isActive_idx" ON "public"."Make"("isActive");

-- CreateIndex
CREATE INDEX "Model_makeId_idx" ON "public"."Model"("makeId");

-- CreateIndex
CREATE INDEX "Model_slug_idx" ON "public"."Model"("slug");

-- CreateIndex
CREATE INDEX "Model_isActive_idx" ON "public"."Model"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Model_makeId_slug_key" ON "public"."Model"("makeId", "slug");

-- CreateIndex
CREATE INDEX "Vehicle_makeId_idx" ON "public"."Vehicle"("makeId");

-- CreateIndex
CREATE INDEX "Vehicle_modelId_idx" ON "public"."Vehicle"("modelId");

-- CreateIndex
CREATE INDEX "Vehicle_makeId_modelId_idx" ON "public"."Vehicle"("makeId", "modelId");

-- AddForeignKey
ALTER TABLE "public"."Model" ADD CONSTRAINT "Model_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "public"."Make"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vehicle" ADD CONSTRAINT "Vehicle_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "public"."Make"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vehicle" ADD CONSTRAINT "Vehicle_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "public"."Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
