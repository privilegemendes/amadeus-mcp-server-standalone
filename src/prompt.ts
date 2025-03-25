import { z } from 'zod';
// Prompt for analyzing flight prices
import { server } from './index';

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
