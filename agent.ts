/**
 * MVP Standalone Agent - General Purpose Code Analysis
 *
 * Minimal viable product focusing on:
 * - Copilot integration
 * - Readonly file operations
 * - General code analysis (any prompt from input/prompt.txt)
 * - LLM output logging
 */

import * as path from 'path';
import fs from 'fs-extra';
import { MVPCopilotAPI } from './copilot-api';
import { ITool, IFileSystem, ToolRegistry } from './tools';

// MVP-focused interfaces
interface ILogger {
    logLLMOutput(prompt: string, response: string, metadata?: any): Promise<void>;
    logAnalysis(analysis: any): Promise<void>;
}

// Simplified configuration for MVP
export interface MVPAgentConfig {
    workspacePath: string;
    copilotApiKey?: string;
    githubToken?: string;
    maxIterations: number;
    debugMode: boolean;
}

interface AgentResult {
    success: boolean;
    response: string;
    analysisData: any; // Generic analysis data instead of just business entities
    iterations: number;
    error?: string;
}

interface ToolCall {
    name: string;
    arguments: any;
    result: any;
    timestamp: Date;
}

// File System Implementation (readonly)
class ReadOnlyFileSystem implements IFileSystem {
    constructor(private workspacePath: string) { }

    async readFile(filePath: string): Promise<string> {
        const absolutePath = this.resolvePath(filePath);
        return await fs.readFile(absolutePath, 'utf-8');
    }

    async listDirectory(dirPath: string): Promise<string[]> {
        const absolutePath = this.resolvePath(dirPath);
        return await fs.readdir(absolutePath);
    }

    async exists(filePath: string): Promise<boolean> {
        const absolutePath = this.resolvePath(filePath);
        return await fs.pathExists(absolutePath);
    }

    async getWorkspaceStructure(maxSize: number = 2000): Promise<string> {
        return this.buildDirectoryTree(this.workspacePath, '', 0, maxSize);
    }

    private resolvePath(filePath: string): string {
        if (path.isAbsolute(filePath)) {
            return filePath;
        }
        return path.resolve(this.workspacePath, filePath);
    }

    private async buildDirectoryTree(
        dirPath: string,
        prefix: string = '',
        depth: number = 0,
        maxSize: number
    ): Promise<string> {
        if (prefix.length > maxSize) {
            return prefix + '\n... (truncated due to size limit)';
        }

        if (depth > 10) { // Prevent infinite recursion
            return prefix;
        }

        let result = '';
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            const sortedEntries = entries.sort((a: any, b: any) => {
                // Directories first, then files
                if (a.isDirectory() && !b.isDirectory()) return -1;
                if (!a.isDirectory() && b.isDirectory()) return 1;
                return a.name.localeCompare(b.name);
            });

            for (const entry of sortedEntries) {
                // Skip hidden files and common build directories
                if (entry.name.startsWith('.') ||
                    ['bin', 'obj', 'node_modules', 'dist', 'build', '__pycache__', 'logs'].includes(entry.name)) {
                    continue;
                }

                const entryPath = path.join(dirPath, entry.name);
                const relativePath = path.relative(this.workspacePath, entryPath);

                if (entry.isDirectory()) {
                    result += `${relativePath}/\n`;
                    const subTree = await this.buildDirectoryTree(
                        entryPath,
                        result,
                        depth + 1,
                        maxSize
                    );
                    result = subTree;
                } else {
                    result += `${relativePath}\n`;
                }

                if (result.length > maxSize) {
                    return result + '... (truncated due to size limit)';
                }
            }
        } catch (error) {
            // Skip directories that can't be read
        }

        return result;
    }
}

// Logger Implementation
class FileLogger implements ILogger {
    constructor(private logsPath: string) {
        this.ensureLogsDirectory();
    }

    private async ensureLogsDirectory(): Promise<void> {
        await fs.ensureDir(this.logsPath);
    }

    async logLLMOutput(prompt: string, response: string, metadata: any = {}): Promise<void> {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type: 'llm_output',
            prompt: prompt.substring(0, 1000) + (prompt.length > 1000 ? '...' : ''),
            response,
            metadata
        };

        const filename = `llm_output_${new Date().toISOString().split('T')[0]}.jsonl`;
        const logPath = path.join(this.logsPath, filename);

        await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
    }

    async logAnalysis(analysis: any): Promise<void> {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type: 'code_analysis',
            analysis
        };

        const filename = `analysis_${new Date().toISOString().split('T')[0]}.jsonl`;
        const logPath = path.join(this.logsPath, filename);

        await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
    }
}

// Main MVP Agent Class
export class MVPStandaloneAgent {
    private fileSystem: IFileSystem;
    private logger: ILogger;
    private copilotAPI: MVPCopilotAPI | null = null;
    private toolRegistry: ToolRegistry = new ToolRegistry();
    private config: MVPAgentConfig;

    constructor(workspacePath: string, config: MVPAgentConfig) {
        this.config = config;
        this.fileSystem = new ReadOnlyFileSystem(workspacePath);
        this.logger = new FileLogger(path.join(process.cwd(), 'logs'));
    }

