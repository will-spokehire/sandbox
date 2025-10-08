# Agent Rules for SpokeHire Admin Interface Development

## Tech Stack
- **Framework:** Next.js 15 (App Router, React Server Components)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Library:** shadcn/ui (New York style)
- **API:** tRPC
- **Database:** Supabase (PostgreSQL)
- **Forms:** React Hook Form + Zod
- **State:** TanStack Query (via tRPC)

## UI Component Guidelines

### Using shadcn/ui Components
- **Always use shadcn/ui components** from `~/components/ui/*` for standard UI elements
- **Available components:** Button, Card, Input, Label, Table, Dialog, Dropdown Menu, Badge, Alert, Avatar, Form, Select, Textarea, Switch, Checkbox, Separator, Skeleton, Sonner (toasts)
- **Add new components:** Use `npx shadcn@latest add [component-name]` when needed
- **Import pattern:** `import { Button } from "~/components/ui/button"`

### Custom Components Organization
```
src/
├── components/ui/              # shadcn/ui components (don't modify directly)
├── app/_components/            # Custom app-specific components
│   ├── ui/                     # Custom UI components (AppHeader, EmptyState, etc.)
│   ├── admin/                  # Admin-specific features
│   └── shared/                 # Shared across features
└── app/[feature]/              # Feature-specific components in _components/
```

### Component Best Practices
1. **Use Server Components by default** - Add "use client" only when needed (hooks, events, state)
2. **Collocate components** - Keep feature components near their routes
3. **Prefer composition** - Build complex UIs by composing smaller components
4. **Type safety** - Always define TypeScript interfaces for props
5. **Accessibility** - shadcn/ui handles this, but test keyboard navigation

## Styling Guidelines

### Tailwind CSS Best Practices
1. **Use shadcn design tokens:**
   - Colors: `bg-background`, `text-foreground`, `text-muted-foreground`
   - Borders: `border`, `border-input`
   - Spacing: Use Tailwind's spacing scale (`space-4`, `gap-6`, etc.)
2. **Responsive design:** Mobile-first with `sm:`, `md:`, `lg:`, `xl:` breakpoints
3. **Dark mode ready:** Use shadcn's color system (already configured)
4. **Use `cn()` utility** from `~/lib/utils` for conditional classes:
   ```tsx
   import { cn } from "~/lib/utils";
   className={cn("base-classes", condition && "conditional-classes")}
   ```

### Common Layouts
```tsx
// Container
<div className="container mx-auto px-4">{/* Content */}</div>

// Card
<Card>
  <CardHeader><CardTitle>Title</CardTitle></CardHeader>
  <CardContent>{/* Content */}</CardContent>
</Card>

// Responsive Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{/* Items */}</div>
```

## Client-Side Development

### State Management
1. **Server state:** Use tRPC queries (already integrated with TanStack Query)
   ```tsx
   const { data, isLoading } = api.users.getAll.useQuery();
   ```
2. **Form state:** Use React Hook Form with Zod validation
   ```tsx
   const form = useForm<FormData>({
     resolver: zodResolver(schema)
   });
   ```
3. **UI state:** Use React hooks (`useState`, `useReducer`)
4. **Global client state:** Context API for simple cases, avoid unless necessary

### Data Fetching Patterns
1. **Fetch on server when possible** - Use React Server Components
2. **Use tRPC procedures:**
   - Queries: `api.[router].[procedure].useQuery()`
   - Mutations: `api.[router].[procedure].useMutation()`
3. **Loading states:** Use `Skeleton` component from shadcn/ui
4. **Error handling:** Use `Alert` component or `Sonner` toasts

### Forms
Use shadcn/ui Form component with React Hook Form + Zod validation.

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});
```

Define Zod schemas in separate files for reusability.

## File Organization

### Route Structure
```
app/
├── page.tsx                    # Home/dashboard
├── layout.tsx                  # Root layout
├── _components/                # Shared components
└── [feature]/                  # Feature routes
    ├── page.tsx               # Feature page
    ├── layout.tsx             # Feature layout (optional)
    └── _components/           # Feature components
```

### API Routes (tRPC)
```
server/api/
├── root.ts                     # Main router
├── trpc.ts                     # tRPC config
└── routers/
    └── [feature].ts           # Feature router
