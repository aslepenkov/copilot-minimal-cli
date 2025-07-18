import type { ToolRegistry } from "../../tools";
import type { ToolCall } from "../interfaces";

export async function executeToolCalls(
  extractedToolCalls: ToolCall[],
  toolRegistry: ToolRegistry,
  allToolCalls: ToolCall[],
): Promise<void> {
  for (const toolCall of extractedToolCalls) {
    console.log(`🔧 Executing tool: ${toolCall.name}`);
    const tool = toolRegistry.get(toolCall.name);

    if (!tool) {
      console.error(`Tool not found: ${toolCall.name}`);
      toolCall.result = { error: "Tool not found" };
      allToolCalls.push(toolCall);
      continue;
    }

    try {
      const result = await tool.execute(toolCall.arguments);
      toolCall.result = result;
      toolCall.timestamp = new Date();
      allToolCalls.push(toolCall);
    } catch (error) {
      console.error(`Error executing tool ${toolCall.name}:`, error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toolCall.result = { error: errorMessage };
      toolCall.timestamp = new Date();
      allToolCalls.push(toolCall);
    }
  }
}
