/**
 * User Repository
 * 
 * Data access layer for User entity.
 * Handles all Prisma queries related to users.
 */

import { DatabaseError } from "../errors/app-errors";
import { BaseRepository } from "./base.repository";

export class UserRepository extends BaseRepository {
  protected get model() {
    return this.db.user;
  }

  protected readonly entityName = "User" as const;

  /**
   * Create a new user
   */
  async create(data: {
    email: string;
    supabaseId?: string;
    userType: "ADMIN" | "REGISTERED" | "OWNER_ONLY";
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    firstName?: string;
    lastName?: string;
    termsAcceptedAt?: Date;
    termsAcceptanceId?: string;
    privacyPolicyAcceptedAt?: Date;
    privacyAcceptanceId?: string;
  }) {
    try {
      return await this.db.user.create({
        data,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          status: true,
          supabaseId: true,
          termsAcceptedAt: true,
          termsAcceptanceId: true,
          privacyPolicyAcceptedAt: true,
          privacyAcceptanceId: true,
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to create user", error);
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    try {
      return await this.db.user.findUnique({
        where: { email },
      });
    } catch (error) {
      throw new DatabaseError("Failed to fetch user by email", error);
    }
  }

  /**
   * Find user by Supabase ID
   */
  async findBySupabaseId(supabaseId: string) {
    try {
      return await this.db.user.findUnique({
        where: { supabaseId },
      });
    } catch (error) {
      throw new DatabaseError("Failed to fetch user by Supabase ID", error);
    }
  }

  /**
   * Update user's Supabase ID
   */
  async updateSupabaseId(email: string, supabaseId: string) {
    try {
      return await this.db.user.update({
        where: { email },
        data: { supabaseId },
      });
    } catch (error) {
      throw new DatabaseError("Failed to update Supabase ID", error);
    }
  }

  /**
   * Update user's last login time
   */
  async updateLastLogin(email: string) {
    try {
      return await this.db.user.update({
        where: { email },
        data: { lastLoginAt: new Date() },
      });
    } catch (error) {
      throw new DatabaseError("Failed to update last login", error);
    }
  }

  /**
   * Check if user is admin
   */
  async isAdmin(email: string): Promise<boolean> {
    try {
      const user = await this.db.user.findUnique({
        where: { email },
        select: { userType: true },
      });

      return user?.userType === "ADMIN";
    } catch (error) {
      throw new DatabaseError("Failed to check admin status", error);
    }
  }

  /**
   * Check if user is active
   */
  async isActive(email: string): Promise<boolean> {
    try {
      const user = await this.db.user.findUnique({
        where: { email },
        select: { status: true },
      });

      return user?.status === "ACTIVE";
    } catch (error) {
      throw new DatabaseError("Failed to check user status", error);
    }
  }

  /**
   * Get user with minimal info for session
   */
  async getSessionUser(email: string) {
    try {
      return await this.db.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          status: true,
          supabaseId: true,
          termsAcceptedAt: true,
          termsAcceptanceId: true,
          privacyPolicyAcceptedAt: true,
          privacyAcceptanceId: true,
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to fetch session user", error);
    }
  }

  /**
   * Update Terms & Conditions acceptance
   */
  async updateTermsAcceptance(
    userId: string,
    data: {
      termsAcceptedAt: Date;
      termsAcceptanceId: string;
      privacyPolicyAcceptedAt: Date;
      privacyAcceptanceId: string;
    }
  ) {
    try {
      return await this.db.user.update({
        where: { id: userId },
        data,
      });
    } catch (error) {
      throw new DatabaseError("Failed to update terms acceptance", error);
    }
  }

  /**
   * Update user profile fields if they're currently empty
   * This is useful when collecting data from enquiry forms
   * @returns Object with updated fields (empty if nothing was updated)
   */
  async updateEmptyProfileFields(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      company?: string;
    }
  ): Promise<{ updatedFields: string[] }> {
    try {
      // First, get the current user to check which fields are empty
      const currentUser = await this.db.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          company: true,
        },
      });

      if (!currentUser) {
        throw new DatabaseError("User not found");
      }

      // Build update object only for empty fields
      const updates: Record<string, string> = {};
      const updatedFields: string[] = [];

      if (!currentUser.firstName && data.firstName) {
        updates.firstName = data.firstName;
        updatedFields.push("firstName");
      }
      if (!currentUser.lastName && data.lastName) {
        updates.lastName = data.lastName;
        updatedFields.push("lastName");
      }
      if (!currentUser.phone && data.phone) {
        updates.phone = data.phone;
        updatedFields.push("phone");
      }
      if (!currentUser.company && data.company) {
        updates.company = data.company;
        updatedFields.push("company");
      }

      // Only update if there are fields to update
      if (Object.keys(updates).length > 0) {
        await this.db.user.update({
          where: { id: userId },
          data: updates,
        });
      }

      return { updatedFields };
    } catch (error) {
      throw new DatabaseError("Failed to update profile fields", error);
    }
  }
}
