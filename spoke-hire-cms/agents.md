# PayloadCMS Development Guidelines

## Collection Structure

### Creating Collections

```typescript
import type { CollectionConfig } from 'payload'

export const MyCollection: CollectionConfig = {
  slug: 'my-collection',
  admin: {
    useAsTitle: 'title', // Field to display in admin
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}
```

### Best Practices

- **Slug naming**: Use lowercase, hyphenated (e.g., `blog-posts`, not `blogPosts`)
- **Field names**: Use camelCase (e.g., `publishedAt`, not `published_at`)
- **Required fields**: Always mark required fields explicitly
- **Default values**: Use `defaultValue` for sensible defaults
- **Validation**: Add `validate` functions for complex validation

## Field Types

### Common Patterns

```typescript
// Text with validation
{
  name: 'email',
  type: 'email',
  required: true,
  validate: (val) => {
    if (!val.includes('@')) return 'Invalid email'
  },
}

// Rich text
{
  name: 'content',
  type: 'richText',
  editor: lexicalEditor(), // Already configured globally
}

// Relationships
{
  name: 'author',
  type: 'relationship',
  relationTo: 'users',
  required: true,
}

// Uploads
{
  name: 'image',
  type: 'upload',
  relationTo: 'media',
}
```

## Access Control

```typescript
access: {
  read: () => true, // Public read
  create: ({ req: { user } }) => !!user, // Authenticated only
  update: ({ req: { user } }) => !!user,
  delete: ({ req: { user } }) => user?.role === 'admin',
}
```

## Hooks

### Common Hooks

```typescript
hooks: {
  beforeValidate: [
    ({ data }) => {
      // Transform data before validation
      return data
    },
  ],
  beforeChange: [
    ({ data, req }) => {
      // Set defaults, modify data
      if (!data.slug) {
        data.slug = slugify(data.title)
      }
      return data
    },
  ],
  afterChange: [
    ({ doc, req }) => {
      // Side effects after save
      // e.g., invalidate cache, send webhook
    },
  ],
}
```

## Storage

- **Development**: Files stored in `./media/` (automatic)
- **Production**: Uses Supabase Storage S3 (configured in `payload.config.ts`)
- **Collections**: Add `upload: true` to enable file uploads
- **Media collection**: Already configured, use `relationTo: 'media'`

## Database Schema

- **Schema name**: Configurable via `PAYLOAD_DB_SCHEMA` env var (default: `payload`)
- **Migrations**: Run `npm run payload migrate` after schema changes
- **Isolation**: Uses separate schema from `spoke-hire-web` (`public` schema)

## TypeScript Types

```typescript
// Generate types after collection changes
npm run generate:types

// Use generated types
import type { MyCollection } from '@/payload-types'

// Access Payload instance
import { getPayload } from 'payload'
const payload = await getPayload({ config: configPromise })
```

## Common Patterns

### Conditional Fields

```typescript
{
  name: 'status',
  type: 'select',
  options: ['draft', 'published'],
  admin: {
    condition: (data) => data.publishedAt, // Show only if published
  },
}
```

### Localized Fields

```typescript
{
  name: 'title',
  type: 'text',
  localized: true, // Enable i18n
}
```

### Field Groups

```typescript
{
  name: 'seo',
  type: 'group',
  fields: [
    { name: 'metaTitle', type: 'text' },
    { name: 'metaDescription', type: 'textarea' },
  ],
}
```

## Development Workflow

1. **Create collection** in `src/collections/`
2. **Add to config** in `src/payload.config.ts`
3. **Generate types**: `npm run generate:types`
4. **Run migrations**: `npm run payload migrate`
5. **Test in admin**: `http://localhost:3000/admin`

## Best Practices

### 1. Data Modeling & Structure

✅ **DO**: Use the correct Payload primitives for their intended purposes
- **Collections** → repeatable, routable, structured data (Posts, Products, Users)
- **Globals** → unique configuration/state (Header, Footer, Theme settings)
- **Blocks** → editorial/compositional UI pieces (Hero, FAQ, Testimonial)

