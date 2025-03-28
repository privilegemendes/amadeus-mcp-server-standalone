import { analyzeQuery } from './queryAnalyzer';
import { processQuery } from './queryProcessor';
import { server } from './index';
import { z } from 'zod';

// Interface for the natural language response
interface NLResponse {
  summary: string;
  details: any;
  suggestedActions: string[];
  followUpQuestions: string[];
}

// Format the response in natural language
function formatResponse(
  queryResult: any,
  analyzedQuery: any
): NLResponse {
  const response: NLResponse = {
    summary: '',
    details: queryResult.mainResult,
    suggestedActions: [],
    followUpQuestions: queryResult.suggestedFollowUp || [],
  };

  // Generate summary based on query type
  switch (analyzedQuery.type) {
    case 'inspiration':
      response.summary = `I've found some interesting destinations you might like to visit${
        analyzedQuery.timeFrame.value ? ` during ${analyzedQuery.timeFrame.value}` : ''
      }${
        analyzedQuery.budget ? ` within your budget of ${analyzedQuery.budget.amount}` : ''
      }.`;
      break;
      
    case 'specific_route':
      response.summary = `Here are the best flight options from ${analyzedQuery.origin?.raw} to ${
        analyzedQuery.destinations[0]?.raw
      }${analyzedQuery.timeFrame.value ? ` on ${analyzedQuery.timeFrame.value}` : ''}.`;
      break;
      
    case 'multi_city':
      response.summary = `I've planned a multi-city trip visiting ${
        analyzedQuery.destinations.map(d => d.raw).join(', ')
      }${analyzedQuery.duration ? ` over ${analyzedQuery.duration.value} ${analyzedQuery.duration.type}` : ''}.`;
      break;
      
    case 'flexible_value':
      response.summary = `I've found the most economical travel options for your trip${
        analyzedQuery.destinations.length > 0 ? ` to ${analyzedQuery.destinations[0].raw}` : ''
      }.`;
      break;
  }

  // Generate suggested actions based on results
  if (queryResult.supplementaryResults) {
    response.suggestedActions = [
      'Compare prices across different dates',
      'Check alternative airports',
      'Set up price alerts',
      'View detailed flight information',
    ];
  }

  return response;
}

// Main handler for natural language queries
export async function handleNaturalLanguageQuery(
  query: string
): Promise<NLResponse> {
  try {
    // Step 1: Analyze the natural language query
    const analyzed = await analyzeQuery(query);
    
    // Step 2: Process the analyzed query with appropriate tools
    const result = await processQuery(analyzed);
    
    // Step 3: Format the response in natural language
    const response = formatResponse(result, analyzed);
    
    // Add confidence-based disclaimer if needed
    if (analyzed.confidence < 0.8) {
      response.summary = `I'm not entirely sure, but ${response.summary.toLowerCase()} Please let me know if this isn't what you were looking for.`;
    }
    
    return response;
    
  } catch (error) {
    console.error('Error handling natural language query:', error);
    throw error;
  }
}

// Register the natural language prompt
server.prompt(
  'natural-language-travel',
  'Handle natural language travel queries',
  {
    query: z.string().describe('The natural language travel query'),
  },
  async ({ query }: { query: string }) => {
    const response = await handleNaturalLanguageQuery(query);
    
    return {
      messages: [
        {
          role: 'assistant',
          content: {
            type: 'text',
            text: `${response.summary}\n\n${
              response.followUpQuestions.length > 0
                ? `To help me provide better results, could you please clarify:\n${response.followUpQuestions
                    .map(q => `- ${q}`)
                    .join('\n')}\n\n`
                : ''
            }${
              response.suggestedActions.length > 0
                ? `You can also:\n${response.suggestedActions
                    .map(a => `- ${a}`)
                    .join('\n')}`
                : ''
            }`,
          },
        },
      ],
    };
  },
); 