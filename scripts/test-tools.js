#!/usr/bin/env node

const { spawn } = require('node:child_process');
const readline = require('node:readline');

// Helper function to get a future date string
const getFutureDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Predefined test cases
const testCases = {
  '1': {
    name: 'Search flights (JFK to LAX)',
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
  '2': {
    name: 'Search airports (JFK)',
    tool: 'search-airports',
    params: {
      keyword: 'JFK',
      maxResults: 5
    }
  },
  '3': {
    name: 'Price analysis (JFK to LAX)',
    tool: 'flight-price-analysis',
    params: {
      originLocationCode: 'JFK',
      destinationLocationCode: 'LAX',
      departureDate: getFutureDate(90),
      currencyCode: 'USD'
    }
  },
  '4': {
    name: 'Find cheapest dates (JFK to LAX)',
    tool: 'find-cheapest-dates',
    params: {
      originLocationCode: 'JFK',
      destinationLocationCode: 'LAX',
      departureDate: getFutureDate(90),
      oneWay: true,
      nonStop: false,
      currencyCode: 'USD'
    }
  },
  '5': {
    name: 'Round-trip flights (BOS to LHR)',
    tool: 'search-flights',
    params: {
      originLocationCode: 'BOS',
      destinationLocationCode: 'LHR',
      departureDate: getFutureDate(90),
      returnDate: getFutureDate(97),
      adults: 1,
      children: 0,
      infants: 0,
      nonStop: false,
      currencyCode: 'USD',
      maxResults: 5
    }
  }
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to display menu
function displayMenu() {
  console.log('\nAvailable test cases:');
  for (const [key, test] of Object.entries(testCases)) {
    console.log(`${key}. ${test.name}`);
  }
  console.log('q. Quit');
}

// Function to run a test case
function runTest(testCase) {
  console.log(`\nRunning: ${testCase.name}`);
  console.log('Parameters:', JSON.stringify(testCase.params, null, 2));
  
  const inspector = spawn('npx', [
    '@modelcontextprotocol/inspector',
    'node',
    'dist/cli.js',
    '--tool',
    testCase.tool,
    '--params',
    JSON.stringify(testCase.params)
  ]);

  inspector.stdout.on('data', (data) => {
    console.log(`\n${data}`);
  });

  inspector.stderr.on('data', (data) => {
    console.error(`\nError: ${data}`);
  });

  inspector.on('close', (code) => {
    console.log(`\nTest completed with code ${code}`);
    displayMenu();
    askForInput();
  });
}

// Function to ask for input
function askForInput() {
  rl.question('\nEnter the number of the test case to run (or q to quit): ', (answer) => {
    if (answer.toLowerCase() === 'q') {
      rl.close();
      return;
    }

    const testCase = testCases[answer];
    if (testCase) {
      runTest(testCase);
    } else {
      console.log('Invalid selection. Please try again.');
      displayMenu();
      askForInput();
    }
  });
}

// Start the program
console.log('Amadeus MCP Server Tool Tester');
console.log('=============================');
displayMenu();
askForInput(); 