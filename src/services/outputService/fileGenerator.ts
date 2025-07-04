import fs from 'fs/promises';
import path from 'path';
import { OutputFile } from '../../types';
import { OutputHandler } from './outputInterface';

/**
 * Handles generating files from Copilot output
 */
export class FileGenerator implements OutputHandler {
  constructor(private basePath: string) {}

  async handleStreamOutput(text: string, contextName: string): Promise<void> {
    // File generator doesn't handle stream output
    return;
  }

  async handleFileOutput(files: OutputFile[], contextName: string): Promise<void> {
    if (!files || files.length === 0) {
      return;
    }
    
    // Create files directory if it doesn't exist
    const filesDir = path.join(this.basePath, 'files', contextName);
    await fs.mkdir(filesDir, { recursive: true });
    
    // Write each file
    for (const file of files) {
      const fullPath = path.join(filesDir, file.path);
      
      // Create directory for the file if needed
      const dirname = path.dirname(fullPath);
      await fs.mkdir(dirname, { recursive: true });
      
      // Write the file
      await fs.writeFile(fullPath, file.content, 'utf-8');
      console.log(`[${contextName}] Generated file: ${file.path}`);
    }
  }
}
