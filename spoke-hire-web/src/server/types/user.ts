/**
 * User Types
 * 
 * Types related to user operations and authentication.
 */

import { type UserType, type UserStatus } from "@prisma/client";

/**
 * Sign in with OTP parameters
 */
export interface SignInWithOtpParams {
  email: string;
  redirectTo?: string;
  termsAccepted?: boolean;
  termsAcceptanceId?: string;
  privacyPolicyAccepted?: boolean;
  privacyAcceptanceId?: string;
}

/**
 * Verify OTP parameters
 */
export interface VerifyOtpParams {
  email: string;
  token: string;
  termsAccepted?: boolean;
  termsAcceptanceId?: string;
  privacyPolicyAccepted?: boolean;
  privacyAcceptanceId?: string;
}

/**
 * Sign in with Google OAuth parameters
 */
export interface SignInWithGoogleParams {
  email: string;
  name?: string;
  termsAccepted?: boolean;
  termsAcceptanceId?: string;
  privacyPolicyAccepted?: boolean;
  privacyAcceptanceId?: string;
}

/**
 * User basic info
 */
export interface UserBasicInfo {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

/**
 * User with full details
 */
export interface UserWithDetails extends UserBasicInfo {
  type: UserType;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  termsAcceptedAt: Date | null;
  termsAcceptanceId: string | null;
  privacyPolicyAcceptedAt: Date | null;
  privacyAcceptanceId: string | null;
}

/**
 * User profile
 */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  type: UserType;
  status: UserStatus;
}

/**
 * User creation data
 */
export interface CreateUserData {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  type?: UserType;
  status?: UserStatus;
}

/**
 * User update data
 */
export interface UpdateUserData {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  status?: UserStatus;
  type?: UserType;
}

/**
 * User authentication session
 */
export interface UserSession {
  user: UserProfile;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * User list filters
 */
export interface UserFilters {
  type?: UserType;
  status?: UserStatus;
  search?: string;
}

