# ⚡ Quick Start: Production Migration

**5-minute setup → 30-minute migration**

## 🎯 Prerequisites Check

```bash
# Install PostgreSQL tools (if not installed)
brew install postgresql  # macOS
# or
sudo apt-get install postgresql-client  # Ubuntu

# Verify tools are available
pg_dump --version
psql --version
```

## 🚀 Migration Steps (Quick Reference)

### 1. Setup Supabase (5 min)

1. Create project at [supabase.com](https://supabase.com)
2. Copy from **Settings → API**:
   - Project URL
   - anon key
   - service_role key
3. Copy from **Settings → Database**:
   - Connection string (Transaction mode)
   - Direct connection

### 2. Configure Environment (2 min)

```bash
cd spoke-hire-web

# Create production environment file
cp env.example.txt .env.production

# Edit with your Supabase credentials
nano .env.production  # or use your favorite editor
```

### 3. Backup Local Database (2 min)

```bash
# Ensure .env.local is configured
npm run backup-db
```

### 4. Apply Schema to Production (3 min)

```bash
# Load production environment
export $(cat .env.production | grep -v '^#' | xargs)

# Apply schema
npx prisma generate
npx prisma migrate deploy
```

### 5. Migrate Data (15-20 min)

```bash
# Set both database URLs
export LOCAL_DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d '=' -f2- | tr -d '"')
export PRODUCTION_DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"' | head -1)

# Run migration
npm run migrate-to-production

# Type "MIGRATE" when prompted
```

### 6. Verify (2 min)

```bash
# Verify production database
export DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"' | head -1)
npm run verify-production
```

### 7. Create Admin User (2 min)

```bash
# Ensure production environment is loaded
npm run create-admin-user

# Enter your email, first name, last name
```

### 8. Deploy (5 min)

**Vercel:**
```bash
git add .
git commit -m "Production ready"
git push origin main

# Then deploy on vercel.com
# Add environment variables from .env.production
```

**Manual:**
```bash
npm run build
npm start
```

## ✅ Verification Checklist

After migration:

- [ ] `npm run verify-production` shows no errors
- [ ] Admin user can login at `/auth/login`
- [ ] Vehicle data is visible in the app
- [ ] Images are displaying correctly
- [ ] No console errors

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Check DATABASE_URL, verify Supabase is running |
| Tables don't exist | Run `npx prisma migrate deploy` again |
| Migration hangs | Check network, large datasets take time |
| Orphaned records | Fix local database first, then re-migrate |
| Can't login | Verify Supabase auth is enabled, check service role key |

## 📋 Available Scripts

```bash
npm run backup-db                # Backup local database
npm run migrate-to-production    # Migrate to production
npm run verify-production        # Verify production database
npm run create-admin-user        # Create admin user
npm run db:studio                # Open database viewer
```

## 🔗 Full Documentation

See [MIGRATION_TO_PRODUCTION.md](./MIGRATION_TO_PRODUCTION.md) for detailed step-by-step guide with explanations and troubleshooting.

## 🎉 Success Indicators

You're done when:
1. Verification shows ✅ all checks passed
2. You can login as admin
3. You see all your vehicles in the app
4. No errors in browser console

---

**Need help?** Check the full migration guide or review error messages carefully.

