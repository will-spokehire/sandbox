'use client'

import React from 'react'

export const dynamic = 'force-dynamic'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <h1 style={{ fontSize: '48px', margin: 0, color: '#333' }}>Something went wrong!</h1>
      <p style={{ fontSize: '18px', color: '#666', marginTop: '10px' }}>
        {error?.message || 'An error occurred'}
      </p>
      <button 
        onClick={() => reset()}
        style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
      >
        Try again
      </button>
    </div>
  )
}


