/**
 * Read-Only File System Implementation
 *
 * Provides safe, read-only access to the file system with workspace structure analysis
 */

import * as path from "path";
import fs from "fs-extra";
import { IFileSystem } from "../../tools/interfaces";

export class ReadOnlyFileSystem implements IFileSystem {
  private readonly workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  async readFile(filePath: string): Promise<string> {
    const absolutePath = this.resolvePath(filePath);
    return await fs.readFile(absolutePath, "utf-8");
  }

  async listDirectory(dirPath: string): Promise<string[]> {
    const absolutePath = this.resolvePath(dirPath);
    return await fs.readdir(absolutePath);
  }

  async exists(filePath: string): Promise<boolean> {
    const absolutePath = this.resolvePath(filePath);
    return await fs.pathExists(absolutePath);
  }

  async getWorkspaceStructure(
    maxSize: number = 2000,
    maxDepth = 10,
  ): Promise<string> {
    return this.buildDirectoryTree(this.workspacePath, 0, maxSize, maxDepth);
  }

  private resolvePath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.resolve(this.workspacePath, filePath);
  }

  private async buildDirectoryTree(
    dirPath: string,
    depth: number = 0,
    maxSize: number,
    maxDepth: number = 10, // Max depth to prevent infinite recursion
  ): Promise<string> {
    let result = "";

    // Stop recursion if maxDepth is reached
    if (depth > maxDepth) {
      return result;
    }

    try {
      // Read entries in the directory
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      // Sort entries (directories first, then files)
      const sortedEntries = this.sortDirectoryEntries(entries);

      for (const entry of sortedEntries) {
        if (this.shouldSkipEntry(entry.name)) {
          continue; // Skip files and folders that should be ignored
        }

        const entryPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.workspacePath, entryPath);

        // Add the current entry (directory or file) to the result
        result += entry.isDirectory()
          ? `${relativePath}/\n`
          : `${relativePath}\n`;

        // Check if result exceeds maxSize and truncate if necessary
        if (result.length > maxSize) {
          return (
            result.slice(0, maxSize) + "\n... (truncated due to size limit)"
          );
        }

        // Recursively process subdirectories
        if (entry.isDirectory()) {
          const subTree = await this.buildDirectoryTree(
            entryPath,
            depth + 1,
            maxSize,
            maxDepth,
          );

          result += subTree;

          // Check again for size limit after processing subtree
          if (result.length > maxSize) {
            return (
              result.slice(0, maxSize) + "\n... (truncated due to size limit)"
            );
          }
        }
      }
    } catch (error) {
      // Handle cases where the directory is inaccessible (e.g., permissions issues)
      result += `Error reading directory: ${dirPath}\n`;
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
      "bin",
      "obj",
      "node_modules",
      "dist",
      "build",
      "__pycache__",
      "logs",
    ];

    return entryName.startsWith(".") || skipPatterns.includes(entryName);
  }
}
