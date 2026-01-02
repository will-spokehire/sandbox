import { redirect } from 'next/navigation'

/**
 * Root page redirects to admin panel
 * 
 * All user-facing UI has been removed from the CMS.
 * Only the admin panel (which includes login) is accessible.
 */
export default function RootPage() {
  redirect('/admin')
}