❌ **DO NOT**: Use Globals or Blocks for large repeatable datasets
- This causes document bloat, huge payloads, and slow queries.

✅ **DO**: Keep collections atomic and clean
- One responsibility per collection.

❌ **DO NOT**: Embed large relational or dynamic objects inside rich text or JSON fields
- Use relationships instead.

### 2. Relationship Integrity

✅ **DO**: Always define `deleteRule` on relationships (`nullify`, `cascade`, `restrict`)
- Prefer `nullify` to prevent accidental loss of associated content.

```typescript
{
  name: 'author',
  type: 'relationship',
  relationTo: 'users',
  deleteRule: 'nullify', // Prevents orphaned records
}
```

❌ **DO NOT**: Rely on database defaults for relational deletes
- This creates orphaned records or unexpected cascades.

❌ **DO NOT**: Store reference IDs inside text fields
- Payload cannot resolve them; use relationship fields instead.

### 3. Performance & Query Optimization

**Indexing**
✅ **DO**: Add `index: true` on frequently queried fields
- Slug, email, createdAt, etc.

```typescript
{
  name: 'slug',
  type: 'text',
  index: true, // Fast lookups
}
```

❌ **DO NOT**: Index low-cardinality fields
- E.g., booleans — they slow down writes without helping reads.

**Query Depth**
✅ **DO**: Set minimal depth (2–3) for production
- Also enforce globally via `maxDepth` in config.

```typescript
// In payload.config.ts
graphQL: {
  maxDepth: 3,
}
```

❌ **DO NOT**: Allow high or unbounded depth (e.g., 10)
- This creates massive joins and slow responses.

**Data Selection**
✅ **DO**: Use `select` to request only required fields
- This avoids unnecessary field hooks & reduces payload size.

```typescript
const posts = await payload.find({
  collection: 'posts',
  select: {
    title: true,
    slug: true,
    // Only fetch what you need
  },
})
```

❌ **DO NOT**: Fetch full documents when you only need a small subset
- Avoid `*`-style "fetch everything" thinking.

### 4. Hooks & Code Flow

**Hook Design**
✅ **DO**: Keep hooks pure, short, and predictable
- Use them for validation, normalization, or light side-effects.

```typescript
hooks: {
  beforeChange: [
    ({ data }) => {
      // Light transformation
      if (!data.slug) {
        data.slug = slugify(data.title)
      }
      return data
    },
  ],
}
```

❌ **DO NOT**: Put heavy business logic inside hooks
- Move large computations to utilities or custom endpoints.

**Context Sharing**
✅ **DO**: Use `req.context` to share expensive results across hooks
- Avoid duplicate external API calls within the same request lifecycle.

```typescript
hooks: {
  beforeChange: [
    async ({ req }) => {
      if (!req.context.externalData) {
        req.context.externalData = await fetchExternalAPI()
      }
      // Use req.context.externalData in other hooks
    },
  ],
}
```

❌ **DO NOT**: Re-run expensive operations in every hook
- This kills performance and increases API usage costs.

### 5. Security & Production Hardening

**Access Control**
✅ **DO**: Define custom ACL functions for every CRUD operation
- Make access explicit and granular.

```typescript
access: {
  read: ({ req: { user } }) => {
    // Explicit, granular control
    return user?.role === 'admin' || user?.role === 'editor'
  },
  create: ({ req: { user } }) => user?.role === 'admin',
  update: ({ req: { user } }) => user?.role === 'admin',
  delete: ({ req: { user } }) => user?.role === 'admin',
}
```

❌ **DO NOT**: Rely on default `Boolean(user)` access
- This gives too many permissions to any authenticated user.

**Query Restrictions**
✅ **DO**: Set a global `maxDepth` (≤ 3)
- Prevents abusive deep queries.

**GraphQL**
✅ **DO**: Enable GraphQL query complexity limits
- Prevents resource exhaustion attacks.

```typescript
graphQL: {
  maxDepth: 3,
  maxComplexity: 1000,
}
```

❌ **DO NOT**: Run GraphQL without limits
- It is trivially exploitable.

