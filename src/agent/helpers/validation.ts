import type { IFileSystem } from "../../tools";

export async function validateWorkspace(
  fileSystem: IFileSystem,
  workspacePath: string,
): Promise<void> {
  if (!(await fileSystem.exists(workspacePath))) {
    throw new Error(`Workspace path does not exist: ${workspacePath}`);
  }
}
