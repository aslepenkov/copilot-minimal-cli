import { logger } from '../utils';
import { OutputHandler } from './outputService/outputInterface';
import { parseResponseForFiles } from '../utils/parser';
import dotenv from 'dotenv';
import { fetch } from 'undici';
import { config } from '../config';
import { authCommand } from '../commands/auth';
import { CAPIClient } from '@vscode/copilot-api';

// License agreement for Copilot API
const LICENSE_AGREEMENT = 'I accept the GitHub Copilot license terms and telemetry collection, the Microsoft Privacy Statement, and the Microsoft Terms of Use.';

// Client configuration
const CLIENT_CONFIG = {
  machineId: 'cli-machine-id',
  sessionId: 'cli-session-id',
  vscodeVersion: 'cli-vscode',
  buildType: 'dev' as 'dev' | 'prod',
  name: 'GitHubCopilotChat',
  version: '0.1.0',
};

/**
 * Gets GitHub token from environment or triggers auth flow
 */
export async function getToken(): Promise<string> {
  // Ensure .env is loaded
  // dotenv.config();
  
  const token = process.env.GITHUB_OAUTH_TOKEN;
  if (token) {
    return token;
  }
  
  logger.info('No GitHub token found. Starting authentication process...');
  return authCommand();
}

/**
 * Creates an API client for communicating with Copilot
 */
export async function createCAPIClient(token: string) {
  return new CAPIClient(
    CLIENT_CONFIG, 
    LICENSE_AGREEMENT, 
    {
      fetch: async (url: string, options: any) => {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'User-Agent': `${CLIENT_CONFIG.name}/${CLIENT_CONFIG.version}`,
            'Authorization': `Bearer ${token}`
          }
        });
        
        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          text: () => response.text(),
          json: () => response.json(),
        };
      },
    }
  );
}

/**
 * Exchanges GitHub token for Copilot token
 */
export async function getCopilotToken(githubToken: string): Promise<string> {
  try {
    const client = await createCAPIClient(githubToken);
    
    const response = await client.makeRequest<Response>({
      headers: {
        Authorization: `token ${githubToken}`,
        'X-GitHub-Api-Version': '2025-04-01'
      },
    }, { type: "CopilotToken" });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get Copilot token: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const data = await response.json();
    if (!data.token) {
      throw new Error('No token found in Copilot token response');
    }
    
    return data.token;
  } catch (error) {
    logger.error('Error getting Copilot token:', error);
    throw error;
  }
}

/**
 * Send a request to Copilot API in agent mode and process the response
 */
export async function getCompletion(
  token: string, 
  prompt: string, 
  contextName: string,
  outputHandlers: OutputHandler[]
): Promise<void> {
  try {
    // Create the CAPIClient with the Copilot token
    const client = await createCAPIClient(token);
    
    // Use the makeRequest method to send a chat completion request
    const response = await client.makeRequest<Response>({
      method: 'POST',
      body: JSON.stringify({
        model: config.api.model,
        messages: [
          {
            role: 'system',
            content: 'You are GitHub Copilot, a large language model trained by GitHub. Answer as concisely as possible.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.api.temperature,
        max_tokens: config.api.maxTokens,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }, { type: "RemoteAgentChat" });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const data = await response.json();
    
    // Extract the response text
    let responseText = '';
    if (data.choices && data.choices.length > 0) {
      responseText = data.choices[0].message.content || '';
    } else {
      logger.warn('No response data from Copilot API');
      responseText = 'No response received from Copilot.';
    }
    
    // 1. Process as stream output (log the entire response)
    for (const handler of outputHandlers) {
      await handler.handleStreamOutput(responseText, contextName);
    }
    
    // 2. Process as file output (extract files and generate them)
    const files = parseResponseForFiles(responseText);
    if (files.length > 0) {
      logger.info(`Found ${files.length} files to generate`);
      for (const handler of outputHandlers) {
        await handler.handleFileOutput(files, contextName);
      }
    } else {
      logger.info('No files to generate from the response');
    }
    
    logger.success('Completed processing request');
  } catch (error: unknown) {
    logger.error('Error getting completion:', error);
    throw error;
  }
}
