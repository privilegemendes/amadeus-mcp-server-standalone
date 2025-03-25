import { cache, cachedApiCall } from '../src/index';

// Mock console.error to avoid cluttering test output
console.error = jest.fn();

describe('Caching Functionality', () => {
  beforeEach(() => {
    // Clear the cache and console.error mocks before each test
    jest.clearAllMocks();

    // Get all cache keys and delete them
    const keys = Object.keys(
      (cache as { data: Record<string, unknown> }).data || {},
    );
    for (const key of keys) {
      cache.del(key);
    }
  });

  test('cachedApiCall should call the API when cache miss', async () => {
    // Mock API call
    const mockApiCall = jest.fn().mockResolvedValue({ data: 'test data' });

    // Call the function
    const result = await cachedApiCall('test-key', 60, mockApiCall);

    // Assertions
    expect(mockApiCall).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: 'test data' });
    expect(console.error).toHaveBeenCalledWith(
      'Cache miss for test-key, calling API...',
    );
  });

  test('cachedApiCall should return cached data on cache hit', async () => {
    // Prepare cache
    const testData = { data: 'cached data' };
    cache.set('test-key-2', testData);

    // Mock API call - this should not be called
    const mockApiCall = jest.fn();

    // Call the function
    const result = await cachedApiCall('test-key-2', 60, mockApiCall);

    // Assertions
    expect(mockApiCall).not.toHaveBeenCalled();
    expect(result).toEqual(testData);
    expect(console.error).toHaveBeenCalledWith('Cache hit for test-key-2');
  });

  test('cachedApiCall should handle API errors', async () => {
    // Mock API call that throws
    const mockError = new Error('API Error');
    const mockApiCall = jest.fn().mockRejectedValue(mockError);

    // Call the function and expect it to throw
    await expect(cachedApiCall('test-key-3', 60, mockApiCall)).rejects.toThrow(
      'API Error',
    );

    // Assertions
    expect(mockApiCall).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      'Cache miss for test-key-3, calling API...',
    );
    expect(console.error).toHaveBeenCalledWith(
      'API call failed for test-key-3:',
      mockError,
    );
  });
});
