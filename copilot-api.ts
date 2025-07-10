/**
 * MVP Copilot Integration
 * 
 * GitHub Copilot API integration for general code analysis
 * Falls back to mock responses if @vscode/copilot-api is not available
 */

import { CAPIClient, RequestType, type IExtensionInformation } from '@vscode/copilot-api';

interface CopilotAPIResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

export class MVPCopilotAPI {
    private client: CAPIClient | null = null;
    private hasCopilotAPI: boolean = false;
    private copilotToken: any = null;

    constructor(apiKey: string) {
        this.initializeCopilotAPI(apiKey);
    }

    // Static factory method to create instance with GitHub token
    static async createWithGitHubToken(githubToken: string): Promise<MVPCopilotAPI> {
        const instance = new MVPCopilotAPI('');
        await instance.initializeWithGitHubToken(githubToken);
        return instance;
    }

    private async initializeWithGitHubToken(githubToken: string) {
        try {
            // Create minimal extension info for token fetching
            const extensionInfo: IExtensionInformation = {
                name: 'mvp-code-analyzer',
                sessionId: `session-${Date.now()}`,
                machineId: 'mvp-machine-id',
                vscodeVersion: '1.80.0',
                version: '1.0.0',
                buildType: 'dev'
            };

            // Initialize client without license for token fetching
            this.client = new CAPIClient(extensionInfo, undefined);

            // Fetch Copilot token using GitHub token
            this.copilotToken = await this.fetchCopilotToken(githubToken);
            console.log('✅ Copilot token obtained successfully');

            // Re-initialize with proper license
            this.client = new CAPIClient(extensionInfo, this.copilotToken.token);
            this.hasCopilotAPI = true;
            console.log('✅ CAPIClient initialized with Copilot token');

        } catch (error) {
            console.error('❌ Failed to initialize with GitHub token:', error);
            this.hasCopilotAPI = false;
            throw error;
        }
    }

    //#region Private methods
    private async fetchCopilotToken(githubToken: string) {
        if (!this.client) {
            throw new Error('CAPIClient not initialized');
        }

        console.log('🔑 Fetching Copilot token...');
        const response = await this.client.makeRequest<Response>({
            headers: {
                Authorization: `token ${githubToken}`,
                'X-GitHub-Api-Version': '2025-04-01'
            },
        }, { type: RequestType.CopilotToken });

        const text = await response.text();
        console.log('📥 Copilot token response:', text);

        try {
            const tokenData = JSON.parse(text);
            return tokenData;
        } catch (e) {
            console.error('❌ Failed to parse Copilot token response:', text);
            throw new Error(`Invalid Copilot token response: ${e}`);
        }
    }
    //#endregion

    private async initializeCopilotAPI(apiKey: string) {
        try {
            // Create extension information required by CAPIClient
            const extensionInfo: IExtensionInformation = {
                name: 'mvp-code-analyzer',
                sessionId: `session-${Date.now()}`,
                machineId: 'mvp-machine-id',
                vscodeVersion: '1.80.0',
                version: '1.0.0',
                buildType: 'dev'
            };

            this.client = new CAPIClient(extensionInfo, apiKey);
            this.hasCopilotAPI = true;
            console.log('✅ Using real Copilot API via CAPIClient');
        } catch (error) {
            console.warn('⚠️  Failed to initialize Copilot API, using mock:', error);
            this.hasCopilotAPI = false;
        }
    }

    async callAPI(prompt: string, systemPrompt?: string): Promise<string> {
        const defaultSystemPrompt = "You are an AI assistant specializing in code analysis.";
        const actualSystemPrompt = systemPrompt || defaultSystemPrompt;

        if (this.hasCopilotAPI && this.client) {
            try {
                console.log('🔍 Making Copilot API request...');
                const requestBody = {
                    model: 'gpt-4',
                    messages: [
                        { role: 'system', content: actualSystemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 4000,
                };
                console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

                const response = await this.client.makeRequest<Response>({
                    method: 'POST',
                    body: JSON.stringify(requestBody),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.copilotToken.token}`,
                        'X-GitHub-Api-Version': '2025-04-01'
                    },
                }, { type: RequestType.ChatCompletions });

                // Handle Response object
                if (response instanceof Response) {
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('❌ API Error Response:', {
                            status: response.status,
                            statusText: response.statusText,
                            body: errorText
                        });
                        throw new Error(`API Error ${response.status}: ${errorText}`);
                    }

                    // Parse successful response
                    const responseText = await response.text();
                    console.debug('📥 Response text:', responseText);
                    const parsedResponse = JSON.parse(responseText);

                    if (parsedResponse.choices && parsedResponse.choices.length > 0) {
                        return parsedResponse.choices[0].message.content;
                    }
                }

                // Handle already parsed JSON response
                if (response && typeof response === 'object') {
                    // Handle different response formats
                    if ('choices' in response && Array.isArray(response.choices) && response.choices.length > 0) {
                        return response.choices[0].message.content;
                    }
                    if ('content' in response && typeof response.content === 'string') {
                        return response.content;
                    }
                    if ('text' in response && typeof response.text === 'string') {
                        return response.text;
                    }
                }

                console.error('❌ Unexpected response structure:', response);
                throw new Error('No valid response content from Copilot API');

            } catch (error: any) {
                console.error(`❌ Copilot API error: ${error.message}. Exiting application.`);
                throw new Error('Full error:', error);
            }
        } else {
            throw new Error(`❌ Copilot API not available (hasCopilotAPI: ${this.hasCopilotAPI}). Exiting application.`);
        }
    }
}
