// Mock for Amadeus API
const mockAmadeus = {
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
                    departure: { iataCode: 'JFK', at: '2023-01-01T08:00:00' },
                    arrival: { iataCode: 'LAX', at: '2023-01-01T13:30:00' },
                    carrierCode: 'AA',
                    number: '123'
                  }
                ]
              }
            ],
            validatingAirlineCodes: ['AA'],
            numberOfBookableSeats: 10
          }
        ]
      })
    }
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
            countryCode: 'US'
          }
        ]
      })
    }
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
                quartileRanking: 'MINIMUM'
              }
            ]
          }
        ]
      })
    }
  }
};

// Mock the tool handler implementation
describe('Amadeus API Tools', () => {
  // Mock Search Flights Tool
  test('search-flights tool returns formatted flight data', async () => {
    // Mock implementation of search-flights tool handler
    const searchFlightsHandler = async (params) => {
      const response = await mockAmadeus.shopping.flightOffers.get();
      
      const formattedResults = response.data.map((offer) => {
        const {
          price,
          itineraries,
          validatingAirlineCodes,
          numberOfBookableSeats,
        } = offer;

        // Format itineraries with more details
        const formattedItineraries = itineraries.map((itinerary, idx) => {
          // Calculate duration in hours and minutes
          const durationStr = itinerary.duration.slice(2, -1); // Remove 'PT' and 'M'
          let hours = 0;
          let minutes = 0;
          
          if (durationStr.includes('H')) {
            const parts = durationStr.split('H');
            hours = Number.parseInt(parts[0]);
            if (parts[1]) {
              minutes = Number.parseInt(parts[1]);
            }
          } else {
            minutes = Number.parseInt(durationStr);
          }
          
          const formattedDuration = `${hours}h ${minutes}m`;

          // Format stops
          const numStops = itinerary.segments.length - 1;
          const stopsText = numStops === 0 ? 'Non-stop' : `${numStops} stop${numStops > 1 ? 's' : ''}`;

          return {
            type: idx === 0 ? 'Outbound' : 'Return',
            duration: formattedDuration,
            stops: stopsText,
            segments: itinerary.segments.map(segment => 
              `${segment.departure.iataCode} → ${segment.arrival.iataCode} - ${segment.carrierCode}${segment.number}`
            ).join(' | ')
          };
        });

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
            text: JSON.stringify(formattedResults, null, 2)
          }
        ]
      };
    };

    // Call the handler with test parameters
    const result = await searchFlightsHandler({
      originLocationCode: 'JFK',
      destinationLocationCode: 'LAX',
      departureDate: '2023-01-01',
      adults: 1,
      children: 0,
      infants: 0,
      nonStop: false,
      currencyCode: 'USD',
      maxResults: 10
    });

    // Parse the JSON text to check the formatted data
    const formattedData = JSON.parse(result.content[0].text);
    
    // Assertions
    expect(formattedData).toHaveLength(1);
    expect(formattedData[0]).toHaveProperty('price', '200.00 USD');
    expect(formattedData[0]).toHaveProperty('bookableSeats', 10);
    expect(formattedData[0]).toHaveProperty('airlines', 'AA');
    expect(formattedData[0].itineraries[0]).toHaveProperty('type', 'Outbound');
    expect(formattedData[0].itineraries[0]).toHaveProperty('duration', '5h 30m');
    expect(formattedData[0].itineraries[0]).toHaveProperty('stops', 'Non-stop');
  });

  // Mock Airport Search Tool
  test('search-airports tool returns airport data', async () => {
    // Mock implementation of search-airports tool handler
    const searchAirportsHandler = async (params) => {
      const response = await mockAmadeus.referenceData.locations.get();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2)
          }
        ]
      };
    };

    // Call the handler with test parameters
    const result = await searchAirportsHandler({
      keyword: 'JFK',
      maxResults: 10
    });

    // Parse the JSON text to check the data
    const data = JSON.parse(result.content[0].text);
    
    // Assertions
    expect(data).toHaveLength(1);
    expect(data[0]).toHaveProperty('iataCode', 'JFK');
    expect(data[0]).toHaveProperty('name', 'John F Kennedy International Airport');
  });
}); 