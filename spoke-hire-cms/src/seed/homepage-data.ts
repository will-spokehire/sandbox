/**
 * Homepage Seed Data
 * Based on Figma design: https://www.figma.com/design/MzN2hp7rcTKoVmEnWBe7ZJ/Spoke---Website-DevFile?node-id=481-1238
 *
 * This file contains all the content data for the main homepage.
 * Run the seed script to populate PayloadCMS with this data.
 */

// ============================================
// HERO SLIDES
// ============================================
export const heroSlides = [
  {
    heading: 'Classic car hire made easy',
    subheading:
      "Access the UK's largest classic car hire platform with thousands of vehicles available to hire today. Can't see it on the site? We'll find it.",
    ctaText: 'Find a car',
    ctaLink: '/vehicles',
    order: 1,
    status: 'published' as const,
  },
]

// ============================================
// STATS BAR
// ============================================
export const stats = [
  {
    label: 'Vehicles',
    value: '10,000+',
    icon: 'car',
    order: 1,
    status: 'published' as const,
  },
  {
    label: 'Specialist Support',
    value: '24/7',
    icon: 'headset',
    order: 2,
    status: 'published' as const,
  },
  {
    label: 'UK-wide Delivery',
    value: 'Nationwide',
    icon: 'network',
    order: 3,
    status: 'published' as const,
  },
  {
    label: 'Trusted Supplier',
    value: '5★',
    icon: 'shield-check',
    order: 4,
    status: 'published' as const,
  },
]

// ============================================
// VALUE PROPOSITIONS (RTBs - Reasons to Believe)
// ============================================
export const valueProps = [
  {
    title: 'Experts in Classic Cars',
    description:
      "We're not just a booking platform. We understand classic cars and their unique needs.",
    icon: 'award',
    order: 1,
    status: 'published' as const,
  },
  {
    title: "The UK's Largest Network",
    description:
      'Every vehicle vetted, every detail understood. Real people supporting you every step of the way.',
    icon: 'globe',
    order: 2,
    status: 'published' as const,
  },
  {
    title: '24 Hour Response Time',
    description:
      "Questions? Issues? We're here. Fast and clear communication whenever you need us across the UK.",
    icon: 'clock',
    order: 3,
    status: 'published' as const,
  },
  {
    title: 'Trusted Vehicle Supplier',
    description:
      'Search thousands of vehicles, book with confidence, coordinate seamlessly. We handle the complexity.',
    icon: 'shield',
    order: 4,
    status: 'published' as const,
  },
]

// ============================================
// CTA BLOCKS
// ============================================
export const ctaBlocks = [
  {
    heading: 'LIST YOUR CAR TODAY',
    headingLevel: 'h2' as const,
    description:
      "Do you own a classic car? Join the UK's fastest growing platform for classic car hire and start earning today with Spoke Hire.",
    actions: [
      {
        label: 'List your car',
        link: '/register',
        style: 'primary' as const,
      },
      {
        label: 'Contact us',
        link: '/contact',
        style: 'outline' as const,
      },
    ],
    backgroundStyle: 'primary' as const,
    status: 'published' as const,
  },
]

// ============================================
// HOMEPAGE STATIC PAGE LAYOUT
// ============================================
export const homepageLayout = {
  title: 'Home',
  slug: 'home',
  status: 'published' as const,
  metaTitle: "Spoke Hire | UK's Largest Classic Car Hire Platform",
  metaDescription:
    "Access the UK's largest classic car hire platform with thousands of vehicles available. Classic car hire for film, photoshoots, weddings, and events.",
  layout: [
    // Block 1: Hero Carousel
    {
      blockType: 'hero-carousel',
      title: 'Hero Section',
      autoplay: true,
      autoplayDelay: 5000,
      showArrows: true,
      showDots: true,
      // slides will be linked by relationship
    },
    // Block 2: Stats Bar
    {
      blockType: 'stats-bar',
      title: 'Stats Bar',
      displayStyle: 'badges',
      columns: 4,
      backgroundColor: 'default',
      // selectedStats will be linked by relationship
    },
    // Block 3: Featured Vehicles
    {
      blockType: 'featured-vehicles',
      title: 'FEATURED CARS',
      subtitle: 'Explore our popular vehicles, available to hire today.',
      selectionType: 'latest',
      limit: 4,
      displayStyle: 'carousel',
      columns: 4,
    },
    // Block 4: New Arrivals (Featured Vehicles with different config)
    {
      blockType: 'featured-vehicles',
      title: 'NEW ARRIVALS',
      subtitle: 'Check out the latest additions to our roster.',
      selectionType: 'latest',
      limit: 4,
      displayStyle: 'carousel',
      columns: 4,
    },
    // Block 5: Value Props Section (RTBs)
    {
      blockType: 'value-props-section',
      title: "The UK's Most Trusted Classic Car Supplier",
      subtitle: 'Discover thousands of vehicles available to hire from action vehicles to wedding cars.',
      displayStyle: 'grid',
      columns: 2,
      // selectedProps will be linked by relationship
    },
    // Block 6: Image Gallery (Project Spotlight) - SKIPPED: requires images to be uploaded first
    // Add this block manually via CMS admin after uploading project spotlight images
    // Block 7: Call-to-Action Block
    {
      blockType: 'call-to-action-block',
      // selectedCTA will be linked by relationship
    },
  ],
}

// ============================================
// SECTION TITLES & COPY
// These are the exact text from the Figma design
// ============================================
export const sectionContent = {
  hero: {
    headline: ['Classic car hire', 'made easy'],
    description:
      "Access the UK's largest classic car hire platform with thousands of vehicles available to hire today. Can't see it on the site? We'll find it.",
    primaryCTA: { text: 'Find a car', link: '/vehicles' },
    secondaryCTA: { text: 'List your car', link: '/register' },
  },
  featuredCars: {
    title: 'FEATURED CARS',
    subtitle: 'Explore our popular vehicles, available to hire today.',
    cta: { text: 'See all vehicles', link: '/vehicles' },
  },
  newArrivals: {
    title: 'NEW ARRIVALS',
    subtitle: 'Check out the latest additions to our roster.',
    cta: { text: 'See all vehicles', link: '/vehicles' },
  },
  rtbs: {
    title: ["The UK's most", 'trusted classic', 'car supplier'],
    subtitle: 'Discover thousands of vehicles available to hire from action vehicles to wedding cars.',
    primaryCTA: { text: 'All vehicles', link: '/vehicles' },
    secondaryCTA: { text: 'Get in touch', link: '/contact' },
  },
  projectSpotlight: {
    title: 'PROJECT SPOTLIGHT',
    projects: [
      { name: 'ABOUT BLANC', link: '/projects/about-blanc' },
      { name: 'CENTRAL CEE', link: '/projects/central-cee' },
      { name: 'SACHA KEABEL', link: '/projects/sacha-keabel' },
      { name: 'TOTTENHAM HOTSPUR FC', link: '/projects/tottenham-hotspur' },
    ],
  },
  listYourCar: {
    headline: 'LIST YOUR CAR TODAY',
    description:
      "Do you own a classic car? Join the UK's fastest growing platform for classic car hire and start earning today with Spoke Hire.",
    primaryCTA: { text: 'List your car', link: '/register' },
    secondaryCTA: { text: 'Contact us', link: '/contact' },
  },
}

