/**
 * Application configuration
 */
export const config = {
  // API settings
  api: {
    /** Model to use for Copilot API requests */
    model: 'gpt-4',
    /** Maximum number of tokens for API responses */
    maxTokens: 1000,
    /** Temperature for API requests (0.0-1.0) */
    temperature: 0.7,
  },
  
  // Path settings
  paths: {
    /** Input directory for sample projects */
    input: 'input',
    /** Output directory for generated files and logs */
    output: 'output',
    /** Prompt directory paths */
    prompts: {
      /** General prompts that apply to all contexts */
      general: 'prompts/general',
      /** Context-specific prompts */
      specific: 'prompts/specific',
    },
  },
  
  // Default names
  defaults: {
    /** Default general prompt filename */
    generalPrompt: 'base.txt',
    /** Default specific prompt filename */
    specificPrompt: 'default.txt',
  },
};
