import { Footer } from './Footer'

/**
 * Footer Wrapper
 *
 * Server component wrapper for Footer that fetches navigation data.
 * Use this in server components. For client components, use FooterClient.
 */
export async function FooterWrapper() {
  return <Footer />
}

export default FooterWrapper




