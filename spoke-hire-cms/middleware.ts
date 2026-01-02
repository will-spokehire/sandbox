import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to redirect all non-admin, non-API routes to /admin
 * 
 * Allows:
 * - /admin and /admin/* (PayloadCMS admin panel)
 * - /api/* (backend API endpoints)
 * 
 * Redirects everything else to /admin
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow admin routes
  if (pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Allow API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Redirect all other routes to /admin
  return NextResponse.redirect(new URL('/admin', request.url))
}

export const config = {
  matcher: [
    /*
     * Match all request paths including root (/)
     * Excludes:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)?',
  ],
}

