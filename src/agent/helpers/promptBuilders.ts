import type { MVPAgentConfig, ToolCall } from "../interfaces";
import { IFileSystem } from "../../tools";

export async function buildUserPrompt(
  config: MVPAgentConfig,
  fileSystem: IFileSystem,
  request: string,
): Promise<string> {
  const template = `ANALYSIS REQUEST: {{request}}
AVAILABLE TOOLS:
{{toolDescriptions}}
WORKSPACE CONTEXT:
Working Directory: {{workspacePath}}
Workspace Structure: {{workspaceStructure}}`;

  const workspaceStructure = await fileSystem.getWorkspaceStructure(2000, 1);
  const toolDescriptions = config.toolRegistry
    .getAll()
    .map((tool) => `${tool.name}: ${tool.description}`)
    .join("\n");

  return template
    .replace("{{workspacePath}}", config.workspacePath)
    .replace("{{workspaceStructure}}", workspaceStructure)
    .replace("{{toolDescriptions}}", toolDescriptions)
    .replace("{{request}}", request);
}

export async function buildToolResultsPrompt(
  toolCalls: any[],
): Promise<string> {
  const template = `Tool execution results:
{{results}}
Continue your analysis based on these results.
If you have enough information, provide a comprehensive summary of your findings.`;

  const results = toolCalls
    .map(
      (call) =>
        `Tool: ${call.name}\nArguments: ${JSON.stringify(
          call.arguments,
        )}\nResult: ${JSON.stringify(call.result)}`,
    )
    .join("\n\n");

  return template.replace("{{results}}", results);
}
