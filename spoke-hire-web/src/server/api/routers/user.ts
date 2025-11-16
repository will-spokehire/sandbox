/**
 * User Router
 * 
 * Handles user-related operations for admin functionality
 */

import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { isValidPhoneNumber } from "~/lib/whatsapp";

/**
 * User Router
 */
export const userRouter = createTRPCRouter({
  /**
   * Get user by ID (for displaying selected users)
   */
  getById: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          company: true,
          phone: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    }),

  /**
   * Search users by name, email, or company
   */
  searchUsers: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(50).optional().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, limit } = input;

      // Build search conditions
      const whereConditions: any[] = [];

      if (search && search.trim().length > 0) {
        const searchTerm = search.trim();
        whereConditions.push({
          OR: [
            { firstName: { contains: searchTerm, mode: "insensitive" } },
            { lastName: { contains: searchTerm, mode: "insensitive" } },
            { email: { contains: searchTerm, mode: "insensitive" } },
            { company: { contains: searchTerm, mode: "insensitive" } },
          ],
        });
      }

      const users = await ctx.db.user.findMany({
        where: whereConditions.length > 0 ? { AND: whereConditions } : undefined,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          company: true,
          phone: true,
        },
        orderBy: [
          { firstName: "asc" },
          { lastName: "asc" },
        ],
        take: limit,
      });

      return users;
    }),

  /**
   * Create a new contact/user
   */
  createContact: adminProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        company: z.string().optional(),
        phone: z.string()
          .optional()
          .refine(
            (val) => !val || isValidPhoneNumber(val),
            "Please enter a valid phone number"
          ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user with this email already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this email already exists",
        });
      }

      // Create the new user/contact
      const newUser = await ctx.db.user.create({
        data: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          company: input.company,
          phone: input.phone,
          userType: "OWNER_ONLY", // Default user type for contacts
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          company: true,
          phone: true,
        },
      });

      return newUser;
    }),
});

