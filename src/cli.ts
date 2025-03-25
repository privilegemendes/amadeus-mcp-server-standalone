#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { server } from './index';

// Start the server
async function main() {
  // Get the allowed paths from command line arguments
  const allowedPaths = process.argv.slice(2);

  if (allowedPaths.length === 0) {
    console.error(
      'Error: No paths provided. Please provide at least one path to access.',
    );
    process.exit(1);
  }

  // Start server
  console.error('Starting Amadeus Flight MCP Server...');
  console.error('Allowed paths:', allowedPaths);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Amadeus Flight MCP Server running');
}

main().catch((error: unknown) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
