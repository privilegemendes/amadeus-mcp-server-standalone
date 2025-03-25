// No imports needed for basic tests

describe('Basic syntax tests', () => {
  test('JavaScript syntax test', () => {
    // Test basic JavaScript features
    const array = [1, 2, 3];
    expect(array.length).toBe(3);
    
    const obj = { name: 'Test', value: 42 };
    expect(obj.name).toBe('Test');
    expect(obj.value).toBe(42);
  });
  
  test('Async/await support', async () => {
    const result = await Promise.resolve('async works');
    expect(result).toBe('async works');
  });
  
  test('Arrow functions', () => {
    const add = (a, b) => a + b;
    expect(add(2, 3)).toBe(5);
  });
}); 