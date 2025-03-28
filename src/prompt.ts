import { z } from 'zod';
// Prompt for analyzing flight prices
import { server } from './index.js';

server.prompt(
  'analyze-flight-prices',
  'Analyze flight prices for a route',
  {
    originLocationCode: z
      .string()
      .length(3)
      .describe('Origin airport IATA code (e.g., JFK)'),
    destinationLocationCode: z
      .string()
      .length(3)
      .describe('Destination airport IATA code (e.g., LHR)'),
    departureDate: z.string().describe('Departure date in YYYY-MM-DD format'),
    returnDate: z
      .string()
      .optional()
      .describe('Return date in YYYY-MM-DD format (for round trips)'),
  },
  async ({
    originLocationCode,
    destinationLocationCode,
    departureDate,
    returnDate,
  }) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please analyze flight prices for a trip from ${originLocationCode} to ${destinationLocationCode} departing on ${departureDate}${
              returnDate ? ` and returning on ${returnDate}` : ''
            }. 

Please use the flight-price-analysis tool to get price metrics, and the search-flights tool to find actual flight options. Then provide:

1. An overview of the price range
2. Insights on whether current prices are high or low compared to average
3. Recommendations on when to book
4. A few specific flight options that offer good value
5. Any additional insights that would be helpful for a traveler

If you need to search for airport information, you can use the search-airports tool.`,
          },
        },
      ],
    };
  },
);

// Prompt for finding the best flight deals
server.prompt(
  'find-best-deals',
  'Find the best flight deals',
  {
    originLocationCode: z
      .string()
      .length(3)
      .describe('Origin airport IATA code (e.g., JFK)'),
    destinationLocationCode: z
      .string()
      .length(3)
      .describe('Destination airport IATA code (e.g., LHR)'),
    departureDate: z.string().describe('Departure date in YYYY-MM-DD format'),
    returnDate: z
      .string()
      .optional()
      .describe('Return date in YYYY-MM-DD format (for round trips)'),
    travelClass: z
      .enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'])
      .optional()
      .describe('Travel class'),
  },
  async ({
    originLocationCode,
    destinationLocationCode,
    departureDate,
    returnDate,
    travelClass,
  }) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please find the best flight deals for a trip from ${originLocationCode} to ${destinationLocationCode} departing on ${departureDate}${
              returnDate ? ` and returning on ${returnDate}` : ''
            }${travelClass ? ` in ${travelClass} class` : ''}.

Please use the search-flights tool to find options, and organize them by:

1. Best value options (considering price, duration, and convenience)
2. Cheapest options regardless of convenience
3. Most convenient options (fewest stops, best times)

For each option, provide a brief summary of why it might be a good choice for different types of travelers.`,
          },
        },
      ],
    };
  },
);

// Prompt for planning a multi-city trip
server.prompt(
  'plan-multi-city-trip',
  'Plan a multi-city trip',
  {
    cities: z
      .string()
      .describe('Comma-separated list of city or airport codes to visit'),
    startDate: z.string().describe('Start date of trip in YYYY-MM-DD format'),
    endDate: z.string().describe('End date of trip in YYYY-MM-DD format'),
    homeAirport: z.string().length(3).describe('Home airport IATA code'),
  },
  async ({ cities, startDate, endDate, homeAirport }) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please help me plan a multi-city trip visiting the following cities: ${cities}. I'll be starting from ${homeAirport} on ${startDate} and returning on ${endDate}.

Please use the search-airports tool to confirm airport codes for each city, and then use the search-flights tool to find optimal flight routes between each city.

For my trip plan, I would like:

1. The most logical order to visit these cities to minimize backtracking
2. Flight options between each city
3. Recommended number of days in each location based on the total trip duration
4. Any insights about potential challenges or considerations for this itinerary

Please outline a complete trip plan with flight details and suggested stays in each location.`,
          },
        },
      ],
    };
  },
);

// Prompt for finding cheapest dates to travel
server.prompt(
  'find-cheapest-travel-dates',
  'Find the cheapest dates to travel for a given route',
  {
    originLocationCode: z
      .string()
      .length(3)
      .describe('Origin airport IATA code (e.g., JFK)'),
    destinationLocationCode: z
      .string()
      .length(3)
      .describe('Destination airport IATA code (e.g., LHR)'),
    earliestDepartureDate: z
      .string()
      .describe('Earliest possible departure date in YYYY-MM-DD format'),
    latestDepartureDate: z
      .string()
      .describe('Latest possible departure date in YYYY-MM-DD format'),
    tripDuration: z
      .string()
      .optional()
      .describe('Desired trip duration in days (for round trips)'),
  },
  async ({
    originLocationCode,
    destinationLocationCode,
    earliestDepartureDate,
    latestDepartureDate,
    tripDuration,
  }) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `I'm looking for the cheapest dates to fly from ${originLocationCode} to ${destinationLocationCode} between ${earliestDepartureDate} and ${latestDepartureDate}${
              tripDuration
                ? ` for a trip duration of approximately ${tripDuration} days`
                : ''
            }.

Please use the find-cheapest-dates tool to identify the most economical travel dates, and then provide:

1. A list of the cheapest date combinations
2. An analysis of price trends during this period
3. Recommendations on the best days of the week to travel for this route
4. Any holidays or events that might be affecting pricing
5. Specific flight options for the cheapest dates found

