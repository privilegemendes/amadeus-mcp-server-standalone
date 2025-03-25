/**
 * Integration tests for Airport Search API
 */

const { amadeus, conditionalTest, makeApiCallWithRetry } = require('./setup');

// Only run these tests if Amadeus credentials are available
describe('Airport Search API - Integration', () => {
  // Set longer timeout for API calls (60 seconds to account for retries)
  jest.setTimeout(60000);

  conditionalTest(test, 'should find JFK airport', async () => {
    // Skip if credentials not available (handled by conditionalTest)
    expect(amadeus).not.toBeNull();

    // Parameters for the search
    const params = {
      keyword: 'JFK',
      subType: 'AIRPORT'
      // Removed max parameter as it's causing issues with the API
    };

    try {
      // Use the makeApiCallWithRetry helper to handle rate limiting
      const response = await makeApiCallWithRetry(() => 
        amadeus.referenceData.locations.get(params)
      );
      
      // Basic validation
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      
      // If we searched for JFK, we should find it
      const jfkAirport = response.data.find(item => item.iataCode === 'JFK');
      expect(jfkAirport).toBeDefined();
      // Match the actual format returned by the API (uppercase)
      expect(jfkAirport.name).toContain('KENNEDY');
      expect(jfkAirport.subType).toBe('AIRPORT');
      
      console.log('Found JFK airport:', jfkAirport.name);
    } catch (error) {
      // Important to see the actual error if the API call fails
      console.error('API Error:', error);
      
      // Rethrow to fail the test
      throw error;
    }
  });

  conditionalTest(test, 'should find airports in New York', async () => {
    expect(amadeus).not.toBeNull();

    const params = {
      keyword: 'New York',
      subType: 'AIRPORT'
      // Removed max parameter as it's causing issues with the API
    };

    try {
      // Use the makeApiCallWithRetry helper to handle rate limiting
      const response = await makeApiCallWithRetry(() => 
        amadeus.referenceData.locations.get(params)
      );
      
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      // Should find some New York airports
      const nyAirports = response.data.filter(item => 
        item.address && 
        (item.address.cityName === 'NEW YORK' || 
         item.name.includes('NEW YORK') || 
         item.name.includes('JFK') || 
         item.name.includes('LAGUARDIA'))
      );
      
      expect(nyAirports.length).toBeGreaterThan(0);
      console.log(`Found ${nyAirports.length} airports in New York:`, 
        nyAirports.map(a => a.name).join(', '));
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  });
}); 