```

### Documentation Structure
```
docs/
├── setup/                      # Setup & deployment guides
│   ├── getting-started.md     # Quick start for new developers
│   ├── database-setup.md      # Database configuration
│   ├── supabase-setup.md      # Supabase authentication & hosting
│   └── deployment.md          # Production deployment guide
│
├── features/                   # Feature implementation docs
│   └── [feature_name].md      # One comprehensive doc per feature
│
└── architecture/               # Technical deep-dives
    ├── database-optimization.md    # Performance, N+1 queries, indexing
    └── migration-history.md        # Database migration tracking
```

**Important Documentation Rules:**

**✅ DO:**
- Create feature documentation in `docs/features/[feature_name].md`
- Put setup/deployment guides in `docs/setup/`
- Put architecture/technical docs in `docs/architecture/`
- Update existing docs when making changes (don't create new ones)
- Keep README.md as the entry point with links to docs
- Update CHANGELOG.md for significant changes
- Write comprehensive docs that cover the full feature lifecycle

**❌ DO NOT:**
- Create `*_COMPLETE.md`, `*_SUMMARY.md`, `*_FINAL.md` files in project root
- Create separate MD files for bug fixes or minor changes
- Put implementation docs in the project root
- Duplicate content across multiple files
- Create documentation without a clear category (setup/features/architecture)

## Performance Best Practices

1. **Lazy load heavy components:** Use `dynamic` from Next.js
2. **Optimize images:** Use Next.js `<Image>` component
3. **Minimize client bundle:**
   - Keep "use client" to leaf components
   - Use Server Components for data fetching
4. **Prefetch data:** Use tRPC's prefetching in Server Components

## Testing & Quality

1. **Type safety:** Ensure no TypeScript errors (`npm run typecheck`)
2. **Linting:** Run `npm run lint` before committing
3. **Format code:** Use Prettier (`npm run format:write`)
4. **Responsive testing:** Test on mobile, tablet, desktop viewports

## Common UI Patterns

```tsx
// Loading states
{isLoading ? <Skeleton className="h-20 w-full" /> : <DataDisplay data={data} />}

// Empty states
<EmptyState title="No data" description="Try adjusting filters" icon="📭" />

// Toasts
import { toast } from "sonner";
toast.success("Success!"); toast.error("Error!");

// Dialogs
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader><DialogTitle>Title</DialogTitle></DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

## Don't Do This

❌ Modify shadcn/ui components in `src/components/ui/` directly  
❌ Mix "use client" unnecessarily - Start with Server Components  
❌ Create custom styled components when shadcn has an equivalent  
❌ Hardcode colors - Use Tailwind/shadcn design tokens  
❌ Forget TypeScript types for component props  
❌ Skip form validation - Always use Zod schemas  
❌ Fetch data in "use client" components when Server Components work  

## Useful Commands

```bash
# Add shadcn component
npx shadcn@latest add [component-name]

# Run dev server (with Turbopack)
npm run dev

# Type checking
npm run typecheck

# Linting & formatting
npm run lint
npm run format:write

# Build for production
npm run build
```

## Quick Reference

### Database & Backend
- **Use Prisma** for database operations
- **Use tRPC** for API endpoints in `server/api/routers/`
- **Use services** for business logic in `server/api/services/`
- **Optimize queries** - Use parallel execution for independent queries (see `docs/architecture/database-optimization.md`)

### Database Migrations
```bash
npm run db:push      # Quick sync for development
npm run db:migrate   # Create migration for production
```

Always use `DIRECT_URL` for migrations, `DATABASE_URL` for app queries.

### Environment Variables
- Keep secrets in `.env.local` (never commit)
- Document new env vars in `env.example.txt`
- Use `~/env.js` for validation

## Additional Resources

### Project Documentation
- [README.md](../README.md) - Project overview and quick start
- [CHANGELOG.md](../CHANGELOG.md) - Version history
- [Setup Guides](../docs/setup/) - Getting started and configuration
- [Feature Docs](../docs/features/) - Feature implementation details
- [Architecture Docs](../docs/architecture/) - Technical deep-dives

### External Resources
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Next.js App Router](https://nextjs.org/docs/app)
- [tRPC Documentation](https://trpc.io)
- [Tailwind CSS](https://tailwindcss.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)

