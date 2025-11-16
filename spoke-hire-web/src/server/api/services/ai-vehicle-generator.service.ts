/**
 * AI Vehicle Generator Service
 * 
 * Uses Google Gemini 2.5 Flash via Vercel AI SDK to generate:
 * - Creative, marketing-friendly vehicle names
 * - SEO-optimised descriptions for classic car hire
 */

import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { env } from "~/env";
import { generateVehicleName as generateStandardVehicleName } from "~/lib/vehicle-name-generator";

/**
 * Vehicle data for AI generation
 */
export interface VehicleGenerationData {
  make: string;
  model: string;
  year: string;
  engineCapacity: number;
  numberOfSeats: number;
  steering: string;
  gearbox: string;
  exteriorColour: string;
  interiorColour: string;
  isRoadLegal: boolean;
  location: string; // User's city
}

/**
 * Generated vehicle content
 */
export interface GeneratedVehicleContent {
  name: string;
  description: string;
}

/**
 * AI Vehicle Generator Service
 */
export class AIVehicleGeneratorService {
  private model = google("gemini-2.0-flash-exp");

  /**
   * Generate vehicle name using simple pattern: Year Make Model
   */
  async generateVehicleName(data: VehicleGenerationData): Promise<string> {
    return generateStandardVehicleName(data.year, data.make, data.model);
  }

  /**
   * Generate SEO-optimised vehicle description
   */
  async generateVehicleDescription(data: VehicleGenerationData): Promise<string> {
    const prompt = `Role: You are an expert copywriter specialising in creating compelling, user-friendly, and SEO-optimised descriptions for a classic car hire company. The vehicles are hired for various purposes including film and TV productions, weddings, special events, photography shoots, and personal driving experiences.

Objective: Your goal is to write a description that inspires potential hirers to choose this specific vehicle. The description should be evocative and focus on the car's character, visual appeal, and the experience of driving or being seen in it.

Instructions: Based on the vehicle details provided below, generate a complete web page description using the following simplified structure:

SEO-Optimised Title: Create a concise and keyword-rich title. Use the format: [Year] [Make] [Model] | [Location]

Evocative Opening Paragraph: Write a short, captivating introduction (2-3 sentences) that immediately establishes the car's character, era, and appeal.

Detailed Description: Expand on the opening. Describe the car's visual characteristics and what makes it special. Weave in key details like its colour, distinctive features, and the overall 'vibe' it projects. Consider various use cases such as film and TV work, weddings, special occasions, photo shoots, and personal driving experiences. Focus on the experience and emotion of being in or around this vehicle.

DO NOT include a separate "Location:" section or "Call to Action" section at the end. End the description naturally after the detailed description.

Vehicle Details to Use:

Make & Model: ${data.make} ${data.model}
Year: ${data.year}
Engine Capacity: ${data.engineCapacity}cc
Number of Seats: ${data.numberOfSeats}
Steering: ${data.steering}
Gearbox: ${data.gearbox}
Exterior Colour: ${data.exteriorColour}
Interior Colour: ${data.interiorColour}
Road Legal: ${data.isRoadLegal ? "Yes" : "No"}
Location: ${data.location}

Return ONLY the description content (starting with the SEO-Optimised Title), nothing else. Do not include any explanations or meta-commentary.`;

    try {
      const { text } = await generateText({
        model: this.model,
        prompt,
        temperature: 0.8,
      });

      return text.trim();
    } catch (error) {
      console.error("Failed to generate vehicle description:", error);
      // Fallback to basic description
      return `${data.year} ${data.make} ${data.model} available for hire in ${data.location}. This ${data.exteriorColour} vehicle features a ${data.gearbox} gearbox, ${data.steering} steering, and ${data.numberOfSeats} seats. ${data.isRoadLegal ? "Road legal and ready for any occasion." : "Perfect for studio, controlled environment shoots, or static displays."} Contact us for availability and pricing.`;
    }
  }

  /**
   * Generate both name and description in parallel
   */
  async generateVehicleContent(data: VehicleGenerationData): Promise<GeneratedVehicleContent> {
    try {
      const [name, description] = await Promise.all([
        this.generateVehicleName(data),
        this.generateVehicleDescription(data),
      ]);

      return { name, description };
    } catch (error) {
      console.error("Failed to generate vehicle content:", error);
      throw new Error("Failed to generate vehicle content. Please try again.");
    }
  }
}

