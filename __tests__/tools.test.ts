import { amadeus } from '../src/index';
import { server } from '../src/index';

// Mock the Amadeus API methods
jest.mock('amadeus', () => {
  return jest.fn().mockImplementation(() => {
    return {
      shopping: {
        flightOffers: {
          get: jest.fn().mockResolvedValue({
            data: [
              {
                type: 'flight-offer',
                id: '1',
                price: { total: '200.00', currency: 'USD' },
                itineraries: [
                  {
                    duration: 'PT5H30M',
                    segments: [
                      {
                        departure: {
                          iataCode: 'JFK',
                          at: '2023-01-01T08:00:00',
                        },
                        arrival: { iataCode: 'LAX', at: '2023-01-01T13:30:00' },
                        carrierCode: 'AA',
                        number: '123',
                      },
                    ],
                  },
                ],
                validatingAirlineCodes: ['AA'],
                numberOfBookableSeats: 10,
              },
            ],
          }),
        },
      },
      referenceData: {
        locations: {
          get: jest.fn().mockResolvedValue({
            data: [
              {
                type: 'location',
                subType: 'AIRPORT',
                name: 'John F Kennedy International Airport',
                iataCode: 'JFK',
                city: 'NEW YORK',
                countryCode: 'US',
              },
            ],
          }),
        },
      },
      analytics: {
        itineraryPriceMetrics: {
          get: jest.fn().mockResolvedValue({
            data: [
              {
                type: 'analytics',
                origin: 'JFK',
                destination: 'LAX',
                departureDate: '2023-01-01',
                priceMetrics: [
                  {
                    amount: '200.00',
                    quartileRanking: 'MINIMUM',
                  },
                ],
              },
            ],
          }),
        },
      },
    };
  });
});

// Mock console.error to avoid cluttering test output
console.error = jest.fn();

describe('Amadeus API Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to get a tool handler
  const getToolHandler = (toolName: string) => {
    const tool = server.tools.find(
      (t: { meta?: { name: string } }) => t.meta?.name === toolName,
    );
    return tool?.handler;
  };

  test('search-flights tool returns formatted flight data', async () => {
    const searchFlightsHandler = getToolHandler('search-flights');
    expect(searchFlightsHandler).toBeDefined();

    if (searchFlightsHandler) {
      const result = await searchFlightsHandler({
        originLocationCode: 'JFK',
        destinationLocationCode: 'LAX',
        departureDate: '2023-01-01',
        adults: 1,
        children: 0,
        infants: 0,
        nonStop: false,
        currencyCode: 'USD',
        maxResults: 10,
      });

      expect(result).toHaveProperty('content');
      expect(result.content[0]).toHaveProperty('text');

      // Parse the JSON text to check the formatted data
      const formattedData = JSON.parse(result.content[0].text);
      expect(formattedData).toHaveLength(1);
      expect(formattedData[0]).toHaveProperty('price', '200.00 USD');
      expect(formattedData[0]).toHaveProperty('bookableSeats', 10);
      expect(formattedData[0]).toHaveProperty('airlines', 'AA');
      expect(formattedData[0]).toHaveProperty('itineraries');
      expect(formattedData[0].itineraries[0]).toHaveProperty(
        'type',
        'Outbound',
      );
      expect(formattedData[0].itineraries[0]).toHaveProperty(
        'duration',
        '5h 30m',
      );
      expect(formattedData[0].itineraries[0]).toHaveProperty(
        'stops',
        'Non-stop',
      );
    }
  });

  test('search-airports tool returns airport data', async () => {
    const searchAirportsHandler = getToolHandler('search-airports');
    expect(searchAirportsHandler).toBeDefined();

    if (searchAirportsHandler) {
      const result = await searchAirportsHandler({
        keyword: 'JFK',
        maxResults: 10,
      });

      expect(result).toHaveProperty('content');
      expect(result.content[0]).toHaveProperty('text');

      // Parse the JSON text to check the data
      const data = JSON.parse(result.content[0].text);
      expect(data).toHaveLength(1);
      expect(data[0]).toHaveProperty('iataCode', 'JFK');
      expect(data[0]).toHaveProperty(
        'name',
        'John F Kennedy International Airport',
      );
    }
  });

  test('flight-price-analysis tool returns price metrics', async () => {
    const priceAnalysisHandler = getToolHandler('flight-price-analysis');
    expect(priceAnalysisHandler).toBeDefined();

    if (priceAnalysisHandler) {
      const result = await priceAnalysisHandler({
        originLocationCode: 'JFK',
        destinationLocationCode: 'LAX',
        departureDate: '2023-01-01',
        currencyCode: 'USD',
      });

      expect(result).toHaveProperty('content');
      expect(result.content[0]).toHaveProperty('text');

      // Parse the JSON text to check the data
      const data = JSON.parse(result.content[0].text);
      expect(data).toHaveLength(1);
      expect(data[0]).toHaveProperty('origin', 'JFK');
      expect(data[0]).toHaveProperty('destination', 'LAX');
      expect(data[0]).toHaveProperty('priceMetrics');
      expect(data[0].priceMetrics[0]).toHaveProperty('amount', '200.00');
    }
  });
});
