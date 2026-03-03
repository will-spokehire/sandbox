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
import type { SignInWithOtpParams, VerifyOtpParams, SignInWithGoogleParams } from "~/server/types";

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private supabase: SupabaseClient
  ) {}

  /**
   * Sign in with OTP
   * Supports open registration - creates user on first login for non-admins
   * For existing users, validates they are active before sending OTP
   */
  async signInWithOtp(params: SignInWithOtpParams) {
    const { email, redirectTo } = params;

    // Check if user exists in our database
    const user = await this.userRepository.findByEmail(email);

    // If user exists, validate their status
    if (user) {
      // Verify user is admin or regular user
      if (user.userType !== "ADMIN" && user.userType !== "REGISTERED") {
        // OWNER_ONLY users can also log in
        if (user.userType !== "OWNER_ONLY") {
          throw new AdminRequiredError();
        }
      }

      // Verify user is active
      if (user.status !== "ACTIVE") {
        throw new AccountInactiveError();
      }
    }

    // Send OTP via Supabase (create user if they don't exist)
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
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
   * Auto-creates user record for new registrations
   */
  async verifyOtp(params: VerifyOtpParams) {
    const { email, termsAccepted, termsAcceptanceId, privacyPolicyAccepted, privacyAcceptanceId } = params;

    // Check if user is authenticated in Supabase
    const {
      data: { user: supabaseUser },
    } = await this.supabase.auth.getUser();

    if (!supabaseUser || supabaseUser.email !== email) {
      throw new UnauthorizedError("Session not found. Please try again.");
    }

    // Get user from our database
    let user = await this.userRepository.getSessionUser(email);

    if (!user) {
      // New user - create account with REGISTERED type
      // Include T&Cs acceptance data if provided
      const userData: Parameters<typeof this.userRepository.create>[0] = {
        email,
        supabaseId: supabaseUser.id,
        userType: "REGISTERED",
        status: "ACTIVE",
      };

      // Add T&Cs acceptance data if both terms and privacy policy were accepted
      if (termsAccepted && termsAcceptanceId && privacyPolicyAccepted && privacyAcceptanceId) {
        userData.termsAcceptedAt = new Date();
        userData.termsAcceptanceId = termsAcceptanceId;
        userData.privacyPolicyAcceptedAt = new Date();
        userData.privacyAcceptanceId = privacyAcceptanceId;
      }

      user = await this.userRepository.create(userData);
    }

    // Verify user is admin or registered user
    if (user.userType !== "ADMIN" && user.userType !== "REGISTERED" && user.userType !== "OWNER_ONLY") {
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
        termsAcceptedAt: user.termsAcceptedAt,
        privacyPolicyAcceptedAt: user.privacyPolicyAcceptedAt,
      },
    };
  }

  /**
   * Sign in with Google OAuth
   * Validates session exists and user has proper permissions
   * Auto-creates user record for new registrations
   * Similar to verifyOtp but for OAuth flow
   */
  async signInWithGoogle(params: SignInWithGoogleParams) {
    const { email, name, termsAccepted, termsAcceptanceId, privacyPolicyAccepted, privacyAcceptanceId } = params;

    // Check if user is authenticated in Supabase
    const {
      data: { user: supabaseUser },
    } = await this.supabase.auth.getUser();

    if (!supabaseUser || supabaseUser.email !== email) {
      throw new UnauthorizedError("Session not found. Please try again.");
    }

    // Get user from our database
    let user = await this.userRepository.getSessionUser(email);

    if (!user) {
      // New user - create account with REGISTERED type
      // Extract name parts from full name
      const nameParts = name?.split(" ") ?? [];
      const firstName = nameParts[0] ?? null;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

      const userData: Parameters<typeof this.userRepository.create>[0] = {
        email,
        supabaseId: supabaseUser.id,
        firstName,
        lastName,
        userType: "REGISTERED",
        status: "ACTIVE",
      };

      // Add T&Cs acceptance data if both terms and privacy policy were accepted
      if (termsAccepted && termsAcceptanceId && privacyPolicyAccepted && privacyAcceptanceId) {
        userData.termsAcceptedAt = new Date();
        userData.termsAcceptanceId = termsAcceptanceId;
        userData.privacyPolicyAcceptedAt = new Date();
        userData.privacyAcceptanceId = privacyAcceptanceId;
      }

      user = await this.userRepository.create(userData);
    } else {
      // Existing user - update profile if needed
      const nameParts = name?.split(" ") ?? [];
      const firstName = nameParts[0] ?? null;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

      // Update supabaseId if not set
      if (!user.supabaseId || user.supabaseId !== supabaseUser.id) {
        await this.userRepository.updateSupabaseId(email, supabaseUser.id);
      }

      // Update name fields only if they're currently empty
      if ((!user.firstName || !user.lastName) && name) {
        await this.userRepository.update(user.id, {
          firstName: user.firstName ?? firstName,
          lastName: user.lastName ?? lastName,
        });
        
        // Refresh user data
        user = await this.userRepository.getSessionUser(email);
        if (!user) {
          throw new UserNotFoundError(email);
        }
      }

      // Update last login time
      await this.userRepository.updateLastLogin(email);
    }

    // Verify user is admin or registered user
    if (user.userType !== "ADMIN" && user.userType !== "REGISTERED" && user.userType !== "OWNER_ONLY") {
      await this.supabase.auth.signOut();
      throw new AdminRequiredError();
    }

    // Verify user is active
    if (user.status !== "ACTIVE") {
      await this.supabase.auth.signOut();
      throw new AccountInactiveError();
    }

    return {
      success: true,
      message: "Successfully authenticated with Google",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        termsAcceptedAt: user.termsAcceptedAt,
        privacyPolicyAcceptedAt: user.privacyPolicyAcceptedAt,
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
    // Check if user exists (allow all user types for resend)
    const user = await this.userRepository.findByEmail(email);

    // If user exists, verify they are active
    if (user && user.status !== "ACTIVE") {
      throw new AccountInactiveError();
    }

    // Resend OTP (allow creating user if they don't exist)
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
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

  /**
   * Accept Terms & Conditions and Privacy Policy
   * Updates user record with acceptance timestamps and unique IDs
   */
  async acceptTerms(
    userId: string,
    params: { termsAccepted: boolean; privacyPolicyAccepted: boolean }
  ) {
    const { termsAccepted, privacyPolicyAccepted } = params;

    // Validate both are accepted
    if (!termsAccepted || !privacyPolicyAccepted) {
      throw new Error("Both Terms & Conditions and Privacy Policy must be accepted");
    }

    // Generate unique acceptance IDs
    const termsAcceptanceId = crypto.randomUUID();
    const privacyAcceptanceId = crypto.randomUUID();

    // Update user record
    await this.userRepository.updateTermsAcceptance(userId, {
      termsAcceptedAt: new Date(),
      termsAcceptanceId,
      privacyPolicyAcceptedAt: new Date(),
      privacyAcceptanceId,
    });

    return {
      success: true,
      message: "Terms and Privacy Policy accepted successfully",
    };
  }
}
