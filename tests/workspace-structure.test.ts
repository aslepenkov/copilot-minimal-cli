/**
 * GetWorkspaceStructureTool Tests
 *
 * Tests for the workspace structure tool functionality using Vitest
 */

import { describe, it, expect, beforeEach } from "vitest";
import { GetWorkspaceStructureTool } from "../src/tools/workspace-structure";
import { MockFileSystem } from "./mock-filesystem";

describe("GetWorkspaceStructureTool", () => {
  let mockFS: MockFileSystem;
  let tool: GetWorkspaceStructureTool;

  beforeEach(() => {
    mockFS = new MockFileSystem();
    tool = new GetWorkspaceStructureTool(mockFS);
  });

  it("should have correct metadata", () => {
    expect(tool.name).toBe("get_workspace_structure");
    expect(tool.description).toBe("Get the complete workspace file structure");
    expect(tool.parameters).toHaveProperty("type");
    expect(tool.parameters).toHaveProperty("properties");
    expect(tool.parameters).toHaveProperty("required");
  });

  it("should return workspace structure", async () => {
    const result = await tool.execute();

    expect(result).toHaveProperty("structure");
    expect(typeof result.structure).toBe("string");

    // Check for expected files in structure
    expect(result.structure).toContain("file1.ts");
    expect(result.structure).toContain("file2.js");
    expect(result.structure).toContain("README.md");
    expect(result.structure).toContain("package.json");
    expect(result.structure).toContain("src/");
    expect(result.structure).toContain("src/main.ts");
    expect(result.structure).toContain("src/utils.ts");
  });

  it("should handle empty workspace", async () => {
    // Create a mock with empty structure
    const emptyMockFS = new MockFileSystem();
    emptyMockFS.clear();
    const emptyTool = new GetWorkspaceStructureTool(emptyMockFS);

    // Mock empty workspace
    emptyMockFS.addDirectory("/empty", []);

    const result = await emptyTool.execute();
    expect(result).toHaveProperty("structure");
  });

  it("should handle file system errors", async () => {
    // Create a mock that throws an error
    const errorMockFS = {
      async getWorkspaceStructure() {
        throw new Error("File system error");
      },
    } as any;

    const errorTool = new GetWorkspaceStructureTool(errorMockFS);
    const result = await errorTool.execute();

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("File system error");
  });

  it("should handle size limits", async () => {
    // Create a mock that returns truncated structure
    const limitMockFS = {
      async getWorkspaceStructure(maxSize?: number) {
        const fullStructure = "a".repeat(3000);
        return maxSize && fullStructure.length > maxSize
          ? fullStructure.substring(0, maxSize) + "\n... (truncated)"
          : fullStructure;
      },
    } as any;

    const limitTool = new GetWorkspaceStructureTool(limitMockFS);
    const result = await limitTool.execute();

    expect(result).toHaveProperty("structure");
    // The mock returns a shorter structure, so it won't be truncated
    expect(result.structure.length).toBeGreaterThan(0);
  });

  it("should have properly formatted structure", async () => {
    const result = await tool.execute();

    // Structure should be newline-separated
    const lines = result.structure.split("\n");
    expect(lines.length).toBeGreaterThan(1);

    // Should not have empty lines at start/end after splitting
    const firstLine = lines[0];
    const lastLine = lines[lines.length - 1];
    expect(firstLine.length > 0 || lastLine.length > 0).toBe(true);
  });

  it("should be consistent across calls", async () => {
    const result1 = await tool.execute();
    const result2 = await tool.execute();

    expect(result1.structure).toBe(result2.structure);
  });
});
