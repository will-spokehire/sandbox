'use client'

import { useEffect, useState } from 'react'
import { Footer } from './Footer'
import type { Navigation } from '~/lib/payload-api'

/**
 * Footer Client Component
 *
 * Client-side wrapper for Footer that fetches navigation data.
 * Use this in client components.
 */
export function FooterClient() {
  const [navigation, setNavigation] = useState<Navigation | null>(null)

  useEffect(() => {
    async function fetchNavigation() {
      try {
        // Fetch from PayloadCMS API directly
        const apiUrl = process.env.NEXT_PUBLIC_PAYLOAD_API_URL || 'http://localhost:3000'
        const baseUrl = apiUrl.replace(/\/+$/, '').replace(/\/api\/?$/, '')
        const response = await fetch(`${baseUrl}/api/globals/navigation?depth=2`)
        
        if (response.ok) {
          const data = await response.json()
          setNavigation(data)
        }
      } catch (error) {
        console.error('Failed to fetch navigation:', error)
      }
    }

    fetchNavigation()
  }, [])

  if (!navigation) {
    return null // Or a loading state
  }

  return <Footer navigation={navigation} />
}

export default FooterClient

