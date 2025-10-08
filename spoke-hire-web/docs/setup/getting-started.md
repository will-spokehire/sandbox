# Getting Started with SpokeHire Admin Interface

**Welcome!** This guide will help you set up your development environment and get the SpokeHire Admin Interface running locally.

---

## Prerequisites

- **Node.js** 18+ installed
- **npm** or **pnpm** package manager
- **PostgreSQL** database (or Supabase account)
- **Git** for version control

---

## Quick Start (5 minutes)

### 1. Clone and Install

```bash
# Clone the repository (if you haven't already)
cd spoke-hire-web

# Install dependencies
npm install
```

### 2. Set Up Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
```

Required environment variables:
```bash
# Database
DATABASE_URL="postgresql://..."        # Pooled connection (port 6543)
DIRECT_URL="postgresql://..."          # Direct connection (port 5432)

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."       # Keep secret!

# Email (Loops - optional for development)
LOOPS_API_KEY="..."                    # Can leave empty for development
DEBUG="true"                           # Enables email debug mode
```

### 3. Set Up Database

```bash
# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000 🎉

---

## Detailed Setup

### Database Setup

**Option A: Use Supabase (Recommended)**

1. Follow the [Supabase Setup Guide](./supabase-setup.md)
2. Get your connection strings from Supabase dashboard
3. Add to `.env.local`

**Option B: Local PostgreSQL**

1. Install PostgreSQL locally
2. Create database: `createdb spokehire_db`
3. Set DATABASE_URL to your local database

See [Database Setup Guide](./database-setup.md) for detailed instructions.

### Authentication Setup

The app uses Supabase Auth with Email OTP:

1. Complete Supabase setup (see [Supabase Setup Guide](./supabase-setup.md))
2. Configure email templates for OTP codes
3. Create your first admin user

### Email Setup (Optional for Development)

For sending deal emails:

1. Sign up at [Loops.so](https://loops.so)
2. Get API key and add to `.env.local`
3. Create email template with ID: `deal-notification`
4. Or set `DEBUG=true` to log emails instead of sending

---

## Project Structure

```
spoke-hire-web/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── admin/             # Admin pages
│   │   │   ├── vehicles/      # Vehicle management
│   │   │   ├── deals/         # Deals management
│   │   │   └── page.tsx       # Admin dashboard
│   │   ├── auth/              # Authentication pages
│   │   └── _components/       # Shared components
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── auth/              # Auth-specific components
│   ├── server/
│   │   └── api/
│   │       ├── routers/       # tRPC routers
│   │       └── services/      # Business logic
│   ├── lib/                   # Utilities
│   └── styles/                # Global styles
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── docs/
│   ├── features/              # Feature documentation
│   ├── setup/                 # Setup guides
│   └── architecture/          # Technical docs
└── public/                    # Static assets
```

---

## Common Tasks

### Development

```bash
# Start dev server with Turbopack
npm run dev

# Run type checking
npm run typecheck

# Run linter
npm run lint

# Format code
npm run format:write
```

### Database

```bash
# View database in browser
npm run db:studio

# Generate Prisma client
npm run postinstall

# Push schema changes
npm run db:push

# Create migration
npm run db:generate

# Apply migrations
npm run db:migrate
```

### Building

```bash
# Build for production
npm run build

# Start production server
npm run start
```

---

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Edit files in `src/`
   - Run `npm run dev` to test changes

3. **Check for errors**
   ```bash
   npm run typecheck
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Best Practices

- **Use Server Components** by default
- **Add "use client"** only when needed (hooks, events, state)
- **Use shadcn/ui components** from `~/components/ui/*`
- **Follow TypeScript** - No `any` types
- **Use tRPC** for API calls
- **Test responsively** - Mobile, tablet, desktop

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format:write` | Format code with Prettier |
| `npm run typecheck` | Check TypeScript types |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:migrate` | Run database migrations |

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Library:** shadcn/ui (New York style)
- **API:** tRPC
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma
- **Auth:** Supabase Auth
- **Forms:** React Hook Form + Zod
- **State:** TanStack Query (via tRPC)

---

## Troubleshooting

### Dev Server Won't Start

**Check:**
- Node version is 18+
- All dependencies installed (`npm install`)
- No process running on port 3000

**Fix:**
```bash
# Kill process on port 3000
kill -9 $(lsof -ti:3000)

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Errors

**Check:**
- DATABASE_URL is set correctly
- Database is running and accessible
- Using correct port (6543 for pooled, 5432 for direct)

**Fix:**
- Verify connection string
- Test with: `npm run db:studio`
- Check Supabase dashboard status

### Type Errors

**Check:**
- Prisma client is generated
- TypeScript version matches project

**Fix:**
```bash
npm run postinstall
npm run typecheck
```

### Build Errors

**Check:**
- All environment variables are set
- No linting errors
- No type errors

**Fix:**
```bash
npm run lint
npm run typecheck
npm run build
```

---

## Next Steps

Once your development environment is running:

1. **Read the [AGENTS.md](../../AGENTS.md)** - Development guidelines
2. **Explore the codebase** - Start with `src/app/page.tsx`
3. **Review feature docs** - See `docs/features/`
4. **Try making a change** - Edit a component and see it update
5. **Read architecture docs** - See `docs/architecture/`

---

## Getting Help

- **Documentation:** Check `/docs` folder
- **Code comments:** Many files have helpful comments
- **Ask the team:** Reach out to other developers
- **Check logs:** Browser console and server terminal

---

## Contributing

When contributing to the project:

1. Follow the style guide in [AGENTS.md](../../AGENTS.md)
2. Write tests for new features (when applicable)
3. Update documentation when making changes
4. Use meaningful commit messages
5. Keep PRs focused and small

---

**Happy coding!** 🚀 If you run into issues, check the troubleshooting section or reach out to the team.

