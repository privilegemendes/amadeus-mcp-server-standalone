#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { server } from './index.js';

// Start the server
async function main() {
  // Import components to register tools, resources, and prompts
  await Promise.all([
    import('./tools.js'),
    import('./resources.js'),
    import('./prompt.js')
  ]);

  // Start server
  console.error('Starting Amadeus Flight MCP Server...');

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Amadeus Flight MCP Server running');
}

main().catch((error: unknown) => {
  console.error('Fatal error:', error);
  process.exit(1);
});