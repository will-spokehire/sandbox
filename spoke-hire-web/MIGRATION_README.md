# 🚀 Vehicle Data Migration Guide

This document explains the database schema migration from the existing JSON-based vehicle data to the new PostgreSQL schema with unified media management.

## 📊 Database Schema Overview

### **Core Entities**

1. **User** - Vehicle owners (with optional Supabase integration)
2. **Vehicle** - Core vehicle information
3. **Media** - Unified images and videos
4. **SteeringType** - Lookup table for steering types
5. **Collection** - Tags/categories for vehicles
6. **VehicleSource** - Track original data sources
7. **VehicleSpecification** - Flexible vehicle specifications
8. **VehicleCollection** - Many-to-many vehicle-collection relationship

### **Key Features**

- ✅ **Unified Media**: Single table for both images and videos
- ✅ **Flexible Users**: Support for both anonymous owners and registered users
- ✅ **Source Tracking**: Maintain audit trail of original data
- ✅ **Normalized Data**: Proper relationships and constraints
- ✅ **Performance Optimized**: Strategic indexes for fast queries

## 🔄 Data Mapping Strategy

### **Source Data Types**

1. **Catalog Data** (`catalog_products.json`)
   - Wix product catalog with structured fields
   - Contains pricing, inventory, and product options
   - Rich metadata (SKU, brand, collections, etc.)

2. **Cleansed Data** (`cleansed_database.json`)
   - Form submissions with owner information
   - Complete vehicle specifications
   - Contact details and addresses

3. **Submission Data** (`submission.from.1march.2025.json`)
   - Raw form submissions with varied field names
   - Project briefs and condition descriptions
   - Image uploads and legal confirmations

### **Field Mappings**

| **Target Field** | **Catalog Source** | **Cleansed Source** | **Submission Source** |
|------------------|-------------------|-------------------|---------------------|
| `User.email` | N/A | `owner.email` | `email_4bec` |
| `User.firstName` | N/A | `owner.firstName` | `first_name_1` |
| `Vehicle.make` | `productOptionDescription1` | `vehicle.make` | `make_1` |
| `Vehicle.model` | `name` | `vehicle.model` | `location_1` |
| `Vehicle.engineCapacity` | Extract from description | `vehicle.engineCapacity` | `engine_capacity` |
| `Vehicle.numberOfSeats` | `productOptionDescription6` | `vehicle.numberOfSeats` | `number_of_seats_1` |
| `Media.originalUrl` | `productImageUrl` (split by ';') | `images.urls[]` | `upload_vehicle_images[]` |

### **Data Conversions**

- **Engine Capacity**: Convert strings like "1.8L", "1800cc" to integer CC values
- **Number of Seats**: Convert strings to integers
- **Road Legal**: Convert "Yes"/"No" strings to boolean
- **Status**: Map visibility/inventory to enum values
- **Media Type**: Determine from file extensions (.jpg → IMAGE, .mp4 → VIDEO)

## 🛠️ Migration Scripts

### **Available Commands**

```bash
# Analyze existing data without migrating
npm run analyze-data

# Run full migration
npm run migrate-data

# Generate Prisma client
npm run postinstall

# Create database migration
npm run db:generate

# Apply database migration
npm run db:migrate
```

### **Migration Process**

1. **Data Analysis** - Analyze existing data structure and completeness
2. **Setup Reference Data** - Create steering types and collections
3. **User Migration** - Create users from owner data
4. **Vehicle Migration** - Create vehicles with proper relationships
5. **Media Migration** - Convert images/videos to unified media table
6. **Source Tracking** - Maintain audit trail of original data

## 📋 Pre-Migration Checklist

- [ ] **Database Setup**: PostgreSQL database is running and accessible
- [ ] **Environment Variables**: `DATABASE_URL` is configured
- [ ] **Data Files**: JSON files are available in `../../data-analitics/data/`
- [ ] **Dependencies**: All npm packages are installed
- [ ] **Backup**: Existing data is backed up (if applicable)

## 🚀 Running the Migration

### **Step 1: Install Dependencies**

```bash
cd spoke-hire-web
npm install
```

### **Step 2: Setup Database**

```bash
# Generate Prisma client
npm run postinstall

# Create database migration
npm run db:generate

# Apply migration to database
npm run db:migrate
```

### **Step 3: Analyze Data (Optional)**

```bash
# Analyze existing data structure
npm run analyze-data
```

### **Step 4: Run Migration**

```bash
# Run full data migration
npm run migrate-data
```

## 📊 Expected Results

After successful migration, you should have:

- **Users**: ~875 unique users from cleansed/submission data
- **Vehicles**: ~1600+ vehicles from all sources
- **Media**: ~5000+ images/videos
- **Collections**: ~10+ vehicle categories
- **Sources**: Complete audit trail of original data

## 🔍 Verification

### **Database Queries to Verify Migration**

```sql
-- Check user counts
SELECT userType, COUNT(*) FROM "User" GROUP BY userType;

-- Check vehicle distribution by status
SELECT status, COUNT(*) FROM "Vehicle" GROUP BY status;

-- Check media distribution by type
SELECT type, COUNT(*) FROM "Media" GROUP BY type;

-- Check vehicles with media
SELECT 
  COUNT(DISTINCT v.id) as vehicles_with_media,
  COUNT(v.id) as total_vehicles
FROM "Vehicle" v
LEFT JOIN "Media" m ON v.id = m.vehicleId;

-- Check source tracking
SELECT sourceType, COUNT(*) FROM "VehicleSource" GROUP BY sourceType;
```

### **Common Issues and Solutions**

1. **Missing Data Files**
   - Ensure JSON files exist in `../../data-analitics/data/`
   - Check file permissions

2. **Database Connection Issues**
   - Verify `DATABASE_URL` environment variable
   - Ensure PostgreSQL is running

3. **Memory Issues with Large Datasets**
   - Process data in batches
   - Increase Node.js memory limit: `--max-old-space-size=4096`

4. **Duplicate Key Errors**
   - Check for duplicate emails in source data
   - Review unique constraints in schema

## 🔧 Troubleshooting

### **Enable Debug Logging**

```bash
# Set debug environment variable
DEBUG=migration:* npm run migrate-data
```

### **Partial Migration Recovery**

If migration fails partway through:

1. Check the error logs
2. Fix the issue
3. Re-run migration (it will skip existing records)

### **Reset Migration**

To start fresh:

```bash
# Reset database
npm run db:push -- --force-reset

# Re-run migration
npm run migrate-data
```

## 📈 Performance Considerations

- **Batch Processing**: Large datasets are processed in batches
- **Indexes**: Strategic indexes for common queries
- **Memory Usage**: Monitor memory usage during migration
- **Transaction Management**: Use transactions for data consistency

## 🔮 Post-Migration Steps

1. **Verify Data Integrity**: Run verification queries
2. **Update Application Code**: Update API endpoints to use new schema
3. **Test Functionality**: Ensure all features work with new data structure
4. **Performance Testing**: Test query performance with real data
5. **Backup Strategy**: Implement regular database backups

## 📞 Support

For issues or questions:

1. Check the error logs in the migration output
2. Review this documentation
3. Check the source code in `src/lib/migration/`
4. Verify database schema matches expectations