    async initialize(): Promise<void> {
        console.log(`🤖 Initializing MVP Agent...`);
        console.log(`📁 Workspace: ${this.config.workspacePath}`);

        // Initialize Copilot API - prefer GitHub token over direct API key
        if (this.config.githubToken) {
            this.copilotAPI = await MVPCopilotAPI.createWithGitHubToken(this.config.githubToken);
            console.log(`🔗 Copilot API initialized via GitHub token`);
        } else if (this.config.copilotApiKey) {
            this.copilotAPI = new MVPCopilotAPI(this.config.copilotApiKey);
            console.log(`🔗 Copilot API initialized via API key`);
        }

        // Verify workspace exists
        if (!await this.fileSystem.exists(this.config.workspacePath)) {
            throw new Error(`Workspace path does not exist: ${this.config.workspacePath}`);
        }

        // Initialize readonly tools only
        await this.initializeReadOnlyTools();

        // Build initial workspace context
        const workspaceStructure = await this.fileSystem.getWorkspaceStructure();
        console.log(`📊 Workspace structure loaded (${workspaceStructure.length} characters)`);
        console.log(`🔧 Agent initialized with ${this.toolRegistry.size()} readonly tools`);
    }

    async analyzeWorkspace(customPrompt?: string): Promise<AgentResult> {
        // Read system prompt from input/system.txt
        let systemPrompt = await this.readFallbackSystemPrompt(); // fallback from file
        try {
            const systemPromptPath = path.join(process.cwd(), 'input', 'system.txt');
            if (await this.fileSystem.exists(systemPromptPath)) {
                systemPrompt = await this.fileSystem.readFile(systemPromptPath);
                systemPrompt = systemPrompt.trim();
                console.log(`📄 Using system prompt from input/system.txt ${systemPrompt.substring(0, 50)}...`);
            } else {
                console.log(`⚠️  input/system.txt not found, using fallback system prompt`);
            }
        } catch (error) {
            console.log(`⚠️  Error reading system prompt file, using fallback: ${error}`);
        }

        // Read prompt from input/prompt.txt if not provided
        let promptToUse = await this.readFallbackPrompt();
        if (!promptToUse) {
            try {
                const promptPath = path.join(process.cwd(), 'input', 'prompt.txt');
                if (await this.fileSystem.exists(promptPath)) {
                    promptToUse = await this.fileSystem.readFile(promptPath);
                    promptToUse = promptToUse.trim();
                    console.log(`📄 Using prompt from input/prompt.txt: ${promptToUse.substring(0, 50)}...`);
                } else {
                    promptToUse = await this.readFallbackPrompt();
                    console.log(`⚠️  input/prompt.txt not found, using fallback prompt`);
                }
            } catch (error) {
                promptToUse = await this.readFallbackPrompt();
                console.log(`⚠️  Error reading prompt file, using fallback: ${error}`);
            }
        }

        console.log(`\n🔍 Analyzing workspace: ${promptToUse}`);

        const startTime = Date.now();
        const toolCalls: ToolCall[] = [];
        let iterations = 0;
        let analysisData: any = {};

        try {
            // Build analysis prompt with workspace context
            const userPrompt = await this.buildUserPrompt(promptToUse);

            // Start analysis loop
            let currentResponse = await this.callCopilotAPI(userPrompt, systemPrompt);

            while (iterations < this.config.maxIterations) {
                iterations++;
                console.log(`\n📋 Iteration ${iterations}/${this.config.maxIterations}`);

                // Parse for tool calls
                const extractedToolCalls = this.extractToolCalls(currentResponse);

                if (extractedToolCalls.length === 0) {
                    // No more tool calls, extract analysis data from response
                    console.log(`📊 Analysis data extracted. extractedToolCalls.length === 0`);
                    //break;
                }

                // Execute tool calls
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
                        toolCalls.push(toolCall);

                        if (this.config.debugMode) {
                            console.log(`  Result:`, result);
                        }
                    } catch (error: any) {
                        console.error(`  Error executing tool ${toolCall.name}:`, error);
                        toolCall.result = { error: error.message };
                        toolCall.timestamp = new Date();
                        toolCalls.push(toolCall);
                    }
                }

                // Continue analysis with tool results
                const toolResultsPrompt = await this.buildToolResultsPrompt(extractedToolCalls);
                currentResponse = await this.callCopilotAPI(toolResultsPrompt, systemPrompt);
            }

            // Log the analysis results
            await this.logger.logAnalysis({
                prompt: promptToUse,
                analysisData,
                toolCalls,
                iterations,
                duration: Date.now() - startTime
            });

            const duration = Date.now() - startTime;
            console.log(`\n⏱️  Analysis completed in ${duration}ms`);

