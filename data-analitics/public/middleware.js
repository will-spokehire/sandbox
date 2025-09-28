import { NextResponse } from 'next/server';

const USERNAME = process.env.BASIC_AUTH_USERNAME;
const PASSWORD = process.env.BASIC_AUTH_PASSWORD;

// Create the basic auth header value
const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

export function middleware(request) {
  // Check if basic auth is enabled
  if (!USERNAME || !PASSWORD) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  const authorization = requestHeaders.get('authorization');

  // If no authorization header or incorrect credentials
  if (!authorization || authorization !== `Basic ${auth}`) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
