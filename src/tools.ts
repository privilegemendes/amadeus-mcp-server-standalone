import { z } from 'zod';
// Tool to search for flights
import { amadeus, cachedApiCall, server } from './index';

// Define interfaces for Amadeus API responses and parameters
interface FlightParams {
  [key: string]: string | number | boolean | undefined;
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  nonStop: boolean;
  currencyCode: string;
  max: number;
}

interface AirportParams {
  [key: string]: string | number | undefined;
  keyword: string;
  subType?: 'AIRPORT' | 'CITY';
  countryCode?: string;
  max: number;
}

interface PriceAnalysisParams {
  [key: string]: string | undefined;
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  currencyCode: string;
}

interface CheapestDateParams {
  [key: string]: string | number | boolean | undefined;
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  oneWay: boolean;
  duration?: number;
  nonStop: boolean;
  viewBy: string;
  currencyCode: string;
}

// Define interfaces for Amadeus API response objects
interface FlightSegment {
  departure: {
    iataCode: string;
    at: string;
  };
  arrival: {
    iataCode: string;
    at: string;
  };
  carrierCode: string;
  number: string;
}

interface FlightItinerary {
  duration: string;
  segments: FlightSegment[];
}

interface FlightOffer {
  price: {
    total: string;
    currency: string;
  };
  itineraries: FlightItinerary[];
  validatingAirlineCodes: string[];
  numberOfBookableSeats?: number;
}

// Define response interfaces for API calls
interface FlightOfferResponse {
  data: FlightOffer[];
}

interface AirportResponse {
  data: Array<{
    iataCode?: string;
    name?: string;
    cityCode?: string;
    cityName?: string;
    countryCode?: string;
    countryName?: string;
    [key: string]: string | number | boolean | undefined | null;
  }>;
}

interface PriceAnalysisResponse {
  data: Array<{
    type: string;
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    priceMetrics: Array<{
      amount: string;
      quartileRanking: string;
      [key: string]: string | number | boolean | undefined | null;
    }>;
    [key: string]:
      | string
      | number
      | boolean
      | undefined
      | null
      | Array<Record<string, unknown>>;
  }>;
}

