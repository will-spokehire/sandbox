import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
    // Google OAuth - configured in Supabase (optional for documentation)
    GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
    // Analytics - Server-side tracking
    AMPLITUDE_SERVER_API_KEY: z.string().optional(),
    // Email Service (Loops) - Optional configurations
    LOOPS_API_KEY: z.string().optional(),
    LOOPS_TRANSACTIONAL_ID: z.string().optional(),
    LOOPS_VEHICLE_PUBLISHED_ID: z.string().optional(),
    LOOPS_VEHICLE_DECLINED_ID: z.string().optional(),
    LOOPS_VEHICLE_IN_REVIEW_ID: z.string().optional(),
    LOOPS_ENQUIRY_ADMIN_ID: z.string().optional(),
    LOOPS_ENQUIRY_USER_ID: z.string().optional(),
    LOOPS_EMAIL_SEND_DELAY_MS: z.string().regex(/^\d+$/).optional().default("200"),
    EMAIL_DEBUG: z.string().optional(),
    TEST_EMAIL_OVERRIDE: z.string().email().optional(),
    ADMIN_NOTIFICATION_EMAIL: z.string().email().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    // Optional - auto-detects Vercel URL if not set
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    // Analytics - Client-side tracking
    NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
    NEXT_PUBLIC_AMPLITUDE_API_KEY: z.string().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    AMPLITUDE_SERVER_API_KEY: process.env.AMPLITUDE_SERVER_API_KEY,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_AMPLITUDE_API_KEY: process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY,
    // Email Service (Loops)
    LOOPS_API_KEY: process.env.LOOPS_API_KEY,
    LOOPS_TRANSACTIONAL_ID: process.env.LOOPS_TRANSACTIONAL_ID,
    LOOPS_VEHICLE_PUBLISHED_ID: process.env.LOOPS_VEHICLE_PUBLISHED_ID,
    LOOPS_VEHICLE_DECLINED_ID: process.env.LOOPS_VEHICLE_DECLINED_ID,
    LOOPS_VEHICLE_IN_REVIEW_ID: process.env.LOOPS_VEHICLE_IN_REVIEW_ID,
    LOOPS_ENQUIRY_ADMIN_ID: process.env.LOOPS_ENQUIRY_ADMIN_ID,
    LOOPS_ENQUIRY_USER_ID: process.env.LOOPS_ENQUIRY_USER_ID,
    LOOPS_EMAIL_SEND_DELAY_MS: process.env.LOOPS_EMAIL_SEND_DELAY_MS,
    EMAIL_DEBUG: process.env.EMAIL_DEBUG,
    TEST_EMAIL_OVERRIDE: process.env.TEST_EMAIL_OVERRIDE,
    ADMIN_NOTIFICATION_EMAIL: process.env.ADMIN_NOTIFICATION_EMAIL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
