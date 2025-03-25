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
