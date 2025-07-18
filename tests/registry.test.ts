/**
 * ToolRegistry Tests
 *
 * Tests for the tool registry functionality using Vitest
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ToolRegistry } from "../src/tools/registry";
import { ReadFileTool } from "../src/tools/read-file";
import { ListDirectoryTool } from "../src/tools/list-directory";
import { ITool } from "../src/tools/interfaces";
import { MockFileSystem } from "./mock-filesystem";

describe("ToolRegistry", () => {
  let registry: ToolRegistry;
  let mockFS: MockFileSystem;

  beforeEach(() => {
    registry = new ToolRegistry();
    mockFS = new MockFileSystem();
  });

  it("should start empty", () => {
    expect(registry.size()).toBe(0);
    expect(registry.getAll().length).toBe(0);
  });

  it("should register tools", () => {
    const readTool = new ReadFileTool(mockFS);

    registry.register(readTool);

    expect(registry.size()).toBe(1);
    expect(registry.get("read_file")).toBe(readTool);
    expect(registry.getAll()).toContain(readTool);
  });

  it("should handle multiple tools", () => {
    const readTool = new ReadFileTool(mockFS);
    const listTool = new ListDirectoryTool(mockFS);

    registry.register(readTool);
    registry.register(listTool);

    expect(registry.size()).toBe(2);
    expect(registry.get("read_file")).toBe(readTool);
    expect(registry.get("list_directory")).toBe(listTool);

    const allTools = registry.getAll();
    expect(allTools).toContain(readTool);
    expect(allTools).toContain(listTool);
  });

  it("should override existing tools", () => {
    const readTool1 = new ReadFileTool(mockFS);
    const readTool2 = new ReadFileTool(mockFS);

    registry.register(readTool1);
    expect(registry.get("read_file")).toBe(readTool1);

    registry.register(readTool2);
    expect(registry.get("read_file")).toBe(readTool2);
    expect(registry.size()).toBe(1); // Should still be 1
  });

  it("should return undefined for unknown tools", () => {
    expect(registry.get("unknown_tool")).toBeUndefined();
  });

  it("should initialize readonly tools", () => {
    registry.initializeReadOnlyTools(mockFS);

    expect(registry.size()).toBe(6);

    // Check all expected tools are registered
    expect(registry.get("read_file")).toBeDefined();
    expect(registry.get("list_directory")).toBeDefined();
    expect(registry.get("get_workspace_structure")).toBeDefined();
    expect(registry.get("find_all_files")).toBeDefined();
    expect(registry.get("finish_analyze")).toBeDefined();
    expect(registry.get("save_document")).toBeDefined();

    // Verify tools are properly instantiated
    const readTool = registry.get("read_file");
    expect(readTool).toBeInstanceOf(ReadFileTool);
  });

  it("should handle custom tools", async () => {
    // Create a custom tool
    const customTool: ITool = {
      name: "custom_tool",
      description: "A custom test tool",
      parameters: { type: "object", properties: {}, required: [] },
      async execute() {
        return { message: "custom tool executed" };
      },
    };

    registry.register(customTool);

    expect(registry.size()).toBe(1);
    expect(registry.get("custom_tool")).toBe(customTool);

    const result = await customTool.execute({});
    expect(result.message).toBe("custom tool executed");
  });

  it("should return array copy from getAll", () => {
    const readTool = new ReadFileTool(mockFS);
    registry.register(readTool);

    const tools1 = registry.getAll();
    const tools2 = registry.getAll();

    // Should be different array instances
    expect(tools1).not.toBe(tools2);

    // But contain same tools
    expect(tools1.length).toBe(tools2.length);
    expect(tools1[0]).toBe(tools2[0]);
  });

  it("should maintain tool order", () => {
    const readTool = new ReadFileTool(mockFS);
    const listTool = new ListDirectoryTool(mockFS);

    registry.register(readTool);
    registry.register(listTool);

    const tools = registry.getAll();

    // Tools should be retrievable in consistent order
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain("read_file");
    expect(toolNames).toContain("list_directory");
  });

  it("should handle tool with same name but different instance", () => {
    // Create two different mock filesystems
    const mockFS1 = new MockFileSystem();
    const mockFS2 = new MockFileSystem();

    const readTool1 = new ReadFileTool(mockFS1);
    const readTool2 = new ReadFileTool(mockFS2);

    registry.register(readTool1);
    expect(registry.get("read_file")).toBe(readTool1);

    registry.register(readTool2);
    expect(registry.get("read_file")).toBe(readTool2);
    expect(registry.get("read_file")).not.toBe(readTool1);
  });
});
