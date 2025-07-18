import type { ToolCall } from "../interfaces";

export function ExtractToolCalls(response: string): ToolCall[] {
  const jsonRegex = /\{[\s\S]*\}/g;
  const matches = response.match(jsonRegex) || [];

  return matches
    .map((match) => {
      try {
        const parsed = JSON.parse(match);
        return parsed.tool_call;
      } catch {
        console.error("Invalid JSON object:", match);
        return null;
      }
    })
    .filter(Boolean) as ToolCall[];
}