server.tool(
  'search-flights',
  'Search for flight offers',
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
    adults: z.number().min(1).max(9).default(1).describe('Number of adults'),
    children: z.number().min(0).default(0).describe('Number of children'),
    infants: z.number().min(0).default(0).describe('Number of infants'),
    travelClass: z
      .enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'])
      .optional()
      .describe('Travel class'),
    nonStop: z
      .boolean()
      .default(false)
      .describe('Filter for non-stop flights only'),
    currencyCode: z
      .string()
      .length(3)
      .default('USD')
      .describe('Currency code for pricing'),
    maxResults: z
      .number()
      .min(1)
      .max(250)
      .default(20)
      .describe('Maximum number of results'),
  },
  async ({
    originLocationCode,
    destinationLocationCode,
    departureDate,
    returnDate,
    adults,
    children,
    infants,
    travelClass,
    nonStop,
    currencyCode,
    maxResults,
  }) => {
    try {
      const params: FlightParams = {
        originLocationCode,
        destinationLocationCode,
        departureDate,
        returnDate,
        adults,
        children,
        infants,
        travelClass,
        nonStop,
        currencyCode,
        max: maxResults,
      };

      // Remove undefined values
      for (const key of Object.keys(params)) {
        if (params[key] === undefined) {
          delete params[key];
        }
      }

      const response = (await amadeus.shopping.flightOffers.get(
        params,
      )) as FlightOfferResponse;

      const formattedResults = response.data.map((offer: FlightOffer) => {
        const {
          price,
          itineraries,
          validatingAirlineCodes,
          numberOfBookableSeats,
        } = offer;

        // Format itineraries with more details
        const formattedItineraries = itineraries.map(
          (itinerary: FlightItinerary, idx: number) => {
            // Calculate total duration in minutes
            const totalDurationMinutes = Number.parseInt(
              itinerary.duration.slice(2, -1),
            );
            // Format as hours and minutes
            const hours = Math.floor(totalDurationMinutes / 60);
            const minutes = totalDurationMinutes % 60;
            const formattedDuration = `${hours}h ${minutes}m`;

            // Count stops
            const numStops = itinerary.segments.length - 1;
            const stopsText =
              numStops === 0
                ? 'Non-stop'
                : `${numStops} stop${numStops > 1 ? 's' : ''}`;

            // Format segments with times
            const segments = itinerary.segments
              .map((segment: FlightSegment) => {
                const departureTime = new Date(
                  segment.departure.at,
                ).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });
                const arrivalTime = new Date(
                  segment.arrival.at,
                ).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });

                return `${segment.departure.iataCode} (${departureTime}) → ${segment.arrival.iataCode} (${arrivalTime}) - ${segment.carrierCode}${segment.number}`;
              })
              .join(' | ');

            return {
              type: idx === 0 ? 'Outbound' : 'Return',
              duration: formattedDuration,
              stops: stopsText,
              segments,
            };
          },
        );

        return {
          price: `${price.total} ${price.currency}`,
          bookableSeats: numberOfBookableSeats || 'Unknown',
          airlines: validatingAirlineCodes.join(', '),
          itineraries: formattedItineraries,
        };
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formattedResults, null, 2),
          },
        ],
      };
    } catch (error: unknown) {
      console.error('Error searching flights:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error searching flights: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Tool to search for airports
server.tool(
  'search-airports',
  'Search for airports by keyword',
  {
    keyword: z
      .string()
      .min(2)
      .describe('Keyword to search for (city, airport name, IATA code)'),
    subType: z
      .enum(['AIRPORT', 'CITY'])
      .optional()
      .describe('Subtype to filter results'),
    countryCode: z
      .string()
      .length(2)
      .optional()
      .describe('Two-letter country code to filter results'),
    maxResults: z
      .number()
      .min(1)
      .max(100)
      .default(10)
      .describe('Maximum number of results'),
  },
  async ({ keyword, subType, countryCode, maxResults }) => {
    try {
      const params: AirportParams = {
        keyword,
        subType,
        countryCode,
        max: maxResults,
      };

      // Remove undefined values
      for (const key of Object.keys(params)) {
        if (params[key] === undefined) {
          delete params[key];
        }
      }

      // Create a cache key based on the parameters
      const cacheKey = `airport_search_${keyword}_${subType || ''}_${
        countryCode || ''
      }_${maxResults}`;

      // Use the cached API call with a TTL of 24 hours (86400 seconds) since airport data rarely changes
      const response = await cachedApiCall<AirportResponse>(
        cacheKey,
        86400,
        () =>
          amadeus.referenceData.locations.get(
            params,
          ) as Promise<AirportResponse>,
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: unknown) {
      console.error('Error searching airports:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error searching airports: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          },
        ],
        isError: true,
      };
    }
  },
);

/*
 * Tool to get flight price analysis
 */
server.tool(
  'flight-price-analysis',
  'Get flight price analysis for a route',
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
    currencyCode: z
      .string()
      .length(3)
      .default('USD')
      .describe('Currency code for pricing'),
  },
  async ({
    originLocationCode,
    destinationLocationCode,
    departureDate,
    returnDate,
    currencyCode,
  }) => {
    try {
      const params: PriceAnalysisParams = {
        originLocationCode,
        destinationLocationCode,
        departureDate,
        returnDate,
        currencyCode,
      };

      // Remove undefined values
      for (const key of Object.keys(params)) {
        if (params[key] === undefined) {
          delete params[key];
        }
      }

      const response = (await amadeus.analytics.itineraryPriceMetrics.get(
        params,
      )) as PriceAnalysisResponse;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: unknown) {
      console.error('Error getting price analysis:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting price analysis: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          },
        ],
        isError: true,
      };
    }
  },
);

/**
 * Tool to get detailed flight offer information
 */
server.tool(
  'get-flight-details',
  'Get detailed information about a specific flight offer',
  {
    flightOfferId: z.string().describe('The ID of the flight offer'),
  },
  async ({ flightOfferId }) => {
    try {
      // Flight offers need to be first retrieved then accessed by ID
      // This is a simulated implementation as direct ID access isn't available in the basic API

      // In a real implementation, you would either:
      // 1. Cache flight offers and look them up by ID
      // 2. Pass the entire flight offer object as a JSON string and parse it here

      return {
        content: [
          {
            type: 'text',
            text: `To implement this properly for flight ID ${flightOfferId}, you would need to either:
1. Cache flight search results server-side and retrieve by ID
2. Pass the entire flight offer object as a JSON string parameter
3. Use Amadeus Flight Offers Price API for the most current and detailed information

Please modify this tool based on your specific implementation needs.`,
          },
        ],
      };
    } catch (error: unknown) {
      console.error('Error getting flight details:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting flight details: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          },
        ],
        isError: true,
      };
    }
  },
);

/**
 * Tool to find cheapest travel dates
 */
interface CheapestDateResult {
  data: Array<{
    type: string;
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string | null;
    price: {
      total: string;
      currency: string;
    };
  }>;
}

