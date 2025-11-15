/**
 * Auth Router (Refactored)
 * 
 * Handles authentication operations:
 * - Sign in with email OTP
 * - Verify OTP
 * - Sign out
 * - Get current session
 * - Resend OTP
 * 
 * REFACTORED: Now uses ServiceFactory for consistent service creation.
 */

import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { ServiceFactory } from "../services/service-factory";

// ============================================================================
// Input Validation Schemas
// ============================================================================

const signInWithOtpInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  redirectTo: z.string().url().optional(),
  termsAccepted: z.boolean().optional(),
  termsAcceptanceId: z.string().optional(),
  privacyPolicyAccepted: z.boolean().optional(),
  privacyAcceptanceId: z.string().optional(),
});

const verifyOtpInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  token: z.string().min(6, "Code must be at least 6 characters"),
  termsAccepted: z.boolean().optional(),
  termsAcceptanceId: z.string().optional(),
  privacyPolicyAccepted: z.boolean().optional(),
  privacyAcceptanceId: z.string().optional(),
});

const resendOtpInputSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const acceptTermsInputSchema = z.object({
  termsAccepted: z.boolean(),
  privacyPolicyAccepted: z.boolean(),
});

const verifyGoogleAuthInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  termsAccepted: z.boolean().optional(),
  termsAcceptanceId: z.string().optional(),
  privacyPolicyAccepted: z.boolean().optional(),
  privacyAcceptanceId: z.string().optional(),
});

// ============================================================================
// Router Definition
// ============================================================================

export const authRouter = createTRPCRouter({
  /**
   * Sign in with email OTP
   * Sends a one-time password to the user's email
   */
  signInWithOtp: publicProcedure
    .input(signInWithOtpInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createAuthService(ctx.db, ctx.supabase);
      return await service.signInWithOtp(input);
    }),

  /**
   * Verify OTP code
   * This is called AFTER client-side Supabase verification
   * Validates user exists in DB, has admin role, and updates login time
   */
  verifyOtp: publicProcedure
    .input(verifyOtpInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createAuthService(ctx.db, ctx.supabase);
      return await service.verifyOtp(input);
    }),

  /**
   * Verify Google OAuth
   * This is called AFTER client-side Supabase OAuth verification
   * Validates user exists in DB or creates new user, and updates login time
   */
  verifyGoogleAuth: publicProcedure
    .input(verifyGoogleAuthInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createAuthService(ctx.db, ctx.supabase);
      return await service.signInWithGoogle(input);
    }),

  /**
   * Sign out
   * Ends the current session
   */
  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    const service = ServiceFactory.createAuthService(ctx.db, ctx.supabase);
    return await service.signOut();
  }),

  /**
   * Get current session
   * Returns the current user and session info
   */
  getSession: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user || !ctx.supabaseUser) {
      return {
        user: null,
        session: null,
      };
    }

    return {
      user: {
        id: ctx.user.id,
        email: ctx.user.email,
        firstName: ctx.user.firstName,
        lastName: ctx.user.lastName,
        phone: ctx.user.phone,
        company: ctx.user.company,
        street: ctx.user.street,
        city: ctx.user.city,
        county: ctx.user.county,
        postcode: ctx.user.postcode,
        countryId: ctx.user.countryId,
        userType: ctx.user.userType,
        status: ctx.user.status,
        profileCompleted: ctx.user.profileCompleted,
      },
      session: {
        userId: ctx.supabaseUser.id,
        email: ctx.supabaseUser.email,
      },
    };
  }),

  /**
   * Resend OTP
   * Resends the verification code
   */
  resendOtp: publicProcedure
    .input(resendOtpInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createAuthService(ctx.db, ctx.supabase);
      return await service.resendOtp(input.email);
    }),

  /**
   * Accept Terms & Conditions and Privacy Policy
   * Must be called after successful authentication
   */
  acceptTerms: protectedProcedure
    .input(acceptTermsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = ServiceFactory.createAuthService(ctx.db, ctx.supabase);
      return await service.acceptTerms(ctx.user.id, input);
    }),
});
