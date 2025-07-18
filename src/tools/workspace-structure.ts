/**
 * Workspace Structure Tool
 *
 * Provides complete workspace file structure overview
 */

import { ITool, IFileSystem } from "./interfaces";

export class GetWorkspaceStructureTool implements ITool {
    name = "get_workspace_structure";
    description = "Get the complete workspace file structure";
    parameters = {
        type: "object",
        properties: {},
        required: [],
    };

    constructor(private fileSystem: IFileSystem) {}

    async execute(): Promise<any> {
        try {
            const structure = await this.fileSystem.getWorkspaceStructure();
            return { structure };
        } catch (error: any) {
            return { error: error.message };
        }
    }
}
