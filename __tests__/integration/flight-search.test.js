/**
 * Integration tests for Flight Search API
 */

const { amadeus, conditionalTest, makeApiCallWithRetry } = require('./setup');

describe('Flight Search API - Integration', () => {
  // Set longer timeout for API calls (60 seconds to account for retries)
  jest.setTimeout(60000);

  conditionalTest(test, 'should find flights from JFK to LAX', async () => {
    expect(amadeus).not.toBeNull();

    // Set dates for 30 days from now
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 30);
    const departureDateStr = departureDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Parameters for the flight search
    const params = {
      originLocationCode: 'JFK',
      destinationLocationCode: 'LAX',
      departureDate: departureDateStr,
      adults: 1,
      max: 5, // Limit to 5 results for faster testing
    };

    try {
      console.log(`Searching for flights from JFK to LAX on ${departureDateStr}`);
      // Use the makeApiCallWithRetry helper to handle rate limiting
      const response = await makeApiCallWithRetry(() => 
        amadeus.shopping.flightOffersSearch.get(params)
      );
      
      // Basic validation
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      
      // We should find at least one flight
      expect(response.data.length).toBeGreaterThan(0);
      
      // Check the structure of the flight offer
      const firstOffer = response.data[0];
      expect(firstOffer.type).toBe('flight-offer');
      expect(firstOffer.price).toBeDefined();
      expect(firstOffer.price.currency).toBeDefined();
      expect(firstOffer.price.total).toBeDefined();
      expect(firstOffer.itineraries).toBeDefined();
      expect(Array.isArray(firstOffer.itineraries)).toBe(true);
      
      // Check the first itinerary structure
      const firstItinerary = firstOffer.itineraries[0];
      expect(firstItinerary.segments).toBeDefined();
      expect(Array.isArray(firstItinerary.segments)).toBe(true);
      
      // Check the first segment
      const firstSegment = firstItinerary.segments[0];
      expect(firstSegment.departure).toBeDefined();
      expect(firstSegment.departure.iataCode).toBe('JFK');
      expect(firstSegment.arrival).toBeDefined();
      expect(firstSegment.arrival.iataCode).toBe('LAX');
      
      console.log(`Found ${response.data.length} flights from JFK to LAX`);
      console.log(`First flight: ${firstOffer.price.total} ${firstOffer.price.currency}`);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  });

  conditionalTest(test, 'should find round-trip flights', async () => {
    expect(amadeus).not.toBeNull();

    // Set dates for 30 and 37 days from now (one week trip)
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 30);
    const departureDateStr = departureDate.toISOString().split('T')[0];
    
    const returnDate = new Date(departureDate);
    returnDate.setDate(returnDate.getDate() + 7);
    const returnDateStr = returnDate.toISOString().split('T')[0];

    // Parameters for the flight search
    const params = {
      originLocationCode: 'BOS',
      destinationLocationCode: 'LHR',
      departureDate: departureDateStr,
      returnDate: returnDateStr,
      adults: 1,
      max: 5, // Limit to 5 results for faster testing
    };

    try {
      console.log(`Searching for round-trip flights from BOS to LHR on ${departureDateStr} returning ${returnDateStr}`);
      // Use the makeApiCallWithRetry helper to handle rate limiting
      const response = await makeApiCallWithRetry(() => 
        amadeus.shopping.flightOffersSearch.get(params)
      );
      
      // Basic validation
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      
      // We should find at least one flight
      expect(response.data.length).toBeGreaterThan(0);
      
      // For round-trip, we should have 2 itineraries
      const firstOffer = response.data[0];
      expect(firstOffer.itineraries.length).toBe(2);
      
      // Outbound should be BOS to LHR
      const outbound = firstOffer.itineraries[0];
      const outSegment = outbound.segments[0];
      expect(outSegment.departure.iataCode).toBe('BOS');
      
      // Return should be LHR to BOS
      const returnFlight = firstOffer.itineraries[1];
      const returnSegment = returnFlight.segments[returnFlight.segments.length - 1];
      expect(returnSegment.arrival.iataCode).toBe('BOS');
      
      console.log(`Found ${response.data.length} round-trip flights from BOS to LHR`);
      console.log(`Price: ${firstOffer.price.total} ${firstOffer.price.currency}`);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  });
}); 