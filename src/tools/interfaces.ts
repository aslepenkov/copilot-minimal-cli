/**
 * Core interfaces for tools
 */

export interface ITool {
  name: string;
  description: string;
  parameters: any;
  execute(args: any): Promise<any>;
}

export interface IFileSystem {
  readFile(filePath: string): Promise<string>;
  listDirectory(dirPath: string): Promise<string[]>;
  exists(filePath: string): Promise<boolean>;
  getWorkspaceStructure(maxSize?: number, maxDepth?: number): Promise<string>;
}
