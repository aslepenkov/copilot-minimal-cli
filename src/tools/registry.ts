/**
 * Tool Registry
 *
 * Central registry for managing and organizing tools
 */

import { ITool, IFileSystem } from "./interfaces";
import { ReadFileTool } from "./read-file";
import { ListDirectoryTool } from "./list-directory";
import { GetWorkspaceStructureTool } from "./workspace-structure";
import { FindCodeFilesTool } from "./find-files";
import { FinishAnalyzeTool } from "./finish-analyze";
import { SaveDocumentTool } from "./save-document";

export class ToolRegistry {
    private tools: Map<string, ITool> = new Map();

    register(tool: ITool): void {
        this.tools.set(tool.name, tool);
    }

    get(name: string): ITool | undefined {
        return this.tools.get(name);
    }

    getAll(): ITool[] {
        return Array.from(this.tools.values());
    }

    size(): number {
        return this.tools.size;
    }

    initializeReadOnlyTools(fileSystem: IFileSystem): void {
        this.register(new ReadFileTool(fileSystem));
        this.register(new ListDirectoryTool(fileSystem));
        this.register(new GetWorkspaceStructureTool(fileSystem));
        this.register(new FindCodeFilesTool(fileSystem));
        this.register(new FinishAnalyzeTool());
        this.register(new SaveDocumentTool());
    }
}
