-- CreateEnum: Add DealType enum if not exists
DO $$ BEGIN
    CREATE TYPE "DealType" AS ENUM ('PERSONAL_HIRE', 'PRODUCTION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: Add DealVehicleStatus enum if not exists
DO $$ BEGIN
    CREATE TYPE "DealVehicleStatus" AS ENUM ('ACTIVE', 'REMOVED', 'WINNER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Add dealType to Deal table if not exists
DO $$ BEGIN
    ALTER TABLE "Deal" ADD COLUMN "dealType" "DealType" NOT NULL DEFAULT 'PERSONAL_HIRE';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- AlterTable: Add missing columns to DealVehicle table
DO $$ BEGIN
    ALTER TABLE "DealVehicle" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "DealVehicle" ADD COLUMN "status" "DealVehicleStatus" NOT NULL DEFAULT 'ACTIVE';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "DealVehicle" ADD COLUMN "ownerRequestedFee" DECIMAL(10,2);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- CreateIndex: Add index on DealVehicle status
CREATE INDEX IF NOT EXISTS "DealVehicle_status_idx" ON "DealVehicle"("status");

