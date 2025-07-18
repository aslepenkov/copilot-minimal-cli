/**
 * Find Files Tool
 *
 * Discovers all files in the workspace with filtering capabilities
 */

import * as path from "path";
import { ITool, IFileSystem } from "./interfaces";

export class FindCodeFilesTool implements ITool {
    name = "find_all_files";
    description = "Find all files in the workspace";
    parameters = {
        type: "object",
        properties: {},
        required: [],
    };

    constructor(private fileSystem: IFileSystem) {}

    async execute(args: { extensions?: string[] }): Promise<any> {
        try {
            // This is a simplified implementation
            // In practice, you'd recursively search through directories
            const structure = await this.fileSystem.getWorkspaceStructure();
            const lines = structure.split("\n");
            const exclusions = [
                "bin",
                "obj",
                "node_modules",
                "dist",
                "build",
                "__pycache__",
                "logs",
            ];
            const codeFiles = lines.filter((line) => {
                const trimmed = line.trim();
                if (!trimmed) return false;
                const parts = trimmed.split(path.sep);
                // Exclude any line containing a folder in the exclusions array
                if (exclusions.some((ex) => parts.includes(ex))) return false;
                return true;
            });

            return {
                codeFiles,
                count: codeFiles.length,
            };
        } catch (error: any) {
            return { error: error.message };
        }
    }
}
