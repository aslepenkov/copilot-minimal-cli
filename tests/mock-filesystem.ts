/**
 * Mock File System for Testing
 * 
 * Provides a mock implementation of IFileSystem for unit testing tools
 */

import { IFileSystem } from '../src/tools/interfaces';

export class MockFileSystem implements IFileSystem {
    private files: Map<string, string> = new Map();
    private directories: Map<string, string[]> = new Map();

    constructor() {
        this.setupDefaultStructure();
    }

    // Setup some default test data
    private setupDefaultStructure(): void {
        // Mock files
        this.files.set('/test/file1.ts', 'console.log("Hello World");');
        this.files.set('/test/file2.js', 'function test() { return 42; }');
        this.files.set('/test/README.md', '# Test Project\nThis is a test project.');
        this.files.set('/test/package.json', '{"name": "test-project", "version": "1.0.0"}');
        this.files.set('/test/src/main.ts', 'export function main() { console.log("Main"); }');
        this.files.set('/test/src/utils.ts', 'export const CONSTANT = "test";');

        // Mock directories
        this.directories.set('/test', ['file1.ts', 'file2.js', 'README.md', 'package.json', 'src']);
        this.directories.set('/test/src', ['main.ts', 'utils.ts']);
        this.directories.set('/test/empty', []);
    }

    async readFile(filePath: string): Promise<string> {
        const content = this.files.get(filePath);
        if (content === undefined) {
            throw new Error(`File not found: ${filePath}`);
        }
        return content;
    }

    async listDirectory(dirPath: string): Promise<string[]> {
        const entries = this.directories.get(dirPath);
        if (entries === undefined) {
            throw new Error(`Directory not found: ${dirPath}`);
        }
        return [...entries]; // Return a copy
    }

    async exists(filePath: string): Promise<boolean> {
        return this.files.has(filePath) || this.directories.has(filePath);
    }

    async getWorkspaceStructure(maxSize: number = 2000): Promise<string> {
        const structure = [
            'file1.ts',
            'file2.js', 
            'README.md',
            'package.json',
            'src/',
            'src/main.ts',
            'src/utils.ts'
        ].join('\n');

        return structure.length > maxSize ? 
            structure.substring(0, maxSize) + '\n... (truncated)' : 
            structure;
    }

    // Helper methods for testing
    addFile(path: string, content: string): void {
        this.files.set(path, content);
    }

    addDirectory(path: string, entries: string[]): void {
        this.directories.set(path, entries);
    }

    removeFile(path: string): void {
        this.files.delete(path);
    }

    removeDirectory(path: string): void {
        this.directories.delete(path);
    }

    clear(): void {
        this.files.clear();
        this.directories.clear();
    }
}
