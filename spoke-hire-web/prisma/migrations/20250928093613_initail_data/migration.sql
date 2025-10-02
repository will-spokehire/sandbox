-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('OWNER_ONLY', 'REGISTERED', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "public"."MediaStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."VehicleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'DECLINED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supabaseId" TEXT,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "userType" "public"."UserType" NOT NULL DEFAULT 'OWNER_ONLY',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "street" TEXT,
    "city" TEXT,
    "county" TEXT,
    "postcode" TEXT,
    "country" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SteeringType" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "SteeringType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Collection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Vehicle" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "registration" TEXT,
    "engineCapacity" INTEGER,
    "numberOfSeats" INTEGER,
    "steeringId" TEXT,
    "gearbox" TEXT,
    "exteriorColour" TEXT,
    "interiorColour" TEXT,
    "condition" TEXT,
    "isRoadLegal" BOOLEAN NOT NULL DEFAULT true,
    "price" DECIMAL(10,2),
    "status" "public"."VehicleStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Media" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "public"."MediaType" NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "altText" TEXT,
    "originalUrl" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileSize" BIGINT,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "format" TEXT,
    "status" "public"."MediaStatus" NOT NULL DEFAULT 'READY',
    "vehicleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VehicleSource" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehicleId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "matchScore" INTEGER,
    "matchType" TEXT,
    "rawData" JSONB,

    CONSTRAINT "VehicleSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VehicleSpecification" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehicleId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,

    CONSTRAINT "VehicleSpecification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VehicleCollection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehicleId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,

    CONSTRAINT "VehicleCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseId_key" ON "public"."User"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_supabaseId_idx" ON "public"."User"("supabaseId");

-- CreateIndex
CREATE INDEX "User_userType_idx" ON "public"."User"("userType");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "public"."User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SteeringType_name_key" ON "public"."SteeringType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SteeringType_code_key" ON "public"."SteeringType"("code");

-- CreateIndex
CREATE INDEX "SteeringType_code_idx" ON "public"."SteeringType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_name_key" ON "public"."Collection"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "public"."Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_slug_idx" ON "public"."Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_isActive_idx" ON "public"."Collection"("isActive");

-- CreateIndex
CREATE INDEX "Vehicle_make_model_idx" ON "public"."Vehicle"("make", "model");

-- CreateIndex
CREATE INDEX "Vehicle_year_idx" ON "public"."Vehicle"("year");

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "public"."Vehicle"("status");

-- CreateIndex
CREATE INDEX "Vehicle_engineCapacity_idx" ON "public"."Vehicle"("engineCapacity");

-- CreateIndex
CREATE INDEX "Vehicle_numberOfSeats_idx" ON "public"."Vehicle"("numberOfSeats");

-- CreateIndex
CREATE INDEX "Vehicle_isRoadLegal_idx" ON "public"."Vehicle"("isRoadLegal");

-- CreateIndex
CREATE INDEX "Vehicle_price_idx" ON "public"."Vehicle"("price");

-- CreateIndex
CREATE INDEX "Vehicle_ownerId_idx" ON "public"."Vehicle"("ownerId");

-- CreateIndex
CREATE INDEX "Media_vehicleId_order_idx" ON "public"."Media"("vehicleId", "order");

-- CreateIndex
CREATE INDEX "Media_type_idx" ON "public"."Media"("type");

-- CreateIndex
CREATE INDEX "Media_status_idx" ON "public"."Media"("status");

-- CreateIndex
CREATE INDEX "Media_isPrimary_idx" ON "public"."Media"("isPrimary");

-- CreateIndex
CREATE INDEX "VehicleSource_vehicleId_idx" ON "public"."VehicleSource"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleSource_sourceType_sourceId_key" ON "public"."VehicleSource"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "VehicleSpecification_vehicleId_category_idx" ON "public"."VehicleSpecification"("vehicleId", "category");

-- CreateIndex
CREATE INDEX "VehicleCollection_vehicleId_idx" ON "public"."VehicleCollection"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleCollection_collectionId_idx" ON "public"."VehicleCollection"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleCollection_vehicleId_collectionId_key" ON "public"."VehicleCollection"("vehicleId", "collectionId");

-- AddForeignKey
ALTER TABLE "public"."Vehicle" ADD CONSTRAINT "Vehicle_steeringId_fkey" FOREIGN KEY ("steeringId") REFERENCES "public"."SteeringType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vehicle" ADD CONSTRAINT "Vehicle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Media" ADD CONSTRAINT "Media_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VehicleSource" ADD CONSTRAINT "VehicleSource_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VehicleSpecification" ADD CONSTRAINT "VehicleSpecification_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VehicleCollection" ADD CONSTRAINT "VehicleCollection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VehicleCollection" ADD CONSTRAINT "VehicleCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
