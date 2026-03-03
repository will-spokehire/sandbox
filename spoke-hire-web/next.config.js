/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.wixstatic.com",
        pathname: "/media/**",
      },
      // Production Supabase
      {
        protocol: "https",
        hostname: "fowkrmwxgvmjbdzgrsfn.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Preview Supabase
      {
        protocol: "https",
        hostname: "lvaehnoqdzieersmujhb.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Test Supabase
      {
        protocol: "https",
        hostname: "fqjvwgrxenogyrcnnhze.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Local Supabase (Docker)
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      // PayloadCMS (Local Development)
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/api/media/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/api/media/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3000",
        pathname: "/api/media/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3001",
        pathname: "/api/media/**",
      },
      // PayloadCMS (Production - Vercel)
      {
        protocol: "https",
        hostname: "spoke-hire-cms-cornerapp-vertextree.vercel.app",
        pathname: "/api/media/**",
      },
      {
        protocol: "https",
        hostname: "spoke-hire-cms.vercel.app",
        pathname: "/api/media/**",
      },
      // Main domain
      {
        protocol: "https",
        hostname: "www.spokehire.com",
        pathname: "/**",
      },
    ],
  },
};

export default config;
