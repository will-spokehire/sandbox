/**
 * Auth Service
 * 
 * Business logic layer for authentication operations.
 * Handles OTP, user validation, and session management.
 * 
 * REFACTORED: Now uses dependency injection and shared types.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRepository } from "../repositories/user.repository";
import {
  UserNotFoundError,
  AdminRequiredError,
  AccountInactiveError,
  OTPError,
  RateLimitError,
  UnauthorizedError,
} from "../errors/app-errors";
import type { SignInWithOtpParams, VerifyOtpParams } from "~/server/types";

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private supabase: SupabaseClient
  ) {}

  /**
   * Sign in with OTP
   * Validates user exists, is admin, and is active before sending OTP
   */
  async signInWithOtp(params: SignInWithOtpParams) {
    const { email, redirectTo } = params;

    // Check if user exists in our database
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UserNotFoundError(email);
    }

    // Verify user is admin
    if (user.userType !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // Verify user is active
    if (user.status !== "ACTIVE") {
      throw new AccountInactiveError();
    }

    // Send OTP via Supabase
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      console.error("Supabase OTP error:", error);

      // Handle rate limiting
      if (error.status === 429 || error.code === "over_email_send_rate_limit") {
        throw new RateLimitError(60);
      }

      // Handle other errors
      throw new OTPError(error.message || "Failed to send verification code", error);
    }

    return {
      success: true,
      message: "Verification code sent to your email",
    };
  }

  /**
   * Verify OTP code
   * Validates session exists and user has proper permissions
   */
  async verifyOtp(params: VerifyOtpParams) {
    const { email } = params;

    // Check if user is authenticated in Supabase
    const {
      data: { user: supabaseUser },
    } = await this.supabase.auth.getUser();

    if (!supabaseUser || supabaseUser.email !== email) {
      throw new UnauthorizedError("Session not found. Please try again.");
    }

    // Get user from our database
    const user = await this.userRepository.getSessionUser(email);

    if (!user) {
      // User doesn't exist in our DB, sign them out
      await this.supabase.auth.signOut();
      throw new UserNotFoundError(email);
    }

    // Verify user is admin
    if (user.userType !== "ADMIN") {
      await this.supabase.auth.signOut();
      throw new AdminRequiredError();
    }

    // Verify user is active
    if (user.status !== "ACTIVE") {
      await this.supabase.auth.signOut();
      throw new AccountInactiveError();
    }

    // Update supabaseId if not set
    if (!user.supabaseId || user.supabaseId !== supabaseUser.id) {
      await this.userRepository.updateSupabaseId(email, supabaseUser.id);
    }

    // Update last login time
    await this.userRepository.updateLastLogin(email);

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
  }

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      console.error("Supabase sign out error:", error);
      throw new OTPError("Failed to sign out. Please try again.", error);
    }

    return {
      success: true,
      message: "Successfully signed out",
    };
  }

  /**
   * Resend OTP
   */
  async resendOtp(email: string) {
    // Check if user exists and is admin
    const user = await this.userRepository.findByEmail(email);

    if (!user || user.userType !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // Resend OTP
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      console.error("Supabase resend OTP error:", error);

      // Handle rate limiting
      if (error.status === 429 || error.code === "over_email_send_rate_limit") {
        throw new RateLimitError(60);
      }

      // Handle other errors
      throw new OTPError(error.message || "Failed to resend verification code", error);
    }

    return {
      success: true,
      message: "Verification code resent",
    };
  }
}
