import { z } from 'zod';

// Types of travel queries we can handle
export enum TravelQueryType {
  INSPIRATION = 'inspiration',           // "Where can I go..."
  SPECIFIC_ROUTE = 'specific_route',     // "Flights from X to Y"
  MULTI_CITY = 'multi_city',            // "Visit A, B, and C"
  FLEXIBLE_VALUE = 'flexible_value',     // "Cheapest time to fly..."
}

// Time expressions in queries
export enum TimeFrame {
  SPECIFIC_DATE = 'specific_date',       // "on June 15th"
  DATE_RANGE = 'date_range',            // "between June and July"
  MONTH = 'month',                      // "in December"
  SEASON = 'season',                    // "during summer"
  HOLIDAY = 'holiday',                  // "for Christmas"
  RELATIVE = 'relative',                // "next month"
  FLEXIBLE = 'flexible',                // "whenever it's cheapest"
}

// Weather/Climate preferences
export enum ClimatePreference {
  WARM = 'warm',
  COLD = 'cold',
  TROPICAL = 'tropical',
  MILD = 'mild',
  SUNNY = 'sunny',
  ANY = 'any',
}

// Trip duration expressions
export interface Duration {
  type: 'days' | 'weeks' | 'months' | 'flexible';
  value: number | [number, number];  // Single value or range
  isApproximate: boolean;
}

// Location reference in query
export interface LocationReference {
  raw: string;                    // Original text
  type: 'city' | 'airport' | 'region' | 'country';
  code?: string;                  // Airport/city code if known
  isFlexible: boolean;           // Whether location is flexible ("somewhere warm")
  context?: string;              // Additional context ("beach cities", "major cities")
}

// Budget information
export interface BudgetConstraint {
  amount: number;
  currency: string;
  type: 'total' | 'per_person' | 'per_flight';
  isFlexible: boolean;
  context?: string;              // "cheap", "luxury", "best value"
}

// Travel preferences
export interface TravelPreferences {
  purpose?: 'leisure' | 'business' | 'family' | 'adventure';
  class?: 'economy' | 'premium_economy' | 'business' | 'first';
  stops?: 'direct' | 'any' | number;
  activities?: string[];         // "beach", "skiing", "sightseeing"
  accommodation?: string[];      // "resort", "hotel", "any"
}

// The main structure for analyzed queries
export interface AnalyzedQuery {
  type: TravelQueryType;
  timeFrame: {
    type: TimeFrame;
    value: string | [string, string];  // Single date or range
    isFlexible: boolean;
  };
  origin?: LocationReference;
  destinations: LocationReference[];
  duration?: Duration;
  budget?: BudgetConstraint;
  climate?: ClimatePreference;
  preferences?: TravelPreferences;
  rawQuery: string;              // Original query text
  confidence: number;            // Confidence in the analysis (0-1)
  ambiguities?: string[];       // List of unclear aspects
}

// Zod schema for validation
export const analyzedQuerySchema = z.object({
  type: z.nativeEnum(TravelQueryType),
  timeFrame: z.object({
    type: z.nativeEnum(TimeFrame),
    value: z.union([z.string(), z.tuple([z.string(), z.string()])]),
    isFlexible: z.boolean(),
  }),
  origin: z.object({
    raw: z.string(),
    type: z.enum(['city', 'airport', 'region', 'country']),
    code: z.string().optional(),
    isFlexible: z.boolean(),
    context: z.string().optional(),
  }).optional(),
  destinations: z.array(z.object({
    raw: z.string(),
    type: z.enum(['city', 'airport', 'region', 'country']),
    code: z.string().optional(),
    isFlexible: z.boolean(),
    context: z.string().optional(),
  })),
  duration: z.object({
    type: z.enum(['days', 'weeks', 'months', 'flexible']),
    value: z.union([z.number(), z.tuple([z.number(), z.number()])]),
    isApproximate: z.boolean(),
  }).optional(),
  budget: z.object({
    amount: z.number(),
    currency: z.string(),
    type: z.enum(['total', 'per_person', 'per_flight']),
    isFlexible: z.boolean(),
    context: z.string().optional(),
  }).optional(),
  climate: z.nativeEnum(ClimatePreference).optional(),
  preferences: z.object({
    purpose: z.enum(['leisure', 'business', 'family', 'adventure']).optional(),
    class: z.enum(['economy', 'premium_economy', 'business', 'first']).optional(),
    stops: z.union([z.enum(['direct', 'any']), z.number()]).optional(),
    activities: z.array(z.string()).optional(),
    accommodation: z.array(z.string()).optional(),
  }).optional(),
  rawQuery: z.string(),
  confidence: z.number().min(0).max(1),
  ambiguities: z.array(z.string()).optional(),
});

// Helper function to identify query type
export function identifyQueryType(query: string): TravelQueryType {
  const lowercaseQuery = query.toLowerCase();
  
  // Inspiration patterns
  if (lowercaseQuery.includes('where can i go') ||
      lowercaseQuery.includes('suggest') ||
      lowercaseQuery.includes('recommend')) {
    return TravelQueryType.INSPIRATION;
  }
  
  // Multi-city patterns
  if (lowercaseQuery.includes('visit') ||
      lowercaseQuery.includes('multiple cities') ||
      (lowercaseQuery.match(/,/g) || []).length >= 2) {
    return TravelQueryType.MULTI_CITY;
  }
  
  // Flexible value patterns
  if (lowercaseQuery.includes('cheapest time') ||
      lowercaseQuery.includes('best time') ||
      lowercaseQuery.includes('when should')) {
    return TravelQueryType.FLEXIBLE_VALUE;
  }
  
  // Default to specific route
  return TravelQueryType.SPECIFIC_ROUTE;
}

// Helper function to extract time frame
export function extractTimeFrame(query: string): {
  type: TimeFrame;
  value: string | [string, string];
  isFlexible: boolean;
} {
  // This is a placeholder - would need more sophisticated date parsing
  return {
    type: TimeFrame.FLEXIBLE,
    value: '',
    isFlexible: true,
  };
}

// Helper function to extract locations
export function extractLocations(query: string): {
  origin?: LocationReference;
  destinations: LocationReference[];
} {
  // This is a placeholder - would need location database and parsing
  return {
    destinations: [],
  };
}

// Main analysis function
export async function analyzeQuery(query: string): Promise<AnalyzedQuery> {
  const type = identifyQueryType(query);
  const timeFrame = extractTimeFrame(query);
  const locations = extractLocations(query);
  
  const analysis: AnalyzedQuery = {
    type,
    timeFrame,
    ...locations,
    rawQuery: query,
    confidence: 0.8, // This should be calculated based on certainty of parsing
  };
  
  // Validate the analysis
  analyzedQuerySchema.parse(analysis);
  
  return analysis;
} 