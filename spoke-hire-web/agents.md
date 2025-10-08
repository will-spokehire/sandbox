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

### Layout Patterns
```tsx
// Container pattern
<div className="container mx-auto px-4">
  {/* Content */}
</div>

// Card pattern
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>{/* Content */}</CardContent>
</Card>

// Grid pattern
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Items */}
</div>
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
1. **Use shadcn/ui Form component** - Wraps React Hook Form
2. **Validation:** Define Zod schemas in separate files
3. **Pattern:**
   ```tsx
   import { useForm } from "react-hook-form";
   import { zodResolver } from "@hookform/resolvers/zod";
   import { Form, FormField, FormItem, FormLabel, FormControl } from "~/components/ui/form";
   
   const form = useForm<FormData>({
     resolver: zodResolver(schema),
     defaultValues: { ... }
   });
   ```

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

## Common Patterns

### Loading States
```tsx
{isLoading ? (
  <Skeleton className="h-20 w-full" />
) : (
  <DataDisplay data={data} />
)}
```

### Empty States
```tsx
import { EmptyState } from "~/app/_components/ui";
<EmptyState 
  title="No data found"
  description="Try adjusting your filters"
  icon="📭"
/>
```

### Toasts/Notifications
```tsx
import { toast } from "sonner";
toast.success("Action completed!");
toast.error("Something went wrong");
```

### Dialogs/Modals
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
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

## Documentation Best Practices

### When to Create Documentation

**Create new documentation when:**
- ✅ Implementing a new feature (create `docs/features/[feature_name].md`)
- ✅ Adding new setup/deployment steps (update relevant doc in `docs/setup/`)
- ✅ Implementing complex technical solutions (add to `docs/architecture/`)

**Update existing documentation when:**
- ✅ Fixing bugs in existing features
- ✅ Enhancing existing features
- ✅ Changing implementation details
- ✅ Simplifying or refactoring code

### Documentation Content Guidelines

**Feature Documentation (`docs/features/`) should include:**
1. **Overview** - What the feature does and why it exists
2. **User Flow** - How users interact with the feature
3. **Technical Implementation** - Architecture, components, API endpoints
4. **Database Schema** - Relevant models and relationships (if applicable)
5. **Configuration** - Environment variables, settings
6. **Testing** - How to test the feature
7. **Troubleshooting** - Common issues and solutions
8. **Change History** - Major changes and iterations (optional)

**Setup Documentation (`docs/setup/`) should include:**
1. **Prerequisites** - What's needed before starting
2. **Step-by-step instructions** - Clear, numbered steps
3. **Configuration examples** - With code blocks
4. **Verification steps** - How to confirm setup worked
5. **Troubleshooting** - Common setup issues
6. **Next steps** - Links to related documentation

**Architecture Documentation (`docs/architecture/`) should include:**
1. **Problem statement** - What challenge is being addressed
2. **Solution approach** - High-level strategy
3. **Implementation details** - Technical specifics
4. **Examples** - Code examples demonstrating the approach
5. **Performance impact** - Metrics and improvements (if applicable)
6. **Alternatives considered** - Other approaches and why not chosen
7. **References** - External resources and links

### Documentation Format Guidelines

**Use clear headings:**
```markdown
# Main Title
## Major Section
### Subsection
#### Detail Section
```

**Include code blocks with syntax highlighting:**
```markdown
\`\`\`typescript
// TypeScript code example
const example = "value";
\`\`\`

\`\`\`bash
# Shell commands
npm run dev
\`\`\`
```

**Use tables for comparisons:**
```markdown
| Feature | Before | After |
|---------|--------|-------|
| Speed   | Slow   | Fast  |
```

**Use checkboxes for task lists:**
```markdown
- [ ] Task to do
- [x] Completed task
```

**Use callouts for important info:**
```markdown
**Important:** Critical information here

**Note:** Helpful tip here

⚠️ **Warning:** Be careful of this
```

### Updating CHANGELOG.md

Update `CHANGELOG.md` for:
- ✅ New features (minor or major version)
- ✅ Breaking changes (major version)
- ✅ Significant bug fixes
- ✅ Performance improvements
- ✅ Database schema changes
- ✅ API changes

Don't update for:
- ❌ Minor typo fixes
- ❌ Code formatting changes
- ❌ Internal refactoring with no user impact

### Links Between Documents

- Always use relative links: `[Link](./other-doc.md)`
- Link to related documentation at the bottom of each doc
- Keep README.md as the main entry point with links to all major docs

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

