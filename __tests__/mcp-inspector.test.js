const { spawn } = require('node:child_process');
const { setTimeout } = require('node:timers/promises');

// Helper function to get a future date string
const getFutureDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Test cases for different tools
const testCases = [
  {
    tool: 'search-flights',
    params: {
      originLocationCode: 'JFK',
      destinationLocationCode: 'LAX',
      departureDate: getFutureDate(90),
      adults: 1,
      children: 0,
      infants: 0,
      nonStop: false,
      currencyCode: 'USD',
      maxResults: 5
    }
  },
  {
    tool: 'search-airports',
    params: {
      keyword: 'JFK',
      maxResults: 5
    }
  },
  {
    tool: 'flight-price-analysis',
    params: {
      originLocationCode: 'JFK',
      destinationLocationCode: 'LAX',
      departureDate: getFutureDate(90),
      currencyCode: 'USD'
    }
  },
  {
    tool: 'find-cheapest-dates',
    params: {
      originLocationCode: 'JFK',
      destinationLocationCode: 'LAX',
      departureDate: getFutureDate(90),
      oneWay: true,
      nonStop: false,
      currencyCode: 'USD'
    }
  }
];

async function runInspectorTests() {
  // Start the MCP server
  const server = spawn('node', ['dist/cli.js']);
  
  // Wait for server to start
  await setTimeout(2000);

  // Process server output
  server.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });

  server.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });

  // Run each test case
  for (const testCase of testCases) {
    console.log(`\nTesting ${testCase.tool}...`);
    
    // Create the inspector command
    const inspector = spawn('npx', [
      '@modelcontextprotocol/inspector',
      'node',
      'dist/cli.js',
      '--tool',
      testCase.tool,
      '--params',
      JSON.stringify(testCase.params)
    ]);

    // Process inspector output
    inspector.stdout.on('data', (data) => {
      console.log(`Inspector: ${data}`);
    });

    inspector.stderr.on('data', (data) => {
      console.error(`Inspector Error: ${data}`);
    });

    // Wait for inspector to complete
    await new Promise((resolve) => {
      inspector.on('close', (code) => {
        console.log(`Inspector exited with code ${code}`);
        resolve();
      });
    });

    // Wait between tests to avoid rate limiting
    await setTimeout(1000);
  }

  // Cleanup
  server.kill();
}

// Run the tests
runInspectorTests().catch(console.error); 