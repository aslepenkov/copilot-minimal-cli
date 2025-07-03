import { createCAPIClient, getCopilotToken, getToken } from '../services/copilotService';
import { logger } from '../utils';
import { config } from '../config';

// Define type for API response
interface ApiResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Headers;
  text: () => Promise<string>;
  json: () => Promise<any>;
}

// Define type for function options
interface AskOptions {
  temperature?: string | number;
  maxTokens?: string | number;
  systemPrompt?: string;
}

/**
 * Sends a question to Copilot and returns the response
 */
export async function askCopilot(prompt: string, options: AskOptions = {}): Promise<void> {
  try {
    logger.info(`Sending question to Copilot: "${prompt}"`);

    const githubToken = await getToken();
    const copilotToken = await getCopilotToken(githubToken);
    const client = await createCAPIClient(copilotToken);

    // Parse options with defaults from config
    const temperature = parseFloat(String(options.temperature || config.api.temperature));
    const maxTokens = parseInt(String(options.maxTokens || config.api.maxTokens), 10);
    const systemPrompt = options.systemPrompt || 
      'You are GitHub Copilot, a large language model trained by GitHub. Answer as concisely as possible.';

    // Send request to Copilot API
    const response = await client.makeRequest<ApiResponse>({
      method: 'POST',
      body: JSON.stringify({
        model: config.api.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }, { type: "ChatCompletions" });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();

    // Extract response content
    const responseText = data.choices?.[0]?.message?.content || 'No response received from Copilot.';

    // Display the response
    console.log('\nCopilot Response:');
    console.log(responseText);
  } catch (error: unknown) {
    logger.error('Error getting completion:', error);
    throw error;
  }
}
