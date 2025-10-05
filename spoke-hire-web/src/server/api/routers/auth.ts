import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

/**
 * Auth Router
 * 
 * Handles authentication operations:
 * - Sign in with email OTP
 * - Verify OTP
 * - Sign out
 * - Get current session
 * - Resend OTP
 */
export const authRouter = createTRPCRouter({
  /**
   * Sign in with email OTP
   * Sends a one-time password to the user's email
   */
  signInWithOtp: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        redirectTo: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, redirectTo } = input;

      // Check if user exists in our database and is an admin
      const user = await ctx.db.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found. Please contact support.",
        });
      }

      if (user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied. Admin privileges required.",
        });
      }

      if (user.status !== "ACTIVE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Account is not active. Please contact support.",
        });
      }

      // Send OTP via Supabase
      const { error } = await ctx.supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Don't create user in Supabase Auth if not exists
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        console.error("Supabase OTP error:", error);
        
        // Handle rate limiting
        if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests. Please wait a moment before trying again.",
          });
        }
        
        // Handle other errors
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to send verification code. Please try again.",
        });
      }

      return {
        success: true,
        message: "Verification code sent to your email",
      };
    }),

  /**
   * Verify OTP code
   * This is called AFTER client-side Supabase verification
   * Validates user exists in DB, has admin role, and updates login time
   */
  verifyOtp: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        token: z.string().min(6, "Code must be at least 6 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email } = input;

      // Check if user is now authenticated in Supabase
      // The client-side already verified the OTP and created the session
      const { data: { user: supabaseUser } } = await ctx.supabase.auth.getUser();

      if (!supabaseUser || supabaseUser.email !== email) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Session not found. Please try again.",
        });
      }

      // Get user from our database
      const user = await ctx.db.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          status: true,
          supabaseId: true,
        },
      });

      if (!user) {
        // User doesn't exist in our DB, sign them out
        await ctx.supabase.auth.signOut();
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User account not found",
        });
      }

      // Verify user is admin
      if (user.userType !== 'ADMIN') {
        await ctx.supabase.auth.signOut();
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied. Admin privileges required.",
        });
      }

      // Verify user is active
      if (user.status !== 'ACTIVE') {
        await ctx.supabase.auth.signOut();
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Account is not active. Please contact support.",
        });
      }

      // Update supabaseId if not set
      if (!user.supabaseId || user.supabaseId !== supabaseUser.id) {
        await ctx.db.user.update({
          where: { email },
          data: { supabaseId: supabaseUser.id },
        });
      }

      // Update last login time
      await ctx.db.user.update({
        where: { email },
        data: { lastLoginAt: new Date() },
      });

      return {
        success: true,
        message: "Successfully authenticated",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
        },
      };
    }),

  /**
   * Sign out
   * Ends the current session
   */
  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    const { error } = await ctx.supabase.auth.signOut();

    if (error) {
      console.error("Supabase sign out error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to sign out. Please try again.",
      });
    }

    return {
      success: true,
      message: "Successfully signed out",
    };
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
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email } = input;

      // Check if user exists and is admin
      const user = await ctx.db.user.findUnique({
        where: { email },
      });

      if (!user || user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      // Resend OTP
      const { error } = await ctx.supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        console.error("Supabase resend OTP error:", error);
        
        // Handle rate limiting
        if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests. Please wait at least 60 seconds between requests.",
          });
        }
        
        // Handle other errors
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to resend verification code",
        });
      }

      return {
        success: true,
        message: "Verification code resent",
      };
    }),
});

