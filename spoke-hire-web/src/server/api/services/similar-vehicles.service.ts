/**
 * Similar Vehicles Service
 * 
 * Service for finding similar vehicles based on make or decade.
 * Implements recommendation algorithm with priority ordering:
 * 1. Same make + model + decade + color (highest priority)
 * 2. Same make + model + decade (different color)
 * 3. Same make + decade (different model)
 * 4. Same make (different decade/model)
 * 5. Same decade (different make)
 */

import type { DbClient } from "../repositories/base.repository";
import { VehicleRepository } from "../repositories/vehicle.repository";
import type { VehicleWithRelations } from "~/server/types";
import { VehicleNotFoundError } from "../errors/app-errors";

export class SimilarVehiclesService {
  constructor(private db: DbClient) {}

  /**
   * Calculate priority score for a vehicle match
   * Higher score = higher priority
   */
  private calculatePriority(
    vehicle: any,
    currentMakeId: string,
    currentModelId: string,
    currentYear: string,
    currentExteriorColour: string | null,
    decadeStart: number,
    decadeEnd: number
  ): number {
    const vehicleYearNum = parseInt(vehicle.year);
    const isSameDecade = !isNaN(vehicleYearNum) && vehicleYearNum >= decadeStart && vehicleYearNum <= decadeEnd;
    const isSameMake = vehicle.makeId === currentMakeId;
    const isSameModel = vehicle.modelId === currentModelId;
    const isSameColor = vehicle.exteriorColour && 
                       currentExteriorColour && 
                       vehicle.exteriorColour.toLowerCase() === currentExteriorColour.toLowerCase();

    // Priority 1: Same make + model + decade + color (score: 100)
    if (isSameMake && isSameModel && isSameDecade && isSameColor) {
      return 100;
    }
    
    // Priority 2: Same make + model + decade (different color) (score: 80)
    if (isSameMake && isSameModel && isSameDecade) {
      return 80;
    }
    
    // Priority 3: Same make + decade (different model) (score: 60)
    if (isSameMake && isSameDecade) {
      return 60;
    }
    
    // Priority 4: Same make (different decade/model) (score: 40)
    if (isSameMake) {
      return 40;
    }
    
    // Priority 5: Same decade (different make) (score: 20)
    if (isSameDecade) {
      return 20;
    }
    
    return 0;
  }

  /**
   * Get similar vehicles for a given vehicle ID
   * 
   * Algorithm:
   * - Find vehicles with same make OR same decade
   * - Exclude current vehicle AND vehicles with same year
   * - Only PUBLISHED vehicles
   * - Priority order: make+model+decade+color > make+model+decade > make+decade > make > decade
   * - Limit to 6 results
   * 
   * @param vehicleId - ID of the vehicle to find similar vehicles for
   * @returns Array of similar vehicles (max 6)
   */
  async getSimilarVehicles(vehicleId: string): Promise<VehicleWithRelations[]> {
    // First, get the current vehicle to extract make, model, year, and color
    const repository = new VehicleRepository(this.db);
    const currentVehicle = await repository.findById(vehicleId);

    if (!currentVehicle) {
      throw new VehicleNotFoundError(vehicleId);
    }

    // Extract vehicle attributes
    const currentMakeId = currentVehicle.makeId;
    const currentModelId = currentVehicle.modelId;
    const currentYear = currentVehicle.year;
    const currentExteriorColour = currentVehicle.exteriorColour;
    const currentYearNum = parseInt(currentYear);

    // Validate year is a valid number
    if (isNaN(currentYearNum)) {
      // If year is not a valid number, only match by make (exclude same year)
      const similarVehicles = await this.db.vehicle.findMany({
        where: {
          status: "PUBLISHED",
          id: {
            not: vehicleId,
          },
          makeId: currentMakeId,
          year: {
            not: currentYear, // Exclude same year
          },
        },
        include: {
          make: {
            select: {
              id: true,
              name: true,
              isPublished: true,
            },
          },
          model: {
            select: {
              id: true,
              name: true,
              isPublished: true,
            },
          },
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              postcode: true,
              city: true,
              county: true,
              latitude: true,
              longitude: true,
              country: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          media: {
            where: {
              isVisible: true,
              status: "READY",
              type: "IMAGE",
            },
            orderBy: [
              { isPrimary: "desc" },
              { order: "asc" },
            ],
            select: {
              id: true,
              publishedUrl: true,
              originalUrl: true,
              type: true,
            },
          },
          collections: {
            include: {
              collection: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
          _count: {
            select: {
              media: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 30, // Fetch more to sort by priority
      });

      // Sort by priority and take top 6
      const prioritized = similarVehicles
        .map((v) => ({
          vehicle: v,
          priority: this.calculatePriority(
            v,
            currentMakeId,
            currentModelId,
            currentYear,
            currentExteriorColour,
            0,
            0 // Not used when year is invalid
          ),
        }))
        .filter((item) => item.priority > 0) // Only include matches
        .sort((a, b) => {
          // Sort by priority (desc), then by createdAt (desc)
          if (b.priority !== a.priority) {
            return b.priority - a.priority;
          }
          return new Date(b.vehicle.createdAt).getTime() - new Date(a.vehicle.createdAt).getTime();
        })
        .slice(0, 6)
        .map((item) => item.vehicle);

      return prioritized as unknown as VehicleWithRelations[];
    }

    // Calculate decade range (floor to nearest 10)
    // e.g., 1975 → 1970-1979
    const decadeStart = Math.floor(currentYearNum / 10) * 10;
    const decadeEnd = decadeStart + 9;
    const decadeStartStr = String(decadeStart);
    const decadeEndStr = String(decadeEnd);

    // Build query: same make OR same decade, exclude same year
    const similarVehicles = await this.db.vehicle.findMany({
      where: {
        status: "PUBLISHED",
        id: {
          not: vehicleId, // Exclude current vehicle
        },
        year: {
          not: currentYear, // Exclude same year
        },
        OR: [
          {
            makeId: currentMakeId, // Same make
          },
          {
            year: {
              gte: decadeStartStr,
              lte: decadeEndStr,
            },
          },
        ],
      },
      include: {
        make: {
          select: {
            id: true,
            name: true,
            isPublished: true,
          },
        },
        model: {
          select: {
            id: true,
            name: true,
            isPublished: true,
          },
        },
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            postcode: true,
            city: true,
            county: true,
            latitude: true,
            longitude: true,
            country: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        media: {
          where: {
            isVisible: true,
            status: "READY",
            type: "IMAGE",
          },
          orderBy: [
            { isPrimary: "desc" },
            { order: "asc" },
          ],
          select: {
            id: true,
            publishedUrl: true,
            originalUrl: true,
            type: true,
          },
        },
        collections: {
          include: {
            collection: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        _count: {
          select: {
            media: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Newest first (will be re-sorted by priority)
      },
      take: 30, // Fetch more to sort by priority
    });

    // Sort by priority and take top 6
    const prioritized = similarVehicles
      .map((v) => ({
        vehicle: v,
        priority: this.calculatePriority(
          v,
          currentMakeId,
          currentModelId,
          currentYear,
          currentExteriorColour,
          decadeStart,
          decadeEnd
        ),
      }))
      .filter((item) => item.priority > 0) // Only include matches
      .sort((a, b) => {
        // Sort by priority (desc), then by createdAt (desc)
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return new Date(b.vehicle.createdAt).getTime() - new Date(a.vehicle.createdAt).getTime();
      })
      .slice(0, 6)
      .map((item) => item.vehicle);

    return prioritized as unknown as VehicleWithRelations[];
  }
}

