import Link from 'next/link'
import Image from 'next/image'
import { cn } from '~/lib/utils'
import { getNavigation, type Navigation } from '~/lib/payload-api'
import { FOOTER_STYLES } from '~/lib/design-tokens'
import { Instagram } from 'lucide-react'

interface FooterProps {
  navigation?: Navigation | null
}

/**
 * Footer Component
 *
 * Displays footer content from PayloadCMS Navigation global.
 * Matches Figma design (node-id: 505-11735) exactly.
 */
export async function Footer({ navigation }: FooterProps) {
  // Fetch navigation if not provided (for server components)
  const nav = navigation || (await getNavigation())

  if (!nav) {
    return null
  }

  const { footerColumns, socialLinks, footerSettings } = nav

  // Get contact column (first column with type 'contact')
  const contactColumn = footerColumns?.find((col) => col.type === 'contact')
  const linkColumns = footerColumns?.filter((col) => col.type === 'links') || []

  // Get Instagram link
  const instagramLink = socialLinks?.find((link) => link.platform === 'instagram')

  return (
    <footer className={cn(FOOTER_STYLES.container, FOOTER_STYLES.padding)}>
      <div className="flex flex-col items-center w-full">
        {/* Logo Section */}
        {footerSettings?.showLargeLogo && (
          <div className="w-full mb-[80px]">
            <div className="relative w-full" style={{ aspectRatio: '1392/323' }}>
              <Image
                src="/SpokeHire-Logo.svg"
                alt="SpokeHire Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className={cn('w-full flex flex-col lg:flex-row', FOOTER_STYLES.columnGap, 'items-start justify-start')}>
          {/* Left Column - Contact Info */}
          <div className={cn('flex-1 min-w-0 w-full lg:w-auto', FOOTER_STYLES.contactColumn)}>
            {/* Address */}
            {contactColumn?.contactInfo?.addressValue && (
              <div className="flex flex-col gap-1">
                <p className={FOOTER_STYLES.heading}>
                  {contactColumn.contactInfo.addressLabel || 'Address'}
                </p>
                <p className={FOOTER_STYLES.body}>
                  {contactColumn.contactInfo.addressValue}
                </p>
              </div>
            )}

            {/* Contact Email */}
            {contactColumn?.contactInfo?.emailValue && (
              <div className="flex flex-col gap-1">
                <p className={FOOTER_STYLES.heading}>
                  {contactColumn.contactInfo.emailLabel || 'Contact'}
                </p>
                <a
                  href={`mailto:${contactColumn.contactInfo.emailValue}`}
                  className={FOOTER_STYLES.body}
                >
                  {contactColumn.contactInfo.emailValue}
                </a>
              </div>
            )}

            {/* Social Links */}
            {socialLinks && socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                <p className={FOOTER_STYLES.heading}>
                  Follow us
                </p>
                <div className="flex items-center gap-3">
                  {socialLinks.map((socialLink) => {
                    if (socialLink.platform === 'instagram') {
                      return (
                        <a
                          key={socialLink.id || socialLink.platform}
                          href={socialLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-6 h-6 flex items-center justify-center"
                          aria-label="Instagram"
                        >
                          <Instagram className="w-6 h-6 text-black" />
                        </a>
                      )
                    }
                    // Add other social platforms as needed
                    return null
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Columns - Link Lists */}
          <div className="flex flex-wrap gap-16 items-start">
            {linkColumns.map((column, index) => (
              <div
                key={column.id || index}
                className={cn('flex-shrink-0', FOOTER_STYLES.linkColumn)}
              >
              {column.title && (
                <p className={FOOTER_STYLES.heading}>{column.title}</p>
              )}
              {column.links && column.links.length > 0 && (
                <div className={FOOTER_STYLES.linkColumn}>
                  {column.links.map((link) => (
                    <Link
                      key={link.id || link.url}
                      href={link.url}
                      className={cn(FOOTER_STYLES.link, 'whitespace-nowrap')}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={cn('w-full mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4')}>
          {/* Copyright */}
          <p className={FOOTER_STYLES.copyright}>
            {footerSettings?.copyrightText || '© 2026 Spoke Hire Ltd. All rights reserved.'}
          </p>

          {/* Legal Links */}
          <div className={cn('flex items-center', FOOTER_STYLES.bottomLinks)}>
            {footerSettings?.privacyPolicyUrl && (
              <Link
                href={footerSettings.privacyPolicyUrl}
                className={FOOTER_STYLES.link}
              >
                Privacy Policy
              </Link>
            )}
            {footerSettings?.termsOfServiceUrl && (
              <Link
                href={footerSettings.termsOfServiceUrl}
                className={FOOTER_STYLES.link}
              >
                Terms of Service
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
