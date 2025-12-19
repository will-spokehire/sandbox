/**
 * Footer Seed Data
 *
 * Footer content matching the Figma design (node-id: 505-11735).
 * This data will be seeded into the Navigation global.
 */

export const footerData = {
  footerColumns: [
    // Column 1: Contact Info (left column)
    {
      type: 'contact' as const,
      contactInfo: {
        addressLabel: 'Address',
        addressValue: '92 Barcombe Avenue, London, SW2 3BA',
        emailLabel: 'Contact',
        emailValue: 'hello@spokehire.com',
      },
    },
    // Column 2: About Links
    {
      type: 'links' as const,
      title: undefined, // No title in Figma
      links: [
        { label: 'About', url: '/about' },
        { label: 'Vehicles', url: '/vehicles' },
        { label: 'Hire a car', url: '/hire' },
        { label: 'List your car', url: '/list-your-car' },
        { label: 'Contact us', url: '/contact' },
        { label: 'Terms & Conditions', url: '/terms' },
      ],
    },
    // Column 3: Classic Car Hire Services
    {
      type: 'links' as const,
      title: undefined, // No title in Figma
      links: [
        { label: 'Classic car hire', url: '/classic-car-hire' },
        { label: 'Classic car hire for film', url: '/classic-car-hire/film' },
        { label: 'Classic car hire for photoshoot', url: '/classic-car-hire/photoshoot' },
        { label: 'Classic car hire for wedding', url: '/classic-car-hire/wedding' },
      ],
    },
    // Column 4: Location-based Links
    {
      type: 'links' as const,
      title: undefined, // No title in Figma
      links: [
        { label: 'Classic car hire in London', url: '/classic-car-hire/london' },
        { label: 'Classic car hire in Edinburgh', url: '/classic-car-hire/edinburgh' },
        { label: 'Classic car hire in Manchester', url: '/classic-car-hire/manchester' },
        { label: 'Classic car hire in Birmingham', url: '/classic-car-hire/birmingham' },
        { label: 'Classic car hire in Bristol', url: '/classic-car-hire/bristol' },
        { label: 'Classic car hire in Oxford', url: '/classic-car-hire/oxford' },
        { label: 'Classic car hire in York', url: '/classic-car-hire/york' },
        { label: 'Classic car hire in Kent', url: '/classic-car-hire/kent' },
      ],
    },
    // Column 5: Vehicle-specific Links
    {
      type: 'links' as const,
      title: undefined, // No title in Figma
      links: [
        { label: 'Renault Alpine hire', url: '/vehicles/renault-alpine' },
        { label: 'Jaguar E-Type hire', url: '/vehicles/jaguar-e-type' },
        { label: 'Classic car hire in Birmingham', url: '/classic-car-hire/birmingham' },
        { label: 'Classic car hire in Bristol', url: '/classic-car-hire/bristol' },
        { label: 'Classic car hire in Oxford', url: '/classic-car-hire/oxford' },
        { label: 'Classic car hire in York', url: '/classic-car-hire/york' },
        { label: 'Classic car hire in Kent', url: '/classic-car-hire/kent' },
      ],
    },
  ],
  socialLinks: [
    {
      platform: 'instagram' as const,
      url: 'https://instagram.com/spokehire',
      icon: 'instagram',
    },
  ],
  footerSettings: {
    copyrightText: '© 2026 Spoke Hire Ltd. All rights reserved.',
    privacyPolicyUrl: '/privacy-policy',
    termsOfServiceUrl: '/terms-of-service',
    showLargeLogo: true,
  },
}


