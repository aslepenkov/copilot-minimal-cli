/**
 * MVP Standalone Agent - General Purpose Code Analysis
 */

import * as path from 'path';
import { MVPCopilotAPI, ReadOnlyFileSystem, FileLogger, type ILogger } from '../services';
import { ITool, IFileSystem, ToolRegistry } from '../tools';
import type { MVPAgentConfig, AgentResult, ToolCall } from './interfaces';

// Main MVP Agent Class
export class MVPStandaloneAgent {
    private readonly fileSystem: IFileSystem;
    private readonly logger: ILogger;
    private readonly toolRegistry: ToolRegistry = new ToolRegistry();
    private readonly config: MVPAgentConfig;
    private copilotAPI: MVPCopilotAPI | null = null;

    constructor(config: MVPAgentConfig) {
        this.config = config;
        this.fileSystem = new ReadOnlyFileSystem(config.workspacePath);
        this.logger = new FileLogger(path.join(process.cwd(), 'logs'));
    }

    async initialize(): Promise<void> {
        console.log(`🤖 Initializing MVP Agent...`);
        console.log(`📁 Workspace: ${this.config.workspacePath}`);

        await this.initializeCopilotAPI();
        await this.validateWorkspace();
        await this.initializeTools();
        await this.logInitializationComplete();
    }

    private async initializeCopilotAPI(): Promise<void> {
        const copilotConfig = { debugMode: this.config.debugMode };

        if (this.config.githubToken) {
            this.copilotAPI = await MVPCopilotAPI.createWithGitHubToken(this.config.githubToken, copilotConfig);
            console.log(`🔗 Copilot API initialized via GitHub token`);
        } else if (this.config.copilotApiKey) {
            this.copilotAPI = new MVPCopilotAPI(this.config.copilotApiKey, copilotConfig);
            console.log(`🔗 Copilot API initialized via API key`);
        }
    }

    private async validateWorkspace(): Promise<void> {
        if (!await this.fileSystem.exists(this.config.workspacePath)) {
            throw new Error(`Workspace path does not exist: ${this.config.workspacePath}`);
        }
    }

    private async initializeTools(): Promise<void> {
        this.toolRegistry.initializeReadOnlyTools(this.fileSystem);
        const toolNames = this.toolRegistry.getAll().map(tool => tool.name).join(', ');
        console.log(`🔧 Initialized ${this.toolRegistry.size()} tools: ${toolNames}`);
    }

    private async logInitializationComplete(): Promise<void> {
        const workspaceStructure = await this.fileSystem.getWorkspaceStructure();
        console.log(`📊 Workspace structure loaded (${workspaceStructure.length} characters)`);
    }

    async analyzeWorkspace(customPrompt?: string): Promise<AgentResult> {
        try {
            const systemPrompt = await this.loadSystemPrompt();
            const userPrompt = await this.loadUserPrompt(customPrompt);

            console.log(`\n🔍 Analyzing workspace: ${userPrompt.substring(0, 50)}...`);

            const analysisContext = this.createAnalysisContext();
            const result = await this.runAnalysisLoop(systemPrompt, userPrompt, analysisContext);

            await this.logAnalysisResults(userPrompt, result, analysisContext);
            return result;

        } catch (error: any) {
            console.error(`❌ Analysis failed:`, error);
            return this.createErrorResult(error.message);
        }
    }

    private async loadSystemPrompt(): Promise<string> {
        try {
            const systemPromptPath = path.join(process.cwd(), 'prompt', 'system.txt');
            if (await this.fileSystem.exists(systemPromptPath)) {
                const systemPrompt = await this.fileSystem.readFile(systemPromptPath);
                console.log(`📄 Using system prompt from input/system.txt`);
                return systemPrompt.trim();
            }
        } catch (error) {
            console.log(`⚠️  Error reading system prompt file, using fallback: ${error}`);
        }

        console.log(`⚠️  input/system.txt not found, using fallback system prompt`);
        return "You are an AI assistant.";
    }

    private async loadUserPrompt(customPrompt?: string): Promise<string> {
        if (customPrompt) {
            return customPrompt;
        }

        try {
            const promptPath = path.join(process.cwd(), 'prompt', 'prompt.txt');
            if (await this.fileSystem.exists(promptPath)) {
                const prompt = await this.fileSystem.readFile(promptPath);
                console.log(`📄 Using prompt from input/prompt.txt`);
                return prompt.trim();
            }
        } catch (error) {
            console.log(`⚠️  Error reading prompt file, using fallback: ${error}`);
        }

        console.log(`⚠️  input/prompt.txt not found, using fallback prompt`);
        return "analyze code";
    }

    private createAnalysisContext() {
        return {
            startTime: Date.now(),
            toolCalls: [] as ToolCall[],
            iterations: 0,
            analysisData: {}
        };
    }

    private async runAnalysisLoop(
        systemPrompt: string,
        userPrompt: string,
        context: any
    ): Promise<AgentResult> {
        const fullUserPrompt = await this.buildUserPrompt(userPrompt);
        let currentResponse = await this.callCopilotAPI(fullUserPrompt, systemPrompt);

        while (context.iterations < this.config.maxIterations) {
            context.iterations++;
            console.log(`\n📋 Iteration ${context.iterations}/${this.config.maxIterations}`);

            const extractedToolCalls = this.extractToolCalls(currentResponse);

            if (extractedToolCalls.length === 0) {
                console.log(`📊 Analysis complete - no more tool calls needed {TODO STOP HERE EXIT LOOP}`);
                context.analysisData += currentResponse;
                // break;
            }

            await this.executeToolCalls(extractedToolCalls, context.toolCalls);

            const toolResultsPrompt = await this.buildToolResultsPrompt(extractedToolCalls);
            currentResponse = await this.callCopilotAPI(toolResultsPrompt, systemPrompt);
        }

        const duration = Date.now() - context.startTime;
        console.log(`\n⏱️  Analysis completed in ${duration}ms`);

        return {
            success: true,
            response: currentResponse,
            analysisData: context.analysisData,
            iterations: context.iterations
        };
    }

