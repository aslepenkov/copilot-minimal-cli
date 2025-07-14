/**
 * Read-Only File System Implementation
 * 
 * Provides safe, read-only access to the file system with workspace structure analysis
 */

import * as path from 'path';
import fs from 'fs-extra';
import { IFileSystem } from '../../tools/interfaces';

export class ReadOnlyFileSystem implements IFileSystem {
    private readonly workspacePath: string;

    constructor(workspacePath: string) {
        this.workspacePath = workspacePath;
    }

    async readFile(filePath: string): Promise<string> {
        const absolutePath = this.resolvePath(filePath);
        return await fs.readFile(absolutePath, 'utf-8');
    }

    async listDirectory(dirPath: string): Promise<string[]> {
        const absolutePath = this.resolvePath(dirPath);
        return await fs.readdir(absolutePath);
    }

    async exists(filePath: string): Promise<boolean> {
        const absolutePath = this.resolvePath(filePath);
        return await fs.pathExists(absolutePath);
    }

    async getWorkspaceStructure(maxSize: number = 2000): Promise<string> {
        return this.buildDirectoryTree(this.workspacePath, '', 0, maxSize);
    }

    private resolvePath(filePath: string): string {
        if (path.isAbsolute(filePath)) {
            return filePath;
        }
        return path.resolve(this.workspacePath, filePath);
    }

    private async buildDirectoryTree(
        dirPath: string,
        prefix: string = '',
        depth: number = 0,
        maxSize: number
    ): Promise<string> {
        if (prefix.length > maxSize) {
            return prefix + '\n... (truncated due to size limit)';
        }

        if (depth > 10) { // Prevent infinite recursion
            return prefix;
        }

        let result = '';
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            const sortedEntries = this.sortDirectoryEntries(entries);

            for (const entry of sortedEntries) {
                if (this.shouldSkipEntry(entry.name)) {
                    continue;
                }

                const entryPath = path.join(dirPath, entry.name);
                const relativePath = path.relative(this.workspacePath, entryPath);

                if (entry.isDirectory()) {
                    result += `${relativePath}/\n`;
                    const subTree = await this.buildDirectoryTree(
                        entryPath,
                        result,
                        depth + 1,
                        maxSize
                    );
                    result = subTree;
                } else {
                    result += `${relativePath}\n`;
                }

                if (result.length > maxSize) {
                    return result + '... (truncated due to size limit)';
                }
            }
        } catch (error) {
            // Skip directories that can't be read
        }

        return result;
    }

    private sortDirectoryEntries(entries: any[]): any[] {
        return entries.sort((a: any, b: any) => {
            // Directories first, then files
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
        });
    }

    private shouldSkipEntry(entryName: string): boolean {
        const skipPatterns = [
            'bin', 'obj', 'node_modules', 'dist', 'build', '__pycache__', 'logs'
        ];
        
        return entryName.startsWith('.') || skipPatterns.includes(entryName);
    }
}