server.tool(
  'find-cheapest-dates',
  'Find the cheapest dates to fly for a given route',
  {
    originLocationCode: z
      .string()
      .length(3)
      .describe('Origin airport IATA code (e.g., JFK)'),
    destinationLocationCode: z
      .string()
      .length(3)
      .describe('Destination airport IATA code (e.g., LHR)'),
    departureDate: z
      .string()
      .describe('Earliest departure date in YYYY-MM-DD format'),
    returnDate: z
      .string()
      .optional()
      .describe('Latest return date in YYYY-MM-DD format (for round trips)'),
    duration: z
      .number()
      .optional()
      .describe('Desired length of stay in days (for round trips)'),
    currencyCode: z
      .string()
      .length(3)
      .default('USD')
      .describe('Currency code for pricing'),
  },
  async ({
    originLocationCode,
    destinationLocationCode,
    departureDate,
    returnDate,
    duration,
    currencyCode,
  }) => {
    try {
      // Check if we have required parameters
      if (!departureDate) {
        return {
          content: [
            {
              type: 'text',
              text: 'Departure date is required for date search',
            },
          ],
          isError: true,
        };
      }

      const params: CheapestDateParams = {
        originLocationCode,
        destinationLocationCode,
        departureDate,
        returnDate,
        oneWay: !returnDate && !duration,
        duration,
        nonStop: false,
        viewBy: 'DATE',
        currencyCode,
      };

      // Remove undefined values
      for (const key of Object.keys(params)) {
        if (params[key] === undefined) {
          delete params[key];
        }
      }

      // Note: This endpoint requires Flight Offers Search API
      // This is a placeholder for the actual implementation
      // Normally, you'd use amadeus.shopping.flightDates.get(params)

      // Simulate a response for demonstration
      const simulatedResponse: CheapestDateResult = {
        data: [
          {
            type: 'flight-date',
            origin: originLocationCode,
            destination: destinationLocationCode,
            departureDate: departureDate,
            returnDate: returnDate,
            price: { total: '450.00', currency: currencyCode },
          },
          {
            type: 'flight-date',
            origin: originLocationCode,
            destination: destinationLocationCode,
            departureDate: new Date(
              new Date(departureDate).getTime() + 86400000 * 2,
            )
              .toISOString()
              .split('T')[0],
            returnDate: returnDate
              ? new Date(new Date(returnDate).getTime() + 86400000 * 2)
                  .toISOString()
                  .split('T')[0]
              : null,
            price: { total: '425.00', currency: currencyCode },
          },
        ],
      };

      return {
        content: [
          {
            type: 'text',
            text: `Note: This is currently a simulated response. To implement fully, you'll need to use the Flight Offers Search API with appropriate date ranges.\n\n${JSON.stringify(
              simulatedResponse.data,
              null,
              2,
            )}`,
          },
        ],
      };
    } catch (error: unknown) {
      console.error('Error finding cheapest dates:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error finding cheapest dates: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          },
        ],
        isError: true,
      };
    }
  },
);

/**
 * Tool to search for flight inspiration destinations
 */
interface FlightInspirationParams {
  [key: string]: string | number | boolean | undefined;
  origin: string;
  departureDate?: string;
  oneWay?: boolean;
  duration?: string;
  nonStop?: boolean;
  maxPrice?: number;
  viewBy?: 'COUNTRY' | 'DATE' | 'DESTINATION' | 'DURATION' | 'WEEK';
}

interface FlightDestination {
  type: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  price: {
    total: string;
  };
  links: {
    flightDates: string;
    flightOffers: string;
  };
}

interface FlightInspirationResponse {
  data: FlightDestination[];
}

server.tool(
  'flight-inspiration',
  'Find the cheapest destinations where you can fly to',
  {
    origin: z
      .string()
      .length(3)
      .describe('Origin airport/city IATA code (e.g., MAD)'),
    departureDate: z
      .string()
      .optional()
      .describe('Departure date or range (YYYY-MM-DD or YYYY-MM-DD,YYYY-MM-DD)'),
    oneWay: z
      .boolean()
      .optional()
      .default(false)
      .describe('Whether to search for one-way flights only'),
    duration: z
      .string()
      .optional()
      .describe('Duration of stay in days (e.g., "7" or "2,8" for range)'),
    nonStop: z
      .boolean()
      .optional()
      .default(false)
      .describe('Whether to search for non-stop flights only'),
    maxPrice: z
      .number()
      .optional()
      .describe('Maximum price limit'),
    viewBy: z
      .enum(['COUNTRY', 'DATE', 'DESTINATION', 'DURATION', 'WEEK'])
      .optional()
      .describe('How to group the results'),
  },
  async ({
    origin,
    departureDate,
    oneWay,
    duration,
    nonStop,
    maxPrice,
    viewBy,
  }) => {
    try {
      const params: FlightInspirationParams = {
        origin,
        departureDate,
        oneWay,
        duration,
        nonStop,
        maxPrice,
        viewBy,
      };

      // Remove undefined values
      for (const key of Object.keys(params)) {
        if (params[key] === undefined) {
          delete params[key];
        }
      }

      const response = (await amadeus.shopping.flightDestinations.get(
        params,
      )) as FlightInspirationResponse;

      // Format the response for better readability
      const formattedResults = response.data.map((destination) => ({
        destination: destination.destination,
        departureDate: destination.departureDate,
        returnDate: destination.returnDate,
        price: destination.price.total,
        links: destination.links,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formattedResults, null, 2),
          },
        ],
      };
    } catch (error: unknown) {
      console.error('Error searching flight inspiration:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error searching flight inspiration: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          },
        ],
        isError: true,
      };
    }
  },
);