    private async executeToolCalls(extractedToolCalls: ToolCall[], allToolCalls: ToolCall[]): Promise<void> {
        for (const toolCall of extractedToolCalls) {
            console.log(`🔧 Executing tool: ${toolCall.name}`);

            try {
                const tool = this.toolRegistry.get(toolCall.name);
                if (!tool) {
                    throw new Error(`Tool not found: ${toolCall.name}`);
                }

                const result = await tool.execute(toolCall.arguments);
                toolCall.result = result;
                toolCall.timestamp = new Date();
                allToolCalls.push(toolCall);

                if (this.config.debugMode) {
                    console.log(`  Result:`, result);
                }
            } catch (error: any) {
                console.error(`  Error executing tool ${toolCall.name}:`, error);
                toolCall.result = { error: error.message };
                toolCall.timestamp = new Date();
                allToolCalls.push(toolCall);
            }
        }
    }

    private async logAnalysisResults(userPrompt: string, result: AgentResult, context: any): Promise<void> {
        await this.logger.logAnalysis({
            prompt: userPrompt,
            analysisData: result.analysisData,
            toolCalls: context.toolCalls,
            iterations: result.iterations,
            duration: Date.now() - context.startTime
        });
    }

    private createErrorResult(errorMessage: string): AgentResult {
        return {
            success: false,
            response: '',
            analysisData: {},
            iterations: 0,
            error: errorMessage
        };
    }

    private async buildUserPrompt(request: string): Promise<string> {
        const template = `WORKSPACE CONTEXT:
            Working Directory: {{workspacePath}}
            Workspace Structure:
            {{workspaceStructure}}

            AVAILABLE TOOLS:
            {{toolDescriptions}}

            ANALYSIS REQUEST: {{request}}`;
        const workspaceStructure = await this.fileSystem.getWorkspaceStructure();
        const toolDescriptions = this.getToolDescriptions();

        return template
            .replace('{{workspacePath}}', this.config.workspacePath)
            .replace('{{workspaceStructure}}', workspaceStructure)
            .replace('{{toolDescriptions}}', toolDescriptions)
            .replace('{{request}}', request);
    }

    private getToolDescriptions(): string {
        return this.toolRegistry.getAll()
            .map((tool: ITool) => `${tool.name}: ${tool.description}`)
            .join('\n');
    }

    private async buildToolResultsPrompt(toolCalls: ToolCall[]): Promise<string> {
        const template = `Tool execution results:
            {{results}}
            Continue your analysis based on these results.
            If you have enough information, provide a comprehensive summary of your findings.`;
        const results = this.formatToolResults(toolCalls);
        return template.replace('{{results}}', results);
    }

    private formatToolResults(toolCalls: ToolCall[]): string {
        return toolCalls.map(call =>
            `Tool: ${call.name}\nArguments: ${JSON.stringify(call.arguments)}\nResult: ${JSON.stringify(call.result)}`
        ).join('\n\n');
    }

    private async callCopilotAPI(prompt: string, systemPrompt?: string): Promise<string> {
        console.log(`🧠 Copilot API Call (${prompt.length} chars)`);

        if (!this.copilotAPI) {
            throw new Error('Copilot API is not initialized.');
        }

        const response = await this.copilotAPI.callAPI(prompt, systemPrompt);
        await this.logger.logLLMOutput(prompt, response);
        return response;
    }

    private extractToolCalls(response: string): ToolCall[] {
        // Regex to find JSON objects `{ ... }` in the text
        const jsonRegex = /\{[\s\S]*\}/;

        // Find all matches for JSON objects
        const matches = response.match(jsonRegex);

        // Parse and collect valid JSON objects
        const parsedObjects: ToolCall[] = [];
        if (matches) {
            for (const match of matches) {
                try {
                    // Attempt to parse each match as JSON
                    const parsed = JSON.parse(match);
                    parsedObjects.push(parsed.tool_call);
                } catch (error) {
                    // Skip parsing if invalid JSON
                    console.error("Invalid JSON object:", match);
                }
            }
        }

        return parsedObjects;
    }
    private extractToolCallsbad(response: string): ToolCall[] {
        const toolCalls: ToolCall[] = [];
        // Regex to match any JSON object containing a 'tool_call' property
        const toolCallRegex = /\{[^{}]*"tool_call"\s*:\s*\{[\s\S]*?\}[^{}]*\}/g;
        const matches = response.match(toolCallRegex);
        if (matches) {
            for (const match of matches) {
                try {
                    const parsed = JSON.parse(match);
                    if (parsed.tool_call && parsed.tool_call.name) {
                        toolCalls.push(this.createToolCall(parsed.tool_call));
                    }
                } catch (error) {
                    console.warn(`Failed to parse tool call JSON: ${match}`);
                    continue;
                    // Ignore parse errors
                }
            }
        }
        return toolCalls;
    }

    private createToolCall(toolCallData: any): ToolCall {
        return {
            name: toolCallData.name,
            arguments: toolCallData.arguments || {},
            result: null,
            timestamp: new Date()
        };
    }
}

// Export is handled by agent/index.ts
