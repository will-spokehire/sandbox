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
 * REFACTORED: Now uses service layer pattern for better separation of concerns.
 */

import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { AuthService } from "../services/auth.service";

// ============================================================================
// Input Validation Schemas
// ============================================================================

const signInWithOtpInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  redirectTo: z.string().url().optional(),
});

const verifyOtpInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  token: z.string().min(6, "Code must be at least 6 characters"),
});

const resendOtpInputSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// ============================================================================
// Router Definition
// ============================================================================

export const authRouterRefactored = createTRPCRouter({
  /**
   * Sign in with email OTP
   * Sends a one-time password to the user's email
   */
  signInWithOtp: publicProcedure
    .input(signInWithOtpInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new AuthService(ctx.db, ctx.supabase);
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
      const service = new AuthService(ctx.db, ctx.supabase);
      return await service.verifyOtp(input);
    }),

  /**
   * Sign out
   * Ends the current session
   */
  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    const service = new AuthService(ctx.db, ctx.supabase);
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
        userType: ctx.user.userType,
        status: ctx.user.status,
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
      const service = new AuthService(ctx.db, ctx.supabase);
      return await service.resendOtp(input.email);
    }),
});
