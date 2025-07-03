import { OutputFile } from '../../types';

/**
 * Interface for output handlers that process Copilot responses
 */
export interface OutputHandler {
  /**
   * Handle streaming text output from Copilot
   * 
   * @param text - The raw text response from Copilot
   * @param contextName - The name of the context (project/folder)
   */
  handleStreamOutput(text: string, contextName: string): Promise<void>;
  
  /**
   * Handle file generation output from Copilot
   * 
   * @param files - Array of files to be generated
   * @param contextName - The name of the context (project/folder)
   */
  handleFileOutput(files: OutputFile[], contextName: string): Promise<void>;
}
