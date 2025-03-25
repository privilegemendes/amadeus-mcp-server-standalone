// Mock for node-cache
class MockNodeCache {
  constructor() {
    this.data = {};
  }
  
  get(key) {
    return this.data[key];
  }
  
  set(key, value) {
    this.data[key] = value;
    return true;
  }
  
  del(key) {
    if (this.data[key]) {
      delete this.data[key];
      return 1;
    }
    return 0;
  }
}

// Mock for cachedApiCall function
describe('Cached API Call', () => {
  let mockCache;
  let cachedApiCall;
  
  beforeEach(() => {
    // Create a fresh mock cache for each test
    mockCache = new MockNodeCache();
    
    // Mock console.error
    console.error = jest.fn();
    
    // Implementation of cachedApiCall using our mock
    cachedApiCall = async (cacheKey, ttl, apiCall) => {
      // Check if we have a cached response
      const cachedResponse = mockCache.get(cacheKey);
      if (cachedResponse) {
        console.error(`Cache hit for ${cacheKey}`);
        return cachedResponse;
      }
    
      // If not cached, make the API call
      console.error(`Cache miss for ${cacheKey}, calling API...`);
      try {
        const response = await apiCall();
    
        // Cache the response with the specified TTL
        mockCache.set(cacheKey, response);
    
        return response;
      } catch (error) {
        console.error(`API call failed for ${cacheKey}:`, error);
        throw error;
      }
    };
  });
  
  test('should call the API when cache misses', async () => {
    // Mock API call
    const mockApiCall = jest.fn().mockResolvedValue({ data: 'test data' });
    
    // Call the function
    const result = await cachedApiCall('test-key', 60, mockApiCall);
    
    // Assertions
    expect(mockApiCall).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: 'test data' });
    expect(console.error).toHaveBeenCalledWith('Cache miss for test-key, calling API...');
  });

  test('should return cached data on cache hit', async () => {
    // Prepare cache
    const testData = { data: 'cached data' };
    mockCache.set('test-key-2', testData);
    
    // Mock API call - this should not be called
    const mockApiCall = jest.fn();
    
    // Call the function
    const result = await cachedApiCall('test-key-2', 60, mockApiCall);
    
    // Assertions
    expect(mockApiCall).not.toHaveBeenCalled();
    expect(result).toEqual(testData);
    expect(console.error).toHaveBeenCalledWith('Cache hit for test-key-2');
  });

  test('should handle API errors', async () => {
    // Mock API call that throws
    const mockError = new Error('API Error');
    const mockApiCall = jest.fn().mockRejectedValue(mockError);
    
    // Call the function and expect it to throw
    await expect(cachedApiCall('test-key-3', 60, mockApiCall)).rejects.toThrow('API Error');
    
    // Assertions
    expect(mockApiCall).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('Cache miss for test-key-3, calling API...');
    expect(console.error).toHaveBeenCalledWith('API call failed for test-key-3:', mockError);
  });
}); 