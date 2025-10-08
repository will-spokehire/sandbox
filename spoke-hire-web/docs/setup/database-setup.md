# 🚀 SpokeHire Database Setup Guide

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Your existing vehicle data files

## 🔧 Step-by-Step Setup

### **1. Database Setup**

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (macOS with Homebrew)
brew install postgresql
brew services start postgresql

# Create database
createdb spokehire_db

# Create user (optional)
psql -d spokehire_db -c "CREATE USER spokehire WITH PASSWORD 'your_password';"
psql -d spokehire_db -c "GRANT ALL PRIVILEGES ON DATABASE spokehire_db TO spokehire;"
```

#### Option B: Cloud Database (Recommended)
- **Supabase**: Free tier with 500MB storage
- **Vercel Postgres**: Integrated with Vercel deployments
- **Railway**: Simple PostgreSQL hosting
- **PlanetScale**: MySQL alternative (requires schema changes)

### **2. Environment Configuration**

Create `.env` file in `spoke-hire-web/`:

```bash
# Copy example file
cp .env.example .env

# Edit with your database URL
DATABASE_URL="postgresql://username:password@localhost:5432/spokehire_db"
```

**Database URL Examples:**
```bash
# Local PostgreSQL
DATABASE_URL="postgresql://spokehire:your_password@localhost:5432/spokehire_db"

# Supabase
DATABASE_URL="postgresql://postgres:your_password@db.your_project.supabase.co:5432/postgres"

# Vercel Postgres
DATABASE_URL="postgres://username:password@ep-example.us-east-1.postgres.vercel-storage.com/verceldb"
```

### **3. Install Dependencies**

```bash
cd spoke-hire-web
npm install
```

### **4. Database Migration**

```bash
# Generate Prisma client
npm run postinstall

# Create and apply database migration
npm run db:generate

# Apply migration to database
npm run db:migrate
```

### **5. Verify Database Setup**

```bash
# Open Prisma Studio to view database
npm run db:studio
```

This will open http://localhost:5555 where you can see your database tables.

### **6. Prepare Data Files**

Ensure your data files are accessible:

```bash
# Your data files should be at:
../../data-analitics/data/catalog_products.json
../../data-analitics/data/cleansed_database.json
../../data-analitics/data/submission.from.1march.2025.json
```

### **7. Run Data Analysis**

```bash
# Analyze your existing data
npm run analyze-data
```

### **8. Run Migration**

```bash
# Migrate all data to database
npm run migrate-data
```

## 🔍 Verification Steps

After successful migration, verify your data:

```sql
-- Connect to your database and run these queries:

-- Check user counts
SELECT "userType", COUNT(*) FROM "User" GROUP BY "userType";

-- Check vehicle distribution
SELECT status, COUNT(*) FROM "Vehicle" GROUP BY status;

-- Check media types
SELECT type, COUNT(*) FROM "Media" GROUP BY type;

-- Check vehicles with media
SELECT 
  COUNT(DISTINCT v.id) as vehicles_with_media,
  COUNT(v.id) as total_vehicles
FROM "Vehicle" v
LEFT JOIN "Media" m ON v.id = m."vehicleId";
```

## ⚠️ Troubleshooting

### **Database Connection Issues**
```bash
# Test database connection
npx prisma db pull
```

### **Migration Errors**
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Push schema without migration
npx prisma db push
```

### **Data File Issues**
- Ensure JSON files exist and are valid
- Check file permissions
- Verify file paths in migration script

### **Memory Issues**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run migrate-data
```

## 📊 Expected Results

After successful migration:
- **Users**: ~875 unique users
- **Vehicles**: ~1600+ vehicles  
- **Media**: ~5000+ images/videos
- **Collections**: ~10+ categories
- **Sources**: Complete audit trail

## 🎯 Next Steps

1. **Verify data integrity** using the SQL queries above
2. **Test the application** with the new database
3. **Update API endpoints** to use database instead of JSON files
4. **Set up regular backups** for your database

## 🆘 Need Help?

- Check the detailed `MIGRATION_README.md`
- Review error logs in migration output
- Ensure all prerequisites are met
- Verify database connectivity
