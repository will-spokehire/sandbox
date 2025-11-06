/**
 * Enquiry Form Schema
 * 
 * Zod validation schema for user enquiry form
 */

import { z } from "zod";

/**
 * Enquiry form validation schema
 */
export const enquiryFormSchema = z.object({
  // Personal information
  firstName: z.string().min(1, "First name is required").max(100, "First name must be less than 100 characters"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required").max(50, "Phone number must be less than 50 characters"),
  company: z.string().max(200, "Company name must be less than 200 characters").optional(),
  
  // Enquiry details
  dealType: z.enum(["PERSONAL_HIRE", "PRODUCTION"], {
    required_error: "Please select an enquiry type",
  }),
  date: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  brief: z.string().optional(),
  
  // Optional vehicle association (populated from URL params)
  vehicleId: z.string().optional(),
});

export type EnquiryFormData = z.infer<typeof enquiryFormSchema>;

