import { type AnalyzedQuery, TravelQueryType } from './queryAnalyzer';
import { server } from './index';

// Interface for tool selection and parameter mapping
interface ToolMapping {
  primaryTool: string;
  secondaryTools?: string[];
  parameterMap: (query: AnalyzedQuery) => Promise<Record<string, any>>;
}

// Map query types to appropriate tools and parameter mappings
const toolMappings: Record<TravelQueryType, ToolMapping> = {
  [TravelQueryType.INSPIRATION]: {
    primaryTool: 'discover-destinations',
    secondaryTools: ['search-flights', 'search-airports'],
    async parameterMap(query) {
      return {
        originLocationCode: query.origin?.code || '',
        maxPrice: query.budget?.amount,
        departureDate: query.timeFrame.value,
        tripDuration: query.duration?.value.toString(),
      };
    },
  },
  
  [TravelQueryType.SPECIFIC_ROUTE]: {
    primaryTool: 'find-best-deals',
    secondaryTools: ['analyze-flight-prices', 'find-cheapest-travel-dates'],
    async parameterMap(query) {
      return {
        originLocationCode: query.origin?.code || '',
        destinationLocationCode: query.destinations[0]?.code || '',
        departureDate: Array.isArray(query.timeFrame.value) 
          ? query.timeFrame.value[0] 
          : query.timeFrame.value,
        returnDate: Array.isArray(query.timeFrame.value) 
          ? query.timeFrame.value[1] 
          : undefined,
        travelClass: query.preferences?.class?.toUpperCase(),
      };
    },
  },
  
  [TravelQueryType.MULTI_CITY]: {
    primaryTool: 'plan-multi-city-trip',
    secondaryTools: ['search-flights', 'airport-routes'],
    async parameterMap(query) {
      const cities = query.destinations.map(dest => dest.code).join(',');
      return {
        cities,
        startDate: Array.isArray(query.timeFrame.value) 
          ? query.timeFrame.value[0] 
          : query.timeFrame.value,
        endDate: Array.isArray(query.timeFrame.value) 
          ? query.timeFrame.value[1] 
          : '',
        homeAirport: query.origin?.code || '',
      };
    },
  },
  
  [TravelQueryType.FLEXIBLE_VALUE]: {
    primaryTool: 'find-cheapest-travel-dates',
    secondaryTools: ['analyze-flight-prices'],
    async parameterMap(query) {
      return {
        originLocationCode: query.origin?.code || '',
        destinationLocationCode: query.destinations[0]?.code || '',
        earliestDepartureDate: Array.isArray(query.timeFrame.value) 
          ? query.timeFrame.value[0] 
          : query.timeFrame.value,
        latestDepartureDate: Array.isArray(query.timeFrame.value) 
          ? query.timeFrame.value[1] 
          : '',
        tripDuration: query.duration?.value.toString(),
      };
    },
  },
};

// Process the analyzed query and call appropriate tools
export async function processQuery(
  analyzedQuery: AnalyzedQuery
): Promise<{
  mainResult: any;
  supplementaryResults?: Record<string, any>;
  confidence: number;
  suggestedFollowUp?: string[];
}> {
  const mapping = toolMappings[analyzedQuery.type];
  
  if (!mapping) {
    throw new Error(`No tool mapping found for query type: ${analyzedQuery.type}`);
  }
  
  try {
    // Map the analyzed query to tool parameters
    const params = await mapping.parameterMap(analyzedQuery);
    
    // Call the primary tool
    const mainResult = await server.prompt(mapping.primaryTool, () => params);
    
    // Call secondary tools if needed and if confidence is high enough
    const supplementaryResults: Record<string, any> = {};
    if (mapping.secondaryTools && analyzedQuery.confidence > 0.7) {
      for (const tool of mapping.secondaryTools) {
        try {
          supplementaryResults[tool] = await server.prompt(tool, () => params);
        } catch (error) {
          console.error(`Error running secondary tool ${tool}:`, error);
        }
      }
    }
    
    // Generate follow-up suggestions based on ambiguities or missing information
    const suggestedFollowUp = generateFollowUpQuestions(analyzedQuery);
    
    return {
      mainResult,
      supplementaryResults: Object.keys(supplementaryResults).length > 0 
        ? supplementaryResults 
        : undefined,
      confidence: analyzedQuery.confidence,
      suggestedFollowUp,
    };
    
  } catch (error) {
    console.error('Error processing query:', error);
    throw error;
  }
}

// Generate follow-up questions based on analysis
function generateFollowUpQuestions(query: AnalyzedQuery): string[] {
  const questions: string[] = [];
  
  // Check for missing or ambiguous information
  if (!query.origin?.code) {
    questions.push('Which city would you like to depart from?');
  }
  
  if (query.timeFrame.isFlexible) {
    questions.push('Do you have specific dates in mind for your travel?');
  }
  
  if (!query.budget && query.type !== TravelQueryType.SPECIFIC_ROUTE) {
    questions.push('Do you have a budget in mind for this trip?');
  }
  
  if (!query.duration && query.type !== TravelQueryType.SPECIFIC_ROUTE) {
    questions.push('How long would you like to travel for?');
  }
  
  if (query.ambiguities) {
    questions.push(...query.ambiguities);
  }
  
  return questions;
}

// Example usage:
// const query = "I want to go somewhere warm in December for about a week";
// const analyzed = await analyzeQuery(query);
// const result = await processQuery(analyzed); 