/**
 * Tool to search for airport routes
 */
interface AirportRoutesParams {
  [key: string]: string | number | undefined;
  departureAirportCode: string;
  max?: number;
}

interface AirportRoute {
  type: string;
  subtype: string;
  name: string;
  iataCode: string;
  distance: {
    value: number;
    unit: string;
  };
  analytics?: {
    flights?: {
      score?: number;
    };
    travelers?: {
      score?: number;
    };
  };
}

interface AirportRoutesResponse {
  data: AirportRoute[];
}

server.tool(
  'airport-routes',
  'Find direct routes from a specific airport',
  {
    departureAirportCode: z
      .string()
      .length(3)
      .describe('Departure airport IATA code (e.g., JFK)'),
    maxResults: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .default(10)
      .describe('Maximum number of results'),
  },
  async ({ departureAirportCode, maxResults }) => {
    try {
      const params: AirportRoutesParams = {
        departureAirportCode,
        max: maxResults,
      };

      // Remove undefined values
      for (const key of Object.keys(params)) {
        if (params[key] === undefined) {
          delete params[key];
        }
      }

      const response = (await amadeus.airport.directDestinations.get(
        params,
      )) as AirportRoutesResponse;

      // Format the response for better readability
      const formattedResults = response.data.map((route) => ({
        destination: route.iataCode,
        name: route.name,
        type: route.subtype,
        distance: `${route.distance.value} ${route.distance.unit}`,
        flightScore: route.analytics?.flights?.score || 'N/A',
        travelerScore: route.analytics?.travelers?.score || 'N/A',
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formattedResults, null, 2),
          },
        ],
      };
    } catch (error: unknown) {
      console.error('Error searching airport routes:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error searching airport routes: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          },
        ],
        isError: true,
      };
    }
  },
);

/**
 * Tool to find nearest relevant airports
 */
interface NearestAirportParams {
  [key: string]: string | number | undefined;
  latitude: number;
  longitude: number;
  radius?: number;
  max?: number;
}

interface NearestAirport {
  type: string;
  subtype: string;
  name: string;
  detailedName: string;
  iataCode: string;
  distance: {
    value: number;
    unit: string;
  };
  analytics?: {
    flights?: {
      score?: number;
    };
    travelers?: {
      score?: number;
    };
  };
}

interface NearestAirportResponse {
  data: NearestAirport[];
}

server.tool(
  'nearest-airports',
  'Find nearest relevant airports to a specific location',
  {
    latitude: z
      .number()
      .min(-90)
      .max(90)
      .describe('Latitude of the location'),
    longitude: z
      .number()
      .min(-180)
      .max(180)
      .describe('Longitude of the location'),
    radius: z
      .number()
      .optional()
      .default(500)
      .describe('Search radius in kilometers'),
    maxResults: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .default(10)
      .describe('Maximum number of results'),
  },
  async ({ latitude, longitude, radius, maxResults }) => {
    try {
      const params: NearestAirportParams = {
        latitude,
        longitude,
        radius,
        max: maxResults,
      };

      // Remove undefined values
      for (const key of Object.keys(params)) {
        if (params[key] === undefined) {
          delete params[key];
        }
      }

      const response = (await amadeus.referenceData.locations.airports.get(
        params,
      )) as NearestAirportResponse;

      // Format the response for better readability
      const formattedResults = response.data.map((airport) => ({
        code: airport.iataCode,
        name: airport.name,
        detailedName: airport.detailedName,
        type: airport.subtype,
        distance: `${airport.distance.value} ${airport.distance.unit}`,
        flightScore: airport.analytics?.flights?.score || 'N/A',
        travelerScore: airport.analytics?.travelers?.score || 'N/A',
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formattedResults, null, 2),
          },
        ],
      };
    } catch (error: unknown) {
      console.error('Error finding nearest airports:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error finding nearest airports: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          },
        ],
        isError: true,
      };
    }
  },
);
