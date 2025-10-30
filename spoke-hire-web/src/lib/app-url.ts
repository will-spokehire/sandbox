/**
 * Get the application base URL
 * 
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL (if set - for production/custom domains)
 * 2. VERCEL_URL (auto-detected for preview deployments)
 * 3. http://localhost:3000 (fallback for local development)
 * 
 * @returns The base URL with protocol (e.g., "https://example.com" or "http://localhost:3000")
 */
export function getAppUrl(): string {
  // Use explicit NEXT_PUBLIC_APP_URL if set (production/custom domain)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Auto-detect Vercel preview URL (dynamic per branch/PR)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Fallback to localhost for local development
  return "http://localhost:3000";
}




