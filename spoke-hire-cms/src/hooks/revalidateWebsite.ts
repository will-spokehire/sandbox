/**
 * Webhook utility for triggering Next.js cache revalidation
 * 
 * Sends a POST request to the Next.js revalidation endpoint when CMS content changes.
 * Uses a simplified approach: broad cache invalidation for all CMS content.
 */

interface RevalidateWebhookPayload {
  collection: string
  operation: 'create' | 'update' | 'delete'
  secret: string
}

/**
 * Trigger website cache revalidation via webhook
 * 
 * @param collection - Name of the collection/global that changed
 * @param operation - Type of operation (create, update, delete)
 * @returns Promise that resolves when webhook is sent (fire-and-forget style)
 */
export async function revalidateWebsite(
  collection: string,
  operation: 'create' | 'update' | 'delete'
): Promise<void> {
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL
  const revalidationSecret = process.env.REVALIDATION_SECRET

  // Skip if environment variables are not configured
  if (!websiteUrl || !revalidationSecret) {
    console.warn(
      '[RevalidateWebsite] Skipping revalidation: NEXT_PUBLIC_WEBSITE_URL or REVALIDATION_SECRET not configured'
    )
    return
  }

  const revalidateUrl = `${websiteUrl.replace(/\/+$/, '')}/api/revalidate`

  const payload: RevalidateWebhookPayload = {
    collection,
    operation,
    secret: revalidationSecret,
  }

  try {
    const response = await fetch(revalidateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(
        `Revalidation webhook failed: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    console.log(
      `[RevalidateWebsite] Successfully triggered revalidation for ${collection} (${operation})`
    )
  } catch (error) {
    // Log error but don't throw - we don't want to break CMS operations if webhook fails
    console.error(
      `[RevalidateWebsite] Failed to trigger revalidation for ${collection} (${operation}):`,
      error
    )
  }
}
