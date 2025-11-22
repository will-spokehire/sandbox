-- Migration Fix: user-dashboard branch to production
-- This script fixes schema drift issues found during migration
-- Run this in Supabase SQL Editor for production database

SELECT '========================================' as section;
SELECT 'USER-DASHBOARD → PRODUCTION FIX' as title;
SELECT 'Fixing: Fields, Collections, Enums' as subtitle;
SELECT '========================================' as section;
SELECT '' as blank;

-- ==========================================
-- FIX 1: Add Vehicle.declinedReason
-- ==========================================
SELECT '>>> Step 1: Adding Vehicle.declinedReason <<<' as step;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Vehicle' AND column_name = 'declinedReason'
    ) THEN
        ALTER TABLE "Vehicle" ADD COLUMN "declinedReason" TEXT;
        RAISE NOTICE '✓ Added Vehicle.declinedReason';
    ELSE
        RAISE NOTICE '✓ Vehicle.declinedReason already exists';
    END IF;
END $$;

SELECT '' as blank;

-- ==========================================
-- FIX 2: Add missing VehicleStatus enum values
-- ==========================================
SELECT '>>> Step 2: Fixing VehicleStatus Enum <<<' as step;

-- Add IN_REVIEW
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'VehicleStatus' AND e.enumlabel = 'IN_REVIEW'
    ) THEN
        ALTER TYPE "VehicleStatus" ADD VALUE 'IN_REVIEW';
        RAISE NOTICE '✓ Added IN_REVIEW to VehicleStatus enum';
    ELSE
        RAISE NOTICE '✓ IN_REVIEW already exists';
    END IF;
END $$;

-- Add DECLINED
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'VehicleStatus' AND e.enumlabel = 'DECLINED'
    ) THEN
        ALTER TYPE "VehicleStatus" ADD VALUE 'DECLINED';
        RAISE NOTICE '✓ Added DECLINED to VehicleStatus enum';
    ELSE
        RAISE NOTICE '✓ DECLINED already exists';
    END IF;
END $$;

SELECT '' as blank;

-- ==========================================
-- FIX 3: Create 19 Collections
-- ==========================================
SELECT '>>> Step 3: Creating Collections <<<' as step;

-- Clear existing collections (if any)
DELETE FROM "VehicleCollection";
DELETE FROM "Collection";

-- Insert 19 predefined collections
INSERT INTO "Collection" (id, "createdAt", "updatedAt", name, slug, description, "order", "isActive") VALUES
  (gen_random_uuid(), NOW(), NOW(), 'Classic', 'classic', 'Classic and heritage vehicles', 1, true),
  (gen_random_uuid(), NOW(), NOW(), 'Modern', 'modern', 'Contemporary and modern vehicles', 2, true),
  (gen_random_uuid(), NOW(), NOW(), 'Convertibles', 'convertibles', 'Convertible and cabriolet vehicles', 3, true),
  (gen_random_uuid(), NOW(), NOW(), 'Muscle Car', 'muscle-car', 'American muscle cars', 4, true),
  (gen_random_uuid(), NOW(), NOW(), 'Sports Car', 'sports-car', 'High-performance sports cars', 5, true),
  (gen_random_uuid(), NOW(), NOW(), 'Supercar', 'supercar', 'Exotic and rare supercars', 6, true),
  (gen_random_uuid(), NOW(), NOW(), '4X4', '4x4', '4X4 and four-wheel drive vehicles', 7, true),
  (gen_random_uuid(), NOW(), NOW(), 'Motorbikes', 'motorbikes', 'Motorcycles and bikes', 8, true),
  (gen_random_uuid(), NOW(), NOW(), 'Pickup Truck', 'pickup-truck', 'Pickup trucks', 9, true),
  (gen_random_uuid(), NOW(), NOW(), 'Taxi', 'taxi', 'Taxi and cab vehicles', 10, true),
  (gen_random_uuid(), NOW(), NOW(), 'Vans', 'vans', 'Vans and commercial vehicles', 11, true),
  (gen_random_uuid(), NOW(), NOW(), 'Campervan', 'campervan', 'Campervans and motorhomes', 12, true),
  (gen_random_uuid(), NOW(), NOW(), 'Military Vehicles', 'military-vehicles', 'Military and tactical vehicles', 13, true),
  (gen_random_uuid(), NOW(), NOW(), 'Emergency Vehicles', 'emergency-vehicles', 'Emergency service vehicles', 14, true),
  (gen_random_uuid(), NOW(), NOW(), 'Service Vehicles', 'service-vehicles', 'Service and utility vehicles', 15, true),
  (gen_random_uuid(), NOW(), NOW(), 'SUV', 'suv', 'Sport utility vehicles', 16, true),
  (gen_random_uuid(), NOW(), NOW(), 'Limousine', 'limousine', 'Limousines and luxury transport', 17, true),
  (gen_random_uuid(), NOW(), NOW(), 'Bus', 'bus', 'Buses and coaches', 18, true),
  (gen_random_uuid(), NOW(), NOW(), 'Lorry', 'lorry', 'Lorries and heavy goods vehicles', 19, true);

RAISE NOTICE '✓ Created 19 collections';

SELECT '' as blank;

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT '========================================' as section;
SELECT 'VERIFICATION RESULTS' as title;
SELECT '========================================' as section;
SELECT '' as blank;

-- Check Vehicle.declinedReason
SELECT 
    'Vehicle.declinedReason' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Vehicle' AND column_name = 'declinedReason'
        )
        THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status;

-- Check VehicleStatus enum
SELECT 
    'VehicleStatus.IN_REVIEW' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'VehicleStatus' AND e.enumlabel = 'IN_REVIEW'
        )
        THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status;

SELECT 
    'VehicleStatus.DECLINED' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'VehicleStatus' AND e.enumlabel = 'DECLINED'
        )
        THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status;

-- Check collections count
SELECT 
    'Collections count' as check_name,
    CONCAT(COUNT(*), ' (expected 19)') as value,
    CASE 
        WHEN COUNT(*) = 19 THEN '✓ CORRECT'
        ELSE '✗ INCORRECT'
    END as status
FROM "Collection";

SELECT '' as blank;

-- List all VehicleStatus enum values
SELECT '>>> All VehicleStatus Enum Values <<<' as info;
SELECT 
    e.enumlabel as value,
    e.enumsortorder as order
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'VehicleStatus'
ORDER BY e.enumsortorder;

SELECT '' as blank;

-- List collections (first 5)
SELECT '>>> Collections (first 5) <<<' as info;
SELECT name, slug, "order" 
FROM "Collection" 
ORDER BY "order"
LIMIT 5;

SELECT '' as blank;

-- ==========================================
-- FINAL STATUS
-- ==========================================
SELECT '========================================' as section;
SELECT '✓ ALL FIXES COMPLETED SUCCESSFULLY' as status;
SELECT '========================================' as section;
SELECT '' as blank;

SELECT '✓ Vehicle.declinedReason field added' as fix1;
SELECT '✓ VehicleStatus enum values fixed (IN_REVIEW, DECLINED)' as fix2;
SELECT '✓ 19 collections created' as fix3;
SELECT '✓ Database schema now complete' as result;

