import { OutputFile } from '../types';

/**
 * Parses a Copilot response to extract file content
 * Extracts files marked with markdown code blocks with file paths
 * 
 * @param response - The raw text response from Copilot
 * @returns Array of OutputFile objects
 */
export function parseResponseForFiles(response: string): OutputFile[] {
  const files: OutputFile[] = [];
  
  // Regular expression to match markdown code blocks with file paths
  // Format: ```[language]\n// filepath: [path]\n[content]\n```
  const fileRegex = /```(?:\w+)?\s*\n\/\/\s*filepath:\s*([^\n]+)\s*\n([\s\S]*?)```/g;
  
  let match;
  while ((match = fileRegex.exec(response)) !== null) {
    const [_, filePath, content] = match;
    
    if (filePath && content) {
      // Clean up the file path (remove leading/trailing whitespace and quotes)
      const cleanPath = filePath.trim().replace(/^['"]|['"]$/g, '');
      
      // Add to files array
      files.push({
        path: cleanPath,
        content: content.trim()
      });
    }
  }
  
  return files;
}
