/**
 * Logging Infrastructure
 *
 * Handles structured logging for LLM interactions and analysis results
 */

import * as path from "path";
import fs from "fs-extra";

export interface ILogger {
    logLLMOutput(
        prompt: string,
        response: string,
        metadata?: any,
    ): Promise<void>;
    logAnalysis(analysis: any): Promise<void>;
}

export interface LogEntry {
    timestamp: string;
    type: string;
    [key: string]: any;
}

export class FileLogger implements ILogger {
    private readonly logsPath: string;

    constructor(logsPath: string) {
        this.logsPath = logsPath;
        this.ensureLogsDirectory();
    }

    async logLLMOutput(
        prompt: string,
        response: string,
        metadata: any = {},
    ): Promise<void> {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            type: "llm_output",
            prompt: this.truncateText(prompt, 1000),
            response,
            metadata,
        };

        const filename = this.generateFilename("llm_output");
        await this.writeLogEntry(filename, logEntry);
    }

    async logAnalysis(analysis: any): Promise<void> {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            type: "code_analysis",
            analysis,
        };

        const filename = this.generateFilename("analysis");
        await this.writeLogEntry(filename, logEntry);
    }

    private async ensureLogsDirectory(): Promise<void> {
        await fs.ensureDir(this.logsPath);
    }

    private truncateText(text: string, maxLength: number): string {
        return text.length > maxLength
            ? text.substring(0, maxLength) + "..."
            : text;
    }

    private generateFilename(prefix: string): string {
        const date = new Date().toISOString().split("T")[0];
        return `${prefix}_${date}.jsonl`;
    }

    private async writeLogEntry(
        filename: string,
        logEntry: LogEntry,
    ): Promise<void> {
        const logPath = path.join(this.logsPath, filename);
        await fs.appendFile(logPath, JSON.stringify(logEntry) + "\n");
    }
}
