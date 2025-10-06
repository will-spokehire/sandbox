/**
 * User Repository
 * 
 * Data access layer for User entity.
 * Handles all Prisma queries related to users.
 */

import { DatabaseError, UserNotFoundError } from "../errors/app-errors";

// Use the DB type from context instead of PrismaClient directly
type DbClient = {
  user: any;
};

export class UserRepository {
  constructor(private db: DbClient) {}

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
   * Find user by ID
   */
  async findById(id: string) {
    try {
      const user = await this.db.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new UserNotFoundError(id);
      }

      return user;
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw error;
      }
      throw new DatabaseError("Failed to fetch user", error);
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
        },
      });
    } catch (error) {
      throw new DatabaseError("Failed to fetch session user", error);
    }
  }
}
