/**
 * Integration tests for Flight Price Analysis API
 */

const { amadeus, conditionalTest, makeApiCallWithRetry } = require('./setup');

describe('Flight Price Analysis API - Integration', () => {
  // Set longer timeout for API calls (60 seconds to account for retries)
  jest.setTimeout(60000);

  conditionalTest(test, 'should get price analysis for JFK to LAX route', async () => {
    expect(amadeus).not.toBeNull();

    // Set dates for 30 days from now
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 30);
    const departureDateStr = departureDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Parameters for the price analysis - using correct parameter names
    const params = {
      originIataCode: 'JFK',
      destinationIataCode: 'LAX',
      departureDate: departureDateStr,
      currencyCode: 'USD'
    };

    try {
      console.log(`Getting price analysis for JFK to LAX on ${departureDateStr}`);
      // Use the makeApiCallWithRetry helper to handle rate limiting
      const response = await makeApiCallWithRetry(() => 
        amadeus.analytics.itineraryPriceMetrics.get(params)
      );
      
      // Basic validation
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      
      // Should find price data
      expect(response.data.length).toBeGreaterThan(0);
      
      // Check the first result - the API response format may have changed
      const analysis = response.data[0];

      // The origin might be an object with iataCode instead of a string
      if (typeof analysis.origin === 'object' && analysis.origin.iataCode) {
        expect(analysis.origin.iataCode).toBe('JFK');
      } else {
        expect(analysis.origin).toBe('JFK');
      }

      // Similarly, check for destination 
      if (typeof analysis.destination === 'object' && analysis.destination.iataCode) {
        expect(analysis.destination.iataCode).toBe('LAX');
      } else {
        expect(analysis.destination).toBe('LAX');
      }

      // The departure date should still match
      expect(analysis.departureDate).toBe(departureDateStr);
      expect(analysis.priceMetrics).toBeDefined();
      expect(Array.isArray(analysis.priceMetrics)).toBe(true);
      expect(analysis.priceMetrics.length).toBeGreaterThan(0);
      
      // Check price metrics structure
      const firstMetric = analysis.priceMetrics[0];
      expect(firstMetric.amount).toBeDefined();
      expect(firstMetric.quartileRanking).toBeDefined();
      
      console.log(`Price metrics: ${analysis.priceMetrics.map(m => `${m.quartileRanking}: ${m.amount}`).join(', ')}`);
    } catch (error) {
      // The price analysis API might not have data for all routes/dates
      // If we get a 404, we'll just skip this test
      if (error.code === 404 || error.response?.statusCode === 404) {
        console.log('Price analysis data not available for this route/date, skipping test');
        return; // Skip but don't fail
      }
      
      console.error('API Error:', error);
      throw error;
    }
  });

  conditionalTest(test, 'should get price analysis for a popular route (NYC to LON)', async () => {
    expect(amadeus).not.toBeNull();

    // Set dates for 45 days from now (more likely to have data for popular routes)
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 45);
    const departureDateStr = departureDate.toISOString().split('T')[0];

    // Parameters for the price analysis - using correct parameter names
    const params = {
      originIataCode: 'NYC', // New York City (all airports)
      destinationIataCode: 'LON', // London (all airports)
      departureDate: departureDateStr,
      currencyCode: 'USD'
    };

    try {
      console.log(`Getting price analysis for NYC to LON on ${departureDateStr}`);
      // Use the makeApiCallWithRetry helper to handle rate limiting
      const response = await makeApiCallWithRetry(() => 
        amadeus.analytics.itineraryPriceMetrics.get(params)
      );
      
      // Basic validation
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      
      // For this test, let's skip the expectations if no data is returned
      // Popular routes should have data, but different test environments may return different results
      if (response.data.length === 0) {
        console.log('No price analysis data found for NYC to LON, skipping validation');
        return;
      }
      
      // Log the results
      for (const analysis of response.data) {
        // Get origin and destination values, handling both object and string formats
        const origin = typeof analysis.origin === 'object' ? analysis.origin.iataCode : analysis.origin;
        const destination = typeof analysis.destination === 'object' ? analysis.destination.iataCode : analysis.destination;
        
        console.log(`Analysis for ${origin} to ${destination} on ${analysis.departureDate}:`);
        for (const metric of analysis.priceMetrics) {
          console.log(`  ${metric.quartileRanking}: ${metric.amount}`);
        }
      }
    } catch (error) {
      // If we get a 404, we'll just skip this test
      if (error.code === 404 || error.response?.statusCode === 404) {
        console.log('Price analysis data not available for this route/date, skipping test');
        return; // Skip but don't fail
      }
      
      console.error('API Error:', error);
      throw error;
    }
  });
}); 