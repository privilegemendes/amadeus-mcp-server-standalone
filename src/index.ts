import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
const Amadeus = require('amadeus');
import dotenv from 'dotenv';
// Use require instead of import for node-cache
const NodeCache = require('node-cache');

// Define a type for our cache to make TypeScript happy
type TypedCache = {
  get: <T>(key: string) => T | undefined;
  set: <T>(key: string, value: T, ttl?: number) => boolean;
};

// Load environment variables
dotenv.config();

// Initialize Amadeus client only if credentials are available
export let amadeus = null;
if (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
  amadeus = new Amadeus({
    clientId: process.env.AMADEUS_CLIENT_ID,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET,
  });
} else {
  console.error('Warning: Amadeus credentials not found in environment variables');
}

// Create MCP server
export const server = new McpServer({
  name: 'amadeus-mcp-server',
  version: '1.0.0',
  tools: [],
});

// Create a cache instance
// Default TTL is 10 minutes (600 seconds)
export const cache = new NodeCache({
  stdTTL: 600,
  checkperiod: 120,
  useClones: false,
}) as TypedCache;

/**
 * Wrapper for Amadeus API calls with caching
 * @param cacheKey - Key for caching
 * @param ttl - Time to live in seconds
 * @param apiCall - Function that returns a promise with the API call
 * @returns Promise with API response
 */
export async function cachedApiCall<T>(
  cacheKey: string,
  ttl: number,
  apiCall: () => Promise<T>,
): Promise<T> {
  // Check if we have a cached response
  const cachedResponse = cache.get<T>(cacheKey);
  if (cachedResponse) {
    console.error(`Cache hit for ${cacheKey}`);
    return cachedResponse;
  }

  // If not cached, make the API call
  console.error(`Cache miss for ${cacheKey}, calling API...`);
  try {
    const response = await apiCall();

    // Cache the response with the specified TTL
    cache.set<T>(cacheKey, response, ttl);

    return response;
  } catch (error: unknown) {
    console.error(`API call failed for ${cacheKey}:`, error);
    throw error;
  }
}

// Start the server
export async function main() {
  // Connect resources, tools, and prompts (we'll add these next)

  // Start server
  console.error('Starting Amadeus Flight MCP Server...');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Amadeus Flight MCP Server running');
}

// Only run main if this file is being run directly
if (require.main === module) {
  main().catch((error: unknown) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
