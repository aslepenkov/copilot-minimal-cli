import fs from 'fs/promises';
import path from 'path';
import { DirectoryStructure, SourceConfig, SourceFile } from '../../types';
import { Source } from './sourceInterface';

/**
 * Implementation of Source interface for local file system
 */
export class LocalFileSource implements Source {
  private basePath: string = '';
  
  async initialize(config: SourceConfig): Promise<void> {
    this.basePath = config.location;
    
    try {
      // Check if the path exists
      await fs.access(this.basePath);
    } catch (error) {
      throw new Error(`Invalid source location: ${this.basePath}`);
    }
  }
  
  async getFiles(): Promise<SourceFile[]> {
    const files: SourceFile[] = [];
    
    // Helper function to recursively scan directories
    const scanDirectory = async (dir: string, rootPath: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(rootPath, fullPath);
        
        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          await scanDirectory(fullPath, rootPath);
        } else if (entry.isFile()) {
          try {
            // Read file content
            const content = await fs.readFile(fullPath, 'utf-8');
            
            // Add to files array
            files.push({
              path: relativePath,
              content,
              metadata: {
                size: (await fs.stat(fullPath)).size,
                lastModified: (await fs.stat(fullPath)).mtime
              }
            });
          } catch (error) {
            console.warn(`Error reading file ${fullPath}: ${error}`);
          }
        }
      }
    };
    
    // Start scanning from the base path
    await scanDirectory(this.basePath, this.basePath);
    
    return files;
  }
  
  async getStructure(): Promise<DirectoryStructure> {
    // Helper function to build directory structure recursively
    const buildStructure = async (dir: string, name: string): Promise<DirectoryStructure> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const children: DirectoryStructure[] = [];
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively build structure for subdirectories
          const subDir = await buildStructure(fullPath, entry.name);
          children.push(subDir);
        } else if (entry.isFile()) {
          // Add file to structure
          children.push({
            name: entry.name,
            type: 'file'
          });
        }
      }
      
      return {
        name,
        type: 'directory',
        children
      };
    };
    
    // Get the base directory name
    const baseName = path.basename(this.basePath);
    
    // Build the structure starting from the base path
    return await buildStructure(this.basePath, baseName);
  }
}
