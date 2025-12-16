import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    
    // Ignore Prisma from workspace root
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      '@prisma/client': false,
      'prisma': false,
    }

    return webpackConfig
  },
  // Disable Prisma auto-detection
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
