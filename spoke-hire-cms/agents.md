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

- ✅ Use TypeScript types from `payload-types.ts`
- ✅ Keep collections focused and single-purpose
- ✅ Use relationships instead of duplicating data
- ✅ Add access control to all collections
- ✅ Use hooks for business logic, not field defaults
- ✅ Test migrations locally before deploying
- ✅ Document complex field configurations

## Resources

- [PayloadCMS Docs](https://payloadcms.com/docs)
- [Field Types Reference](https://payloadcms.com/docs/fields/overview)
- [Hooks Documentation](https://payloadcms.com/docs/hooks/overview)

