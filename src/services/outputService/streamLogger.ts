import fs from 'fs/promises';
import path from 'path';
import { OutputFile } from '../../types';
import { OutputHandler } from './outputInterface';

/**
 * Handles logging of stream output from Copilot
 */
export class StreamLogger implements OutputHandler {
  constructor(private basePath: string) {}

  async handleStreamOutput(text: string, contextName: string): Promise<void> {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(this.basePath, 'logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    // Create context directory if it doesn't exist
    const contextDir = path.join(logsDir, contextName);
    await fs.mkdir(contextDir, { recursive: true });
    
    // Write to log file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(contextDir, `log-${timestamp}.md`);
    
    await fs.writeFile(logFile, text, 'utf-8');
    
    // Also log to console
    console.log(`[${contextName}] Response logged to: ${logFile}`);
  }

  async handleFileOutput(files: OutputFile[], contextName: string): Promise<void> {
    // Stream logger doesn't handle file output
    return;
  }
}
