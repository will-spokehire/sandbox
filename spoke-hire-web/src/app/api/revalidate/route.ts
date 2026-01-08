import { revalidateTag, revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Revalidation API Route
 * 
 * Secure endpoint for PayloadCMS to trigger cache invalidation.
 * Uses simplified broad invalidation strategy to ensure all CMS content is refreshed.
 */

interface RevalidateRequest {
  collection: string
  operation: 'create' | 'update' | 'delete'
  secret: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RevalidateRequest = await request.json()
    const { collection, operation, secret } = body

    // Validate secret token
    const expectedSecret = process.env.REVALIDATION_SECRET
    if (!expectedSecret) {
      console.error('[Revalidate] REVALIDATION_SECRET not configured')
      return NextResponse.json(
        { error: 'Revalidation not configured' },
        { status: 500 }
      )
    }

    if (secret !== expectedSecret) {
      console.warn(
        `[Revalidate] Invalid secret token attempt for collection: ${collection}`
      )
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Log revalidation attempt
    console.log(
      `[Revalidate] Revalidating cache for ${collection} (${operation})`
    )

    // Simplified broad invalidation strategy
    // Invalidate all CMS-related cache using tag
    await revalidateTag('cms-content')

    // Invalidate homepage and all pages (layout revalidation affects all pages)
    await revalidatePath('/', 'layout')

    console.log(
      `[Revalidate] Successfully revalidated cache for ${collection} (${operation})`
    )

    return NextResponse.json({
      revalidated: true,
      collection,
      operation,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Revalidate] Error processing revalidation request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
