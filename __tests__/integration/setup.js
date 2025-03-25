/**
 * Integration test setup for Amadeus API
 * 
 * This module checks for the presence of Amadeus API credentials and initializes
 * the API client if they are available. Tests can use the shouldRunIntegrationTests
 * flag to determine if they should run or be skipped.
 */

// Load environment variables
require('dotenv').config();

// Initialize Amadeus client if credentials are available
const Amadeus = require('amadeus');
let amadeus = null;
let shouldRunIntegrationTests = false;

// Default delay between API calls to avoid rate limiting (in ms)
const API_CALL_DELAY = 1000;
// Maximum number of retries for rate limited requests
const MAX_RETRIES = 3;

/**
 * Sleep utility function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after the specified time
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make an API call with retry logic for rate limiting
 * @param {Function} apiCallFn - Function that makes the API call
 * @param {number} retries - Number of retries left
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise} - Promise that resolves with the API response
 */
async function makeApiCallWithRetry(apiCallFn, retries = MAX_RETRIES, delay = API_CALL_DELAY) {
  try {
    // Add a small delay before each API call to help avoid rate limiting
    await sleep(delay);
    return await apiCallFn();
  } catch (error) {
    // Check if it's a rate limiting error (HTTP 429)
    if (error.response && error.response.statusCode === 429 && retries > 0) {
      console.log(`Rate limited. Retrying after ${delay * 2}ms. Retries left: ${retries}`);
      // Exponential backoff - double the delay for each retry
      await sleep(delay * 2);
      return makeApiCallWithRetry(apiCallFn, retries - 1, delay * 2);
    }
    
    // If not rate limited or out of retries, rethrow
    throw error;
  }
}

try {
  // Check if required credentials are available
  if (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
    amadeus = new Amadeus({
      clientId: process.env.AMADEUS_CLIENT_ID,
      clientSecret: process.env.AMADEUS_CLIENT_SECRET
    });
    shouldRunIntegrationTests = true;
    console.log('Amadeus API credentials found. Integration tests will run.');
  } else {
    console.log('Amadeus API credentials not found. Integration tests will be skipped.');
    console.log('To run integration tests, set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in your .env file.');
  }
} catch (error) {
  console.error('Failed to initialize Amadeus client:', error);
}

/**
 * Utility function to conditionally skip tests if credentials aren't available
 * @param {Function} testFn - The Jest test function (test or it)
 * @param {string} testName - The name of the test
 * @param {Function} testCallback - The test callback function
 */
function conditionalTest(testFn, testName, testCallback) {
  if (shouldRunIntegrationTests) {
    testFn(testName, testCallback);
  } else {
    testFn.skip(testName, () => {
      console.log(`Test "${testName}" skipped due to missing credentials`);
    });
  }
}

module.exports = {
  amadeus,
  shouldRunIntegrationTests,
  conditionalTest,
  sleep,
  makeApiCallWithRetry
}; 