import { server } from '../src/index';

describe('MCP Prompts', () => {
  // Helper function to get a prompt handler
  const getPromptHandler = (promptName: string) => {
    const prompt = server.prompts.find(
      (p: { meta?: { name: string } }) => p.meta?.name === promptName,
    );
    return prompt?.handler;
  };

  test('analyze-flight-prices prompt returns correct message structure', async () => {
    const promptHandler = getPromptHandler('analyze-flight-prices');
    expect(promptHandler).toBeDefined();

    if (promptHandler) {
      const result = await promptHandler({
        originLocationCode: 'JFK',
        destinationLocationCode: 'LAX',
        departureDate: '2023-01-01',
        returnDate: '2023-01-10',
      });

      expect(result).toHaveProperty('messages');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]).toHaveProperty('role', 'user');
      expect(result.messages[0].content).toHaveProperty('type', 'text');

      // Check that the text includes the parameters we provided
      const text = result.messages[0].content.text;
      expect(text).toContain('JFK');
      expect(text).toContain('LAX');
      expect(text).toContain('2023-01-01');
      expect(text).toContain('2023-01-10');
      expect(text).toContain('flight-price-analysis tool');
      expect(text).toContain('search-flights tool');
    }
  });

  test('find-best-deals prompt returns correct message structure', async () => {
    const promptHandler = getPromptHandler('find-best-deals');
    expect(promptHandler).toBeDefined();

    if (promptHandler) {
      const result = await promptHandler({
        originLocationCode: 'JFK',
        destinationLocationCode: 'LAX',
        departureDate: '2023-01-01',
        returnDate: '2023-01-10',
        travelClass: 'BUSINESS',
      });

      expect(result).toHaveProperty('messages');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]).toHaveProperty('role', 'user');
      expect(result.messages[0].content).toHaveProperty('type', 'text');

      // Check that the text includes the parameters we provided
      const text = result.messages[0].content.text;
      expect(text).toContain('JFK');
      expect(text).toContain('LAX');
      expect(text).toContain('2023-01-01');
      expect(text).toContain('2023-01-10');
      expect(text).toContain('BUSINESS class');
      expect(text).toContain('search-flights tool');
    }
  });

  test('plan-multi-city-trip prompt returns correct message structure', async () => {
    const promptHandler = getPromptHandler('plan-multi-city-trip');
    expect(promptHandler).toBeDefined();

    if (promptHandler) {
      const result = await promptHandler({
        cities: 'LAX, SFO, LAS',
        startDate: '2023-01-01',
        endDate: '2023-01-15',
        homeAirport: 'JFK',
      });

      expect(result).toHaveProperty('messages');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]).toHaveProperty('role', 'user');
      expect(result.messages[0].content).toHaveProperty('type', 'text');

      // Check that the text includes the parameters we provided
      const text = result.messages[0].content.text;
      expect(text).toContain('LAX, SFO, LAS');
      expect(text).toContain('JFK');
      expect(text).toContain('2023-01-01');
      expect(text).toContain('2023-01-15');
      expect(text).toContain('search-airports tool');
      expect(text).toContain('search-flights tool');
    }
  });
});
