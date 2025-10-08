# SpokeHire Admin Interface

A modern, full-featured admin interface for managing vehicles, deals, and job offers built with Next.js 15, TypeScript, and Supabase.

---

## Overview

SpokeHire Admin Interface is a comprehensive management system that allows administrators to:
- **Manage vehicles** with advanced filtering, search, and bulk operations
- **Create and send deals** to vehicle owners via email
- **Track email delivery** and engagement
- **Manage users** and authentication
- **View analytics** and performance metrics

Built with modern web technologies for performance, type-safety, and developer experience.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 15](https://nextjs.org) (App Router, React Server Components) |
| **Language** | [TypeScript](https://www.typescriptlang.org) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) |
| **UI Library** | [shadcn/ui](https://ui.shadcn.com) (New York style) |
| **API** | [tRPC](https://trpc.io) |
| **Database** | [PostgreSQL](https://www.postgresql.org) via [Supabase](https://supabase.com) |
| **ORM** | [Prisma](https://www.prisma.io) |
| **Authentication** | [Supabase Auth](https://supabase.com/docs/guides/auth) (Email OTP) |
| **Forms** | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| **State Management** | [TanStack Query](https://tanstack.com/query) (via tRPC) |
| **Email** | [Loops](https://loops.so) for transactional emails |

---

## Quick Start

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database or Supabase account
- npm or pnpm package manager

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Set up database
npm run db:push

# Start development server
npm run dev
```

Visit **http://localhost:3000** 🎉

For detailed setup instructions, see [Getting Started Guide](./docs/setup/getting-started.md).

---

## Features

### Vehicle Management
- **Advanced Search & Filtering** - By make, model, year, price, color, status, and more
- **Bulk Operations** - Select and act on multiple vehicles at once
- **Image Management** - Upload, organize, and display vehicle images
- **Status Management** - Draft, published, archived workflows
- **Vehicle Details** - Comprehensive vehicle information with media gallery

### Deals/Job Offers Workflow
- **Send Deals to Owners** - Select vehicles and automatically send to owners
- **Email Integration** - Powered by Loops for reliable delivery
- **Delivery Tracking** - Track email sent, opened, clicked status
- **Add to Existing Deals** - Extend deals with more vehicles
- **Archive Management** - Keep deals organized

### Performance
- **Server-Side Caching** - 5-minute TTL for expensive queries
- **Parallel Query Execution** - Optimized for cloud databases
- **Database Indexes** - Strategic indexing for common queries
- **Connection Pooling** - Efficient Supabase connections
- **Response times < 1s** - 70-90% faster than baseline

### Authentication & Security
- **Email OTP Authentication** - Passwordless login via Supabase
- **Row Level Security** - Database protected with RLS policies
- **Admin-Only Access** - Protected routes and API endpoints
- **Session Management** - Secure session handling
- **Type-Safe API** - End-to-end type safety with tRPC

---

## Project Structure

```
spoke-hire-web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # Admin pages
│   │   │   ├── vehicles/       # Vehicle management
│   │   │   ├── deals/          # Deals management
│   │   │   └── page.tsx        # Dashboard
│   │   ├── auth/               # Authentication pages
│   │   └── _components/        # Shared components
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   └── auth/               # Auth components
│   ├── server/
│   │   └── api/
│   │       ├── routers/        # tRPC routers
│   │       └── services/       # Business logic
│   ├── lib/                    # Utilities
│   └── styles/                 # Global styles
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
├── docs/
│   ├── features/               # Feature documentation
│   ├── setup/                  # Setup guides
│   └── architecture/           # Technical deep-dives
├── public/                     # Static assets
└── AGENTS.md                   # Development guidelines
```

---

## Documentation

### Getting Started
- [Getting Started Guide](./docs/setup/getting-started.md) - Quick start for new developers
- [Database Setup](./docs/setup/database-setup.md) - Database configuration
- [Supabase Setup](./docs/setup/supabase-setup.md) - Authentication and database hosting
- [Deployment](./docs/setup/deployment.md) - Production deployment guide

### Features
- [Vehicle Management](./docs/features/vehicles-management.md) - Vehicle CRUD operations
- [Deals Workflow](./docs/features/deals-workflow.md) - Job offers and email sending
- [Performance](./docs/features/performance.md) - Performance optimizations
- [Distance Filtering](./docs/features/distance-filtering.md) - Geospatial queries

### Architecture
- [Database Optimization](./docs/architecture/database-optimization.md) - N+1 queries, indexing
- [Migration History](./docs/architecture/migration-history.md) - Database migrations

### Development
- [AGENTS.md](./AGENTS.md) - **Development rules and guidelines** (READ THIS FIRST!)
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes

---

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # Check TypeScript types
npm run format:write # Format code with Prettier

# Database
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run postinstall  # Generate Prisma client
```

### Development Workflow

1. Read [AGENTS.md](./AGENTS.md) for development guidelines
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes following the guidelines
4. Run linting and type checking: `npm run lint && npm run typecheck`
5. Commit with descriptive message: `git commit -m "feat: your feature"`
6. Push and create a pull request

### Best Practices

- ✅ Use Server Components by default
- ✅ Use shadcn/ui components from `~/components/ui/*`
- ✅ Follow TypeScript strictly (no `any` types)
- ✅ Use tRPC for all API calls
- ✅ Test responsive design (mobile, tablet, desktop)
- ✅ Update documentation when making changes

---

## Environment Variables

Create `.env.local` with:

```bash
# Database
DATABASE_URL="postgresql://..."        # Pooled (port 6543)
DIRECT_URL="postgresql://..."          # Direct (port 5432)

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."       # Keep secret!

# Email (Loops)
LOOPS_API_KEY="..."                    # Optional for development
DEBUG="true"                           # Enables email debug mode
```

See [.env.example](./env.example.txt) for complete reference.

---

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

See [Deployment Guide](./docs/setup/deployment.md) for detailed instructions.

### Database Migrations

Before deploying:

```bash
# Apply migrations to production
npm run db:migrate

# Apply performance indexes
npx tsx scripts/apply-performance-indexes.ts
```

---

## Performance

**Optimized for production:**
- API responses < 1 second
- 70-90% faster than baseline
- Server-side and client-side caching
- Parallel query execution
- Strategic database indexing
- Connection pooling

See [Performance Guide](./docs/features/performance.md) for details.

---

## Contributing

We welcome contributions! Please:

1. Read [AGENTS.md](./AGENTS.md) for development guidelines
2. Follow the established code style
3. Write meaningful commit messages
4. Update documentation for new features
5. Test your changes thoroughly

---

## License

[Your License Here]

---

## Support

For issues or questions:
- Check [documentation](./docs/) folder
- Review [troubleshooting](./docs/setup/getting-started.md#troubleshooting) section
- Contact the development team

---

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org) - React framework
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Supabase](https://supabase.com) - Backend infrastructure
- [tRPC](https://trpc.io) - End-to-end typesafe APIs
- [Prisma](https://www.prisma.io) - Database ORM

---

**Built with ❤️ by the SpokeHire Team**
