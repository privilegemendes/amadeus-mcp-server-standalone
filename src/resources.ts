// Schema resources
import { server } from './index';

server.resource(
  'flight-offer-schema',
  'schema://flight-offers',
  async (uri) => {
    const schema = {
      type: 'Flight Offer',
      properties: {
        type: 'The type of the offer (e.g., flight-offer)',
        id: 'Unique identifier for the offer',
        source: 'The source of the offer',
        instantTicketingRequired: 'Whether instant ticketing is required',
        nonHomogeneous: 'Whether the offer is non-homogeneous',
        oneWay: 'Whether the offer is one-way',
        lastTicketingDate: 'The last date for ticketing',
        numberOfBookableSeats: 'Number of bookable seats',
        itineraries: 'Array of flight segments',
        price: 'Price information including total and currency',
        pricingOptions: 'Options related to pricing',
        validatingAirlineCodes: 'Codes of validating airlines',
        travelerPricings: 'Pricing information per traveler',
      },
    };

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(schema, null, 2),
          mimeType: 'application/json',
        },
      ],
    };
  },
);

// Airport schema
server.resource('airport-schema', 'schema://airports', async (uri) => {
  const schema = {
    type: 'Airport',
    properties: {
      iataCode: 'IATA three-letter airport code',
      name: 'Full name of the airport',
      cityCode: 'City code',
      cityName: 'City name',
      countryCode: 'Two-letter country code',
      countryName: 'Country name',
      latitude: 'Geographic latitude',
      longitude: 'Geographic longitude',
      timezone: 'Timezone of the airport',
    },
  };

  return {
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify(schema, null, 2),
        mimeType: 'application/json',
      },
    ],
  };
});

// Flight Inspiration schema
server.resource(
  'flight-inspiration-schema',
  'schema://flight-inspiration',
  async (uri) => {
    const schema = {
      type: 'Flight Inspiration',
      properties: {
        type: 'Type of the result',
        origin: 'IATA code of the origin city/airport',
        destination: 'IATA code of the destination city/airport',
        departureDate: 'Date of departure',
        returnDate: 'Date of return (for round trips)',
        price: {
          description: 'Price information',
          properties: {
            total: 'Total price of the flight',
          },
        },
        links: {
          description: 'Related links',
          properties: {
            flightDates: 'Link to flight dates',
            flightOffers: 'Link to flight offers',
          },
        },
      },
    };

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(schema, null, 2),
          mimeType: 'application/json',
        },
      ],
    };
  },
);

// Airport Routes schema
server.resource(
  'airport-routes-schema',
  'schema://airport-routes',
  async (uri) => {
    const schema = {
      type: 'Airport Route',
      properties: {
        type: 'Type of the route',
        subtype: 'Subtype of the route',
        name: 'Name of the destination',
        iataCode: 'IATA code of the destination',
        distance: {
          description: 'Distance information',
          properties: {
            value: 'Numeric value of the distance',
            unit: 'Unit of measurement',
          },
        },
        analytics: {
          description: 'Analytics information',
          properties: {
            flights: {
              description: 'Flight statistics',
              properties: {
                score: 'Flight frequency score',
              },
            },
            travelers: {
              description: 'Traveler statistics',
              properties: {
                score: 'Traveler volume score',
              },
            },
          },
        },
      },
    };

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(schema, null, 2),
          mimeType: 'application/json',
        },
      ],
    };
  },
);

// Nearest Airport schema
server.resource(
  'nearest-airport-schema',
  'schema://nearest-airports',
  async (uri) => {
    const schema = {
      type: 'Nearest Airport',
      properties: {
        type: 'Type of the location',
        subtype: 'Subtype of the location (e.g., AIRPORT)',
        name: 'Name of the airport',
        detailedName: 'Detailed name including location',
        iataCode: 'IATA code of the airport',
        distance: {
          description: 'Distance from search point',
          properties: {
            value: 'Numeric value of the distance',
            unit: 'Unit of measurement',
          },
        },
        analytics: {
          description: 'Analytics information',
          properties: {
            flights: {
              description: 'Flight statistics',
              properties: {
                score: 'Flight frequency score',
              },
            },
            travelers: {
              description: 'Traveler statistics',
              properties: {
                score: 'Traveler volume score',
              },
            },
          },
        },
      },
    };

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(schema, null, 2),
          mimeType: 'application/json',
        },
      ],
    };
  },
);