            return {
                success: true,
                response: currentResponse,
                analysisData,
                iterations
            };

        } catch (error: any) {
            console.error(`❌ Analysis failed:`, error);

            return {
                success: false,
                response: '',
                analysisData: {},
                iterations,
                error: error.message
            };
        }
    }

    private async initializeReadOnlyTools(): Promise<void> {
        // Initialize only readonly tools for MVP using the tool registry
        this.toolRegistry.initializeReadOnlyTools(this.fileSystem);
        console.log(`🔧 Initialized ${this.toolRegistry.size()} readonly tools`);
    }

    private async buildUserPrompt(request: string): Promise<string> {
        // Read user prompt template from external file
        let template = await this.readUserPromptTemplate();

        try {
            const templatePath = path.join(process.cwd(), 'input', 'user-prompt-template.txt');
            if (await this.fileSystem.exists(templatePath)) {
                template = await this.fileSystem.readFile(templatePath);
            }
        } catch (error) {
            console.log(`⚠️  Error reading user prompt template, using fallback: ${error}`);
        }

        // Gather data for template variables
        const workspaceStructure = await this.fileSystem.getWorkspaceStructure();
        const toolDescriptions = this.toolRegistry.getAll()
            .map((tool: ITool) => `${tool.name}: ${tool.description}`)
            .join('\n');

        // Replace template variables
        return template
            .replace('{{workspacePath}}', this.config.workspacePath)
            .replace('{{workspaceStructure}}', workspaceStructure)
            .replace('{{toolDescriptions}}', toolDescriptions)
            .replace('{{request}}', request);
    }

    private async buildToolResultsPrompt(toolCalls: ToolCall[]): Promise<string> {
        let template = await this.readToolResultsTemplate();

        try {
            const templatePath = path.join(process.cwd(), 'input', 'tool-results-template.txt');
            if (await this.fileSystem.exists(templatePath)) {
                template = await this.fileSystem.readFile(templatePath);
            }
        } catch (error) {
            console.log(`⚠️  Error reading tool results template, using fallback: ${error}`);
        }

        // Format tool results
        const results = toolCalls.map(call =>
            `Tool: ${call.name}\nArguments: ${JSON.stringify(call.arguments)}\nResult: ${JSON.stringify(call.result)}`
        ).join('\n\n');

        // Replace template variables
        return template.replace('{{results}}', results);
    }

    private async callCopilotAPI(prompt: string, systemPrompt?: string): Promise<string> {
        console.log(`🧠 Copilot API Call (${prompt.length} chars)`);

        // Use actual Copilot API if available, otherwise fallback to mock
        if (!this.copilotAPI) {
            throw new Error('Copilot API is not initialized.');
        }
        const response = await this.copilotAPI.callAPI(prompt, systemPrompt);

        // Log the LLM interaction
        await this.logger.logLLMOutput(prompt, response);

        return response;
    }

    private extractToolCalls(response: string): ToolCall[] {
        const toolCalls: ToolCall[] = [];

        // First, extract JSON from markdown code blocks if present
        const markdownJsonRegex = /```json\s*(\{[\s\S]*?\})\s*```/g;
        let markdownMatches;
        while ((markdownMatches = markdownJsonRegex.exec(response)) !== null) {
            try {
                const jsonString = markdownMatches[1];
                const parsed = JSON.parse(jsonString);
                if (parsed.tool_call && parsed.tool_call.name) {
                    toolCalls.push({
                        name: parsed.tool_call.name,
                        arguments: parsed.tool_call.arguments || {},
                        result: null,
                        timestamp: new Date()
                    });
                }
            } catch (error) {
                console.warn(`Failed to parse markdown JSON tool call: ${markdownMatches[1]}`);
                console.warn(`Error: ${error}`);
            }
        }

        // If no markdown blocks found, try raw JSON extraction
        if (toolCalls.length === 0) {
            const toolCallRegex = /\{\s*"tool_call"\s*:\s*\{[^}]*\}\s*\}/g;
            const matches = response.match(toolCallRegex);

            if (matches) {
                for (const match of matches) {
                    try {
                        const parsed = JSON.parse(match);
                        if (parsed.tool_call && parsed.tool_call.name) {
                            toolCalls.push({
                                name: parsed.tool_call.name,
                                arguments: parsed.tool_call.arguments || {},
                                result: null,
                                timestamp: new Date()
                            });
                        }
                    } catch (error) {
                        console.warn(`Failed to parse raw JSON tool call: ${match}`);
                        console.warn(`Error: ${error}`);
                    }
                }
            }
        }

        return toolCalls;
    }

    private async readFallbackSystemPrompt(): Promise<string> {
        return "You are an AI assistant.";
    }

    private async readFallbackPrompt(): Promise<string> {
        return "analyze code";
    }

    private async readUserPromptTemplate(): Promise<string> {
        return "WORKSPACE: {{workspacePath}}\nSTRUCTURE: {{workspaceStructure}}\nTOOLS: {{toolDescriptions}}\nREQUEST: {{request}}";
    }

    private async readToolResultsTemplate(): Promise<string> {
        return "Results: {{results}}";
    }
}

// Default MVP configuration
export const defaultMVPConfig: MVPAgentConfig = {
    workspacePath: process.cwd(),
    maxIterations: 10,
    debugMode: false
};
