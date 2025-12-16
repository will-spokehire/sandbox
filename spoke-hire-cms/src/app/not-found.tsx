'use client'

import React from 'react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <h1 style={{ fontSize: '72px', margin: 0, color: '#333' }}>404</h1>
      <p style={{ fontSize: '24px', color: '#666' }}>Page Not Found</p>
      <Link href="/" style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
        Go Home
      </Link>
    </div>
  )
}

