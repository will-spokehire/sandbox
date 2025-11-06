/**
 * Vehicle Pricing Utilities
 * 
 * Calculates default hire pricing based on vehicle agreed value
 */

export interface PricingTier {
  min: number;
  max: number | null;
  hourlyRate: number;
  dailyRate: number;
  label: string;
}

export interface DefaultPricing {
  hourlyRate: number;
  dailyRate: number;
  tier: PricingTier;
}

/**
 * Pricing tiers based on vehicle agreed value
 * All values in GBP (£)
 */
export const PRICING_TIERS: PricingTier[] = [
  {
    min: 0,
    max: 10000,
    hourlyRate: 60,
    dailyRate: 300,
    label: "Under £10,000",
  },
  {
    min: 10000,
    max: 20000,
    hourlyRate: 80,
    dailyRate: 400,
    label: "£10,000 to £20,000",
  },
  {
    min: 20000,
    max: 50000,
    hourlyRate: 100,
    dailyRate: 500,
    label: "£20,000 to £50,000",
  },
  {
    min: 50000,
    max: null,
    hourlyRate: 120,
    dailyRate: 600,
    label: "Over £50,000",
  },
];

/**
 * Calculate default hourly and daily rates based on vehicle agreed value
 * 
 * @param agreedValue - Vehicle agreed value in GBP
 * @returns Default hourly rate, daily rate, and the matching tier
 */
export function calculateDefaultPricing(agreedValue: number): DefaultPricing {
  // Find the matching tier
  const tier = PRICING_TIERS.find((tier) => {
    if (tier.max === null) {
      return agreedValue >= tier.min;
    }
    return agreedValue >= tier.min && agreedValue < tier.max;
  });

  // Fallback to first tier if no match (shouldn't happen)
  const matchedTier = tier ?? PRICING_TIERS[0]!;

  return {
    hourlyRate: matchedTier.hourlyRate,
    dailyRate: matchedTier.dailyRate,
    tier: matchedTier,
  };
}

/**
 * Format pricing value with currency symbol
 * 
 * @param value - Numeric price value (can be number or Prisma Decimal)
 * @returns Formatted string with £ symbol
 */
export function formatPricingRate(value: number | { toNumber?: () => number } | null | undefined): string {
  if (value === null || value === undefined) {
    return "Not set";
  }
  
  // Handle Prisma Decimal objects
  const numValue = typeof value === 'number' ? value : value.toNumber?.() ?? 0;
  
  return `£${numValue.toFixed(0)}`;
}

/**
 * Get pricing tier label for a given agreed value
 * 
 * @param agreedValue - Vehicle agreed value in GBP
 * @returns Human-readable tier label
 */
export function getPricingTierLabel(agreedValue: number): string {
  const { tier } = calculateDefaultPricing(agreedValue);
  return tier.label;
}

