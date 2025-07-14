/**
 * Agent Core Interfaces
 * 
 * Defines contracts for agent configuration and results
 */

export interface MVPAgentConfig {
    workspacePath: string;
    copilotApiKey?: string;
    githubToken?: string;
    maxIterations: number;
    debugMode: boolean;
}

export interface AgentResult {
    success: boolean;
    response: string;
    analysisData: any;
    iterations: number;
    error?: string;
}

export interface ToolCall {
    name: string;
    arguments: any;
    result: any;
    timestamp: Date;
}

export const DEFAULT_CONFIG: MVPAgentConfig = {
    workspacePath: process.cwd(),
    maxIterations: 10,
    debugMode: false
};
