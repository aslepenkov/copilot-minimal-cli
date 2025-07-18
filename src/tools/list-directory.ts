/**
 * List Directory Tool
 *
 * Lists contents of directories for workspace exploration
 */

import { ITool, IFileSystem } from "./interfaces";

export class ListDirectoryTool implements ITool {
  name = "list_directory";
  description = "List the contents of a directory";
  parameters = {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path to the directory to list",
      },
    },
    required: ["path"],
  };

  constructor(private fileSystem: IFileSystem) {}

  async execute(args: { path: string }): Promise<any> {
    try {
      const entries = await this.fileSystem.listDirectory(args.path);
      return { entries, count: entries.length };
    } catch (error: any) {
      return { error: error.message };
    }
  }
}