**Authentication**
✅ **DO**: Configure `maxLoginAttempts` and `lockTime`
- Mitigates brute-force attacks.

```typescript
auth: {
  maxLoginAttempts: 5,
  lockTime: 600 * 1000, // 10 minutes
}
```

**Secrets & Environment**
✅ **DO**: Store all secrets in environment variables
- `PAYLOAD_SECRET`, `DATABASE_URI`, S3 keys, etc.

❌ **DO NOT**: Hardcode credentials
- No exceptions.

### 6. Admin UI & Bundling

**Bundling**
✅ **DO**: Use deep imports for Payload UI components in public apps
```typescript
import { Button } from '@payloadcms/ui/elements/Button'
```

❌ **DO NOT**: Import from the root of `@payloadcms/ui`
- This bundles the entire admin panel → huge performance hit.

**Customization**
❌ **DO NOT**: Over-customize the admin with heavy components
- Makes upgrades painful and slows the admin interface.

✅ **DO**: Keep admin custom components isolated and small
- Use only when the default UI cannot support the required workflow.

### 7. API Design & Endpoints

✅ **DO**: Create custom endpoints for workflows
- Examples: publish, sync, webhook ingestion.

```typescript
// src/app/api/custom-endpoint/route.ts
export async function POST(req: Request) {
  const payload = await getPayload({ config: configPromise })
  // Custom workflow logic
}
```

❌ **DO NOT**: Abuse hooks for endpoint-like logic
- If it behaves like a service → it should be an endpoint.

### 8. Migrations & Schema Changes

✅ **DO**: Use Payload migrations for every schema update
- Keeps environments consistent and reproducible.

```bash
npm run payload migrate:create -- --name=add_new_field
npm run payload migrate
```

❌ **DO NOT**: Modify live data directly in the DB
- Especially with JSON structures or relationships.

### 9. Rich Text & Content Editing

✅ **DO**: Use `lexicalEditor()` (already configured)
- It is the future-proof editor.

❌ **DO NOT**: Store raw HTML inside fields
- Breaks security, editing, and sanitization.

### 10. Uploads & File Handling

✅ **DO**: Use S3 / cloud storage in production
- Local disk is not scalable or safe.
- Already configured: Supabase Storage S3 for production, local filesystem for dev.

❌ **DO NOT**: Store large media inside database fields
- Always use an upload collection (`relationTo: 'media'`).

### 11. TypeScript & Reusability

✅ **DO**: Use Payload-generated TS types
- Ensures schema and code reflect each other.

```typescript
import type { Post } from '@/payload-types'

const post: Post = {
  // Type-safe!
}
```

❌ **DO NOT**: Hardcode document interfaces manually
- They drift out of sync.

### 12. Reusable Field Configs

✅ **DO**: Extract common fields (slug, SEO, timestamps)
- Keep your schema DRY and consistent.

```typescript
// src/fields/slug.ts
export const slugField = {
  name: 'slug',
  type: 'text',
  index: true,
  hooks: {
    beforeValidate: [({ data }) => slugify(data.title)],
  },
}

// Use in collections
fields: [
  slugField,
  // ... other fields
]
```

❌ **DO NOT**: Copy/paste identical configs across collections

## Documentation Requirements

### Documentation Policy

✅ **DO**: Keep documentation minimal and focused
- Only `README.md` is required (no other `.md` files)
- `README.md` should be as small as possible
- Include only essential setup and quick start information

❌ **DO NOT**: Create additional documentation files
- No `docs/` folder
- No `GUIDE.md`, `SETUP.md`, `ARCHITECTURE.md`, etc.
- Keep all documentation in `README.md` only

### Code Documentation

✅ **DO**: Use inline code comments for complex logic
- Document "why", not "what"
- Keep comments brief and meaningful

❌ **DO NOT**: Over-comment obvious code
- Let code be self-documenting

## Resources

- [PayloadCMS Docs](https://payloadcms.com/docs)
- [Field Types Reference](https://payloadcms.com/docs/fields/overview)
- [Hooks Documentation](https://payloadcms.com/docs/hooks/overview)

