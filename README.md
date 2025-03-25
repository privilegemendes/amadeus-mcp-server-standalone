# Amadeus MCP Server

This is a Model Context Protocol (MCP) server that connects to the Amadeus API to provide flight search, booking, and analysis capabilities for AI assistants.

<a href="https://glama.ai/mcp/servers/@privilegemendes/amadeus-mcp-server-standalone">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@privilegemendes/amadeus-mcp-server-standalone/badge" alt="Amadeus Server MCP server" />
</a>

## Features

- **Flight Search**: Find flights between airports with various parameters
- **Airport Information**: Search for airports by keyword, city, or country
- **Price Analysis**: Get price metrics for routes to determine if current prices are high or low
- **Cheapest Dates**: Find the most economical dates to travel
- **Flight Details**: Get detailed information about specific flight offers

## Prompts

The server provides several pre-configured prompts for common travel planning scenarios:

1. **Analyze Flight Prices** (`analyze-flight-prices`): Analyze flight prices for a route with insights on pricing trends
2. **Find Best Deals** (`find-best-deals`): Find the best flight deals for a specific route and date
3. **Plan Multi-City Trip** (`plan-multi-city-trip`): Plan a complete multi-city itinerary with optimal routing
4. **Find Cheapest Travel Dates** (`find-cheapest-travel-dates`): Identify the most economical dates to travel

## Setup

### Prerequisites

- Node.js 16.x or higher
- Amadeus API credentials (Client ID and Secret)

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/amadeus-mcp-server.git
cd amadeus-mcp-server
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file in the root directory with your Amadeus API credentials:
```
AMADEUS_CLIENT_ID=your_client_id
AMADEUS_CLIENT_SECRET=your_client_secret
```

### Running the Server

Build and start the server:
```
npm run build
npm start
```

For development:
```
npm run dev
```

### Testing and Development

This project uses Jest for testing and Biome for linting and formatting.

Run unit tests:
```
npx jest
```

Run tests with watch mode:
```
npx jest --watch
```

Run tests with coverage:
```
npx jest --coverage
```

Run integration tests (requires Amadeus API credentials):
```
npm run test:integration
```

Run linting:
```
npm run lint
```

Format code:
```
npm run format
```

## Integration Testing

The project includes comprehensive integration tests that verify the server's interaction with the real Amadeus API. These tests help ensure that our API clients work correctly with the actual API endpoints and handle responses appropriately.

### Requirements for Integration Tests

- **Amadeus API Credentials**: Tests require valid Amadeus API credentials in the `.env` file:
  ```
  AMADEUS_CLIENT_ID=your_client_id
  AMADEUS_CLIENT_SECRET=your_client_secret
  ```

- **Test Environment**: Tests are configured to use the Amadeus Test Environment, not the production API.

### Running Integration Tests

```
npm run test:integration
```

The integration tests are located in `__tests__/integration` and validate the following API features:

- **Airport Search**: Searching for airports by code or keyword
- **Flight Search**: Finding flights for one-way and round-trip journeys
- **Price Analysis**: Getting price metrics for specific routes

### Best Practices for Integration Testing

1. **API Rate Limits**: The tests include automatic rate limit handling with exponential backoff to avoid API throttling. When running tests frequently, you may still encounter rate limits.

2. **Conditional Testing**: Tests are designed to skip automatically if API credentials are missing, allowing the test suite to run without errors in environments without credentials.

3. **Test in Isolation**: When developing a new feature, you can run specific test files:
   ```
   npx jest __tests__/integration/flight-search.test.js
   ```

4. **Longer Timeouts**: Integration tests use longer timeouts (60 seconds) to accommodate network latency and retries.

5. **Mock for CI/CD**: For continuous integration pipelines where real API access isn't available, use `__tests__/amadeus-mock.test.js` which runs without actual API calls.

## Integration

To use this MCP server with OpenAI's Assistant API or other compatible AI systems, configure the assistant to connect to this server's endpoint.

## Tools

The server provides the following tools:

### `search-flights`
Search for flight offers between two locations.

### `search-airports`
Search for airports by keyword, city name, or IATA code.

### `flight-price-analysis`
Get price metrics for a flight route to determine if current prices are high or low.

### `get-flight-details`
Get detailed information about a specific flight offer.

### `find-cheapest-dates`
Find the cheapest dates to fly for a given route.

## Resources

The server provides schema resources for:

- Flight offers (`schema://flight-offers`)
- Airports (`schema://airports`)

## License

MIT