Please organize this information clearly to help me make an informed decision about when to book my trip.`,
          },
        },
      ],
    };
  },
);

// Prompt for discovering flight destinations
server.prompt(
  'discover-destinations',
  'Find inspiring flight destinations within your budget',
  {
    originLocationCode: z
      .string()
      .length(3)
      .describe('Origin airport IATA code (e.g., MAD)'),
    maxPrice: z
      .string()
      .optional()
      .describe('Maximum budget for flights'),
    departureDate: z
      .string()
      .optional()
      .describe('Preferred departure date or date range (YYYY-MM-DD)'),
    tripDuration: z
      .string()
      .optional()
      .describe('Desired trip duration in days (e.g., "7" or "2,8" for range)'),
  },
  async ({ originLocationCode, maxPrice, departureDate, tripDuration }) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please help me discover interesting destinations I can fly to from ${originLocationCode}${
              maxPrice ? ` within a budget of ${maxPrice}` : ''
            }${departureDate ? ` around ${departureDate}` : ''}${
              tripDuration ? ` for about ${tripDuration} days` : ''
            }.

Please use the flight-inspiration tool to find destinations and then:

1. Group destinations by region or country
2. Highlight the best deals found
3. Provide insights about seasonal trends
4. Suggest specific destinations that offer good value
5. Include any interesting destinations that might be unexpected

For the most interesting options, please use the search-flights tool to find specific flight details.
If needed, use the search-airports tool to get more information about the destinations.

Please organize the results to help me discover new travel possibilities within my constraints.`,
          },
        },
      ],
    };
  },
);

// Prompt for exploring airport routes
server.prompt(
  'explore-airport-routes',
  'Discover direct routes and connections from an airport',
  {
    airportCode: z
      .string()
      .length(3)
      .describe('Airport IATA code (e.g., JFK)'),
    maxResults: z
      .string()
      .optional()
      .default("20")
      .describe('Maximum number of routes to show'),
  },
  async ({ airportCode, maxResults }) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please analyze the routes available from ${airportCode} airport.

Please use the airport-routes tool to find direct destinations, and then:

1. Group destinations by region/continent
2. Highlight major routes with high flight frequency
3. Identify popular leisure and business destinations
4. List any seasonal or unique routes
5. Provide insights about the airport's connectivity

For key routes, please use the search-flights tool to check typical prices and schedules.
Use the search-airports tool to get more details about the connected airports.

Please organize this information to help understand:
- The airport's route network
- Best connection possibilities
- Popular destinations served
- Unique route opportunities`,
          },
        },
      ],
    };
  },
);

// Prompt for finding nearby airports
server.prompt(
  'find-nearby-airports',
  'Find convenient airports near a specific location',
  {
    latitude: z.string().describe('Location latitude'),
    longitude: z.string().describe('Location longitude'),
    radius: z
      .string()
      .optional()
      .default("500")
      .describe('Search radius in kilometers'),
    maxResults: z
      .string()
      .optional()
      .default("10")
      .describe('Maximum number of airports to show'),
  },
  async ({ latitude, longitude, radius, maxResults }) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please help me find convenient airports near latitude ${latitude}, longitude ${longitude}${
              radius ? ` within ${radius} kilometers` : ''
            }.

Please use the nearest-airports tool to find airports, and then:

1. Rank airports by convenience (considering distance and flight options)
2. Provide key information about each airport (size, typical destinations)
3. Compare transportation options to/from each airport
4. Highlight any airports with unique advantages
5. Suggest which airports might be best for different types of trips

For the most relevant airports:
- Use the airport-routes tool to check available destinations
- Use the search-flights tool to compare typical prices
- Consider factors like flight frequency and seasonal variations

Please organize this information to help choose the most suitable airport based on:
- Distance and accessibility
- Flight options and frequencies
- Typical prices
- Overall convenience for different types of travel`,
          },
        },
      ],
    };
  },
);

// Prompt for comprehensive trip planning
server.prompt(
  'plan-complete-trip',
  'Get comprehensive trip planning assistance',
  {
    originLocationCode: z
      .string()
      .length(3)
      .describe('Origin airport IATA code'),
    budget: z.string().optional().describe('Total budget for flights'),
    departureDate: z
      .string()
      .optional()
      .describe('Preferred departure date or date range'),
    tripDuration: z
      .string()
      .optional()
      .describe('Desired trip duration in days'),
    preferences: z
      .string()
      .optional()
      .describe('Travel preferences (e.g., "beach, culture, food")'),
  },
  async ({
    originLocationCode,
    budget,
    departureDate,
    tripDuration,
    preferences,
  }) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please help me plan a trip from ${originLocationCode}${
              budget ? ` with a budget of ${budget}` : ''
            }${departureDate ? ` around ${departureDate}` : ''}${
              tripDuration ? ` for ${tripDuration} days` : ''
            }${preferences ? ` focusing on ${preferences}` : ''}.

Please use multiple tools to create a comprehensive trip plan:

1. Use the flight-inspiration tool to discover potential destinations that match my criteria
2. Use the nearest-airports tool to find alternative departure/arrival airports
3. Use the airport-routes tool to understand connection possibilities
4. Use the find-cheapest-dates tool to optimize travel dates
5. Use the search-flights tool to find specific flight options

Please provide:
1. Top destination recommendations based on my criteria
2. Best flight options and routing suggestions
3. Price analysis and booking timing recommendations
4. Alternative airports to consider
5. A complete trip outline with:
   - Recommended destinations
   - Flight options and prices
   - Suggested itinerary
   - Travel tips and considerations

Please organize all this information into a clear, actionable trip plan.`,
          },
        },
      ],
    };
  },
);
