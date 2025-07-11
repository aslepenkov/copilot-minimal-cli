/**
 * Core interfaces for tools
 */

// Tool interface
export interface ITool {
    name: string;
    description: string;
    parameters: any;
    execute(args: any): Promise<any>;
}

// File System interface for tools
export interface IFileSystem {
    readFile(filePath: string): Promise<string>;
    listDirectory(dirPath: string): Promise<string[]>;
    exists(filePath: string): Promise<boolean>;
    getWorkspaceStructure(maxSize?: number): Promise<string>;
}
