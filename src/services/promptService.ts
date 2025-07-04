import fs from 'fs/promises';
import path from 'path';
import { PromptConfig } from '../types';
import { logger } from '../utils';
import { config } from '../config';

/**
 * Service for handling prompt reading and combining
 */
export class PromptService {
  /** Cache for general prompts to avoid repeated disk reads */
  private generalPromptCache: Map<string, string> = new Map();
  
  /** Cache for specific prompts to avoid repeated disk reads */
  private specificPromptCache: Map<string, string> = new Map();
  
  /**
   * Creates a new PromptService instance
   * 
   * @param basePath - Base path for the application
   */
  constructor(private basePath: string) {}
  
  /**
   * Builds a complete prompt by combining general and specific prompts
   * 
   * @param promptConfig - Configuration for prompt generation
   * @returns Combined prompt string
   */
  async buildPrompt(promptConfig: PromptConfig): Promise<string> {
    // Determine the general prompt path
    const generalPromptPath = promptConfig.generalPromptPath || 
      path.join(this.basePath, config.paths.prompts.general, config.defaults.generalPrompt);
    
    // Determine the specific prompt path
    let specificPromptPath = promptConfig.specificPromptPath;
    
    if (!specificPromptPath) {
      // Look for a prompt matching the context name
      const contextSpecificPath = path.join(
        this.basePath, 
        config.paths.prompts.specific, 
        `${promptConfig.contextName}.txt`
      );
      
      try {
        await fs.access(contextSpecificPath);
        specificPromptPath = contextSpecificPath;
      } catch {
        // Use default if context-specific not found
        specificPromptPath = path.join(
          this.basePath, 
          config.paths.prompts.specific, 
          config.defaults.specificPrompt
        );
      }
    }
    
    // Get general prompt (with caching)
    let generalPrompt = this.generalPromptCache.get(generalPromptPath) || '';
    if (!generalPrompt) {
      try {
        generalPrompt = await fs.readFile(generalPromptPath, 'utf-8');
        this.generalPromptCache.set(generalPromptPath, generalPrompt);
      } catch (error) {
        logger.error(`Failed to read general prompt from ${generalPromptPath}`, error);
        generalPrompt = 'You are an AI assistant helping with code generation.';
      }
    }
    
    // Get specific prompt (with caching)
    let specificPrompt = specificPromptPath ? this.specificPromptCache.get(specificPromptPath) || '' : '';
    if (specificPromptPath && !specificPrompt) {
      try {
        specificPrompt = await fs.readFile(specificPromptPath, 'utf-8');
        this.specificPromptCache.set(specificPromptPath, specificPrompt);
      } catch (error) {
        logger.error(`Failed to read specific prompt from ${specificPromptPath}`, error);
        specificPrompt = '';
      }
    }
    
    // Combine prompts
    return `${generalPrompt}\n\n${specificPrompt}`.trim();
  }